import { getAuth } from 'firebase/auth';
import {
  getFirestore, doc, writeBatch
} from 'firebase/firestore';
import { fetchContacts } from '../invitations';
import { fetchSharedExpensesWith } from '../sharedExpenses';
import { fetchSettlementsWith } from '../settlements';

const auth = getAuth();
const db = getFirestore();

/**
 * Migración one-shot. Recorre todos los pares (usuario actual ↔ contacto) y
 * recalcula desde cero el campo settledAmount de cada gasto y el campo
 * allocations de cada liquidación, aplicando FIFO en orden cronológico.
 *
 * Idempotente: cada par se procesa reseteando primero settledAmount=0 en
 * todos los gastos, así que correrla varias veces produce el mismo estado.
 *
 * Requiere que la regla de Firestore permita update sobre /settlements/{id}
 * para el usuario que es parte del par. Tras correr la migración, restaurar
 * la regla a su estado original (write-once) si así se desea.
 *
 * @param {(msg: string) => void} [log] - callback opcional para reporting.
 * @returns {Promise<{pairs: number, expenses: number, settlements: number, settled: number}>}
 */
export async function backfillSettlementAllocations(log = () => {}) {
  const user = auth.currentUser;
  if (!user) throw new Error('No autenticado');

  const contacts = await fetchContacts();
  log(`Contactos a procesar: ${contacts.length}`);

  const stats = { pairs: 0, expenses: 0, settlements: 0, settled: 0 };

  for (const contact of contacts) {
    log(`\n--- Par: ${contact.name} (${contact.userId}) ---`);

    const [expenses, settlements] = await Promise.all([
      fetchSharedExpensesWith(contact.userId),
      fetchSettlementsWith(contact.userId),
    ]);

    log(`  Gastos: ${expenses.length}, Liquidaciones: ${settlements.length}`);

    // Estado en memoria: pending por gasto. Se mutará al asignar.
    const pendingByExpense = new Map();
    for (const e of expenses) {
      if (e.status === 'cancelled') {
        pendingByExpense.set(e.id, 0);
      } else {
        pendingByExpense.set(e.id, Number(e.amount));
      }
    }

    // Acumulado de settledAmount final por gasto.
    const settledByExpense = new Map();
    for (const e of expenses) settledByExpense.set(e.id, 0);

    // Allocations a escribir por settlement.
    const allocationsBySettlement = new Map();

    const orderedSettlements = [...settlements].sort((a, b) => {
      const da = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
      const db2 = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
      return da - db2;
    });

    for (const s of orderedSettlements) {
      // Candidatos: gastos no cancelados, misma moneda, recipient === debtor (s.fromUserId),
      // creados antes o el mismo día que la liquidación, con saldo pendiente.
      const sDate = s.createdAt?.toDate ? s.createdAt.toDate() : new Date(s.createdAt);
      const candidates = expenses
        .filter(e => e.status !== 'cancelled')
        .filter(e => e.currency === s.currency)
        .filter(e => e.recipientUserId === s.fromUserId)
        .filter(e => {
          const eDate = e.createdAt?.toDate ? e.createdAt.toDate() : new Date(e.createdAt);
          return eDate <= sDate;
        })
        .filter(e => pendingByExpense.get(e.id) > 0)
        .map(e => ({
          id: e.id,
          createdAt: e.createdAt?.toDate ? e.createdAt.toDate() : new Date(e.createdAt),
        }))
        .sort((a, b) => a.createdAt - b.createdAt);

      const allocations = [];
      let remaining = Number(s.amount);

      for (const c of candidates) {
        if (remaining <= 0) break;
        const pending = pendingByExpense.get(c.id);
        const take = Math.min(remaining, pending);
        if (take <= 0) continue;
        allocations.push({ expenseId: c.id, amount: take });
        pendingByExpense.set(c.id, pending - take);
        settledByExpense.set(c.id, settledByExpense.get(c.id) + take);
        remaining -= take;
      }

      if (remaining > 0.0001) {
        log(`  ⚠ Liquidación ${s.id} (${s.currency} ${s.amount}) no pudo asignarse completa. Sobra ${remaining}.`);
      }

      allocationsBySettlement.set(s.id, allocations);
    }

    // Persistencia en batches de 400 (límite Firestore: 500 ops/batch).
    let batch = writeBatch(db);
    let opsInBatch = 0;
    const flush = async () => {
      if (opsInBatch === 0) return;
      await batch.commit();
      batch = writeBatch(db);
      opsInBatch = 0;
    };

    // Reset + set settledAmount final por gasto.
    for (const e of expenses) {
      const finalSettled = settledByExpense.get(e.id) || 0;
      batch.update(doc(db, 'sharedExpenses', e.id), { settledAmount: finalSettled });
      opsInBatch++;
      if (opsInBatch >= 400) await flush();
      if (finalSettled > 0) stats.settled++;
    }

    // Allocations por settlement.
    for (const s of orderedSettlements) {
      const allocations = allocationsBySettlement.get(s.id) || [];
      batch.update(doc(db, 'settlements', s.id), { allocations });
      opsInBatch++;
      if (opsInBatch >= 400) await flush();
    }

    await flush();

    stats.pairs++;
    stats.expenses += expenses.length;
    stats.settlements += orderedSettlements.length;

    log(`  ✔ Par procesado.`);
  }

  log(`\n=== Migración completa ===`);
  log(`Pares: ${stats.pairs}`);
  log(`Gastos procesados: ${stats.expenses} (${stats.settled} con saldo asignado)`);
  log(`Liquidaciones procesadas: ${stats.settlements}`);

  return stats;
}
