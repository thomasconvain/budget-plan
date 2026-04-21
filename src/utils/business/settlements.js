import { getAuth } from 'firebase/auth';
import {
  getFirestore, collection, query, where, getDocs, doc, writeBatch, Timestamp, increment
} from 'firebase/firestore';
import { fetchSharedExpensesWith } from './sharedExpenses';

const auth = getAuth();
const db = getFirestore();

/**
 * Obtiene todas las liquidaciones entre el usuario actual y un contacto.
 * @param {string} contactUserId
 * @returns {Promise<Array>}
 */
export async function fetchSettlementsWith(contactUserId) {
  const user = auth.currentUser;
  if (!user) return [];

  const q1 = query(
    collection(db, 'settlements'),
    where('fromUserId', '==', user.uid),
    where('toUserId', '==', contactUserId)
  );
  const q2 = query(
    collection(db, 'settlements'),
    where('fromUserId', '==', contactUserId),
    where('toUserId', '==', user.uid)
  );

  const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
  return [
    ...snap1.docs.map(d => ({ id: d.id, ...d.data() })),
    ...snap2.docs.map(d => ({ id: d.id, ...d.data() })),
  ];
}

/**
 * Calcula la asignación FIFO de un monto sobre los gastos pendientes.
 * Consume los gastos más antiguos primero. Soporta saldos parciales.
 *
 * @param {number} amount - Monto a asignar.
 * @param {Array} expenses - Gastos compartidos cargados (con id, amount, settledAmount, currency, status, createdAt, recipientUserId).
 * @param {string} currency - Moneda de la liquidación; solo se consumen gastos en la misma moneda.
 * @param {string} debtorUserId - Usuario que debe (fromUserId del settlement). Solo se consumen gastos donde recipientUserId === debtorUserId.
 * @returns {Array<{expenseId: string, amount: number}>}
 * @throws {Error} si los gastos pendientes no alcanzan a cubrir el monto.
 */
export function buildFifoAllocations(amount, expenses, currency, debtorUserId) {
  const candidates = expenses
    .filter(e => e.status !== 'cancelled')
    .filter(e => e.currency === currency)
    .filter(e => e.recipientUserId === debtorUserId)
    .map(e => ({
      id: e.id,
      pending: Number(e.amount) - Number(e.settledAmount || 0),
      createdAt: e.createdAt?.toDate ? e.createdAt.toDate() : new Date(e.createdAt),
    }))
    .filter(e => e.pending > 0)
    .sort((a, b) => a.createdAt - b.createdAt);

  const allocations = [];
  let remaining = Number(amount);

  for (const c of candidates) {
    if (remaining <= 0) break;
    const take = Math.min(remaining, c.pending);
    allocations.push({ expenseId: c.id, amount: take });
    remaining -= take;
  }

  if (remaining > 0.0001) {
    throw new Error('El monto excede el balance pendiente disponible');
  }

  return allocations;
}

/**
 * Registra una liquidación (pago o reembolso) entre el usuario actual y un contacto.
 * Asigna el monto FIFO a los gastos pendientes más antiguos del deudor y persiste
 * atómicamente el settlement con sus allocations e incrementa settledAmount en cada gasto.
 *
 * @param {Object} params
 * @param {string} params.contactUserId
 * @param {number} params.amount
 * @param {string} params.currency
 * @param {string} params.note
 * @param {'i_pay'|'they_pay'} params.direction
 */
export async function createSettlement({ contactUserId, amount, currency, note, direction }) {
  const user = auth.currentUser;
  if (!user) throw new Error('No autenticado');

  const fromUserId = direction === 'i_pay' ? user.uid : contactUserId;
  const toUserId = direction === 'i_pay' ? contactUserId : user.uid;

  const expenses = await fetchSharedExpensesWith(contactUserId);
  const allocations = buildFifoAllocations(amount, expenses, currency, fromUserId);

  const batch = writeBatch(db);
  const settlementRef = doc(collection(db, 'settlements'));
  batch.set(settlementRef, {
    fromUserId,
    toUserId,
    amount: Math.abs(amount),
    currency,
    note: note || '',
    allocations,
    createdByUserId: user.uid,
    createdAt: Timestamp.now(),
  });

  for (const alloc of allocations) {
    const expenseRef = doc(db, 'sharedExpenses', alloc.expenseId);
    batch.update(expenseRef, { settledAmount: increment(alloc.amount) });
  }

  await batch.commit();
}
