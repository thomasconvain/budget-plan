import { getAuth } from 'firebase/auth';
import {
  getFirestore, collection, query, where, getDocs, addDoc, updateDoc, doc,
  getDoc, deleteDoc, Timestamp
} from 'firebase/firestore';
import { deriveKey, encrypt, decrypt } from '@/services/encryption';
import { convertToMainCurrency } from '@/utils/currencyConverter';

const auth = getAuth();
const db = getFirestore();

/**
 * Crea un gasto compartido.
 * @param {Object} params
 * @param {string} params.sourcePaymentId - ID del payment original
 * @param {string} params.sourceGoalId - ID del goal de donde se creó el gasto
 * @param {number} params.originalAmount - Monto total original (positivo)
 * @param {string} params.currency - Moneda del gasto
 * @param {string} params.category - Nombre de la categoría
 * @param {string} params.categoryIcon - Nombre del icono
 * @param {string} params.recipientUserId - UID del destinatario
 * @param {string} params.recipientName - Nombre del destinatario
 * @param {number} params.splitPercentage - Porcentaje a compartir (ej: 50)
 */
export async function createSharedExpense({
  sourcePaymentId,
  sourceGoalId,
  originalAmount,
  currency,
  category,
  categoryIcon,
  recipientUserId,
  recipientName,
  splitPercentage,
}) {
  const user = auth.currentUser;
  if (!user) throw new Error('No autenticado');

  const sharedAmount = Math.abs(originalAmount) * (splitPercentage / 100);

  await addDoc(collection(db, 'sharedExpenses'), {
    createdByUserId: user.uid,
    createdByName: user.displayName || user.email,
    sourcePaymentId,
    sourceGoalId,
    amount: sharedAmount,
    originalAmount: Math.abs(originalAmount),
    currency,
    category,
    categoryIcon,
    splitPercentage,
    recipientUserId,
    recipientName,
    recipientGoalId: null,
    recipientPaymentId: null,
    status: 'pending',
    createdAt: Timestamp.now(),
    assignedAt: null,
  });

  // Ajustar el pago y balance del creador: solo debe quedar su parte (original - compartido)
  const key = deriveKey(user.uid);
  const paymentSnap = await getDoc(doc(db, 'payments', sourcePaymentId));
  const goalSnap = await getDoc(doc(db, 'goals', sourceGoalId));
  if (!paymentSnap.exists() || !goalSnap.exists()) return;

  let currentPaymentAmount;
  try {
    currentPaymentAmount = parseFloat(decrypt(paymentSnap.data().amount, key));
  } catch {
    return;
  }
  const creatorAmount = Math.abs(currentPaymentAmount) - sharedAmount;
  const paymentCurrency = paymentSnap.data().currency || currency;
  const goalData = goalSnap.data();
  let goalType, mainCurrency, currentBalance;
  try {
    goalType = decrypt(goalData.type, key);
    mainCurrency = decrypt(goalData.mainCurrency, key);
    currentBalance = parseFloat(decrypt(goalData.currentBalanceOnAccount, key));
  } catch {
    return;
  }

  const sharedInMain = await convertToMainCurrency(
    sharedAmount,
    paymentCurrency,
    mainCurrency
  );

  const newPaymentAmount = creatorAmount <= 0 ? 0 : creatorAmount;
  await updateDoc(doc(db, 'payments', sourcePaymentId), {
    amount: encrypt(newPaymentAmount.toString(), key),
  });

  const newBalance = goalType === 'Cuenta bancaria'
    ? currentBalance + sharedInMain
    : currentBalance - sharedInMain;
  await updateDoc(doc(db, 'goals', sourceGoalId), {
    currentBalanceOnAccount: encrypt(newBalance.toString(), key),
  });
}

/**
 * Devuelve un mapa sourcePaymentId -> { recipientName, originalAmount, currency }
 * para los pagos que son origen de un gasto compartido creado por el usuario actual.
 * @param {string[]} sourcePaymentIds - IDs de payments (ej. los del goal actual)
 * @returns {Promise<Record<string, { recipientName: string, originalAmount: number, currency: string }>>}
 */
export async function getSharedRecipientNamesByPaymentIds(sourcePaymentIds) {
  const user = auth.currentUser;
  if (!user || !sourcePaymentIds.length) return {};

  const q = query(
    collection(db, 'sharedExpenses'),
    where('createdByUserId', '==', user.uid)
  );
  const snap = await getDocs(q);
  const idSet = new Set(sourcePaymentIds);
  const map = {};
  snap.docs.forEach(d => {
    const data = d.data();
    if (idSet.has(data.sourcePaymentId) && data.recipientName) {
      map[data.sourcePaymentId] = {
        recipientName: data.recipientName,
        originalAmount: Number(data.originalAmount) || 0,
        currency: data.currency || '',
        status: data.status || '',
      };
    }
  });
  return map;
}

/**
 * Devuelve un mapa recipientPaymentId -> { createdByName, amount, currency }
 * para los pagos que el usuario recibió como destinatario de un gasto compartido.
 * @param {string[]} paymentIds - IDs de payments del goal actual
 * @returns {Promise<Record<string, { createdByName: string, amount: number, currency: string }>>}
 */
export async function getSharedCreatorNamesByPaymentIds(paymentIds) {
  const user = auth.currentUser;
  if (!user || !paymentIds.length) return {};

  const q = query(
    collection(db, 'sharedExpenses'),
    where('recipientUserId', '==', user.uid),
    where('status', '==', 'assigned')
  );
  const snap = await getDocs(q);
  const idSet = new Set(paymentIds);
  const map = {};
  snap.docs.forEach(d => {
    const data = d.data();
    if (idSet.has(data.recipientPaymentId) && data.createdByName) {
      map[data.recipientPaymentId] = {
        createdByName: data.createdByName,
        amount: Number(data.originalAmount) || 0,
        currency: data.currency || '',
      };
    }
  });
  return map;
}

/**
 * Obtiene los gastos compartidos pendientes para el usuario actual (como destinatario).
 */
export async function fetchPendingSharedExpenses() {
  const user = auth.currentUser;
  if (!user) return [];

  const q = query(
    collection(db, 'sharedExpenses'),
    where('recipientUserId', '==', user.uid),
    where('status', '==', 'pending')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Obtiene los gastos compartidos enviados por el usuario actual.
 */
export async function fetchSentSharedExpenses() {
  const user = auth.currentUser;
  if (!user) return [];

  const q = query(
    collection(db, 'sharedExpenses'),
    where('createdByUserId', '==', user.uid)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Asigna un gasto compartido a un goal del destinatario.
 * Crea un payment encriptado en el goal elegido y actualiza el balance.
 * @param {string} expenseId - ID del sharedExpense
 * @param {Object} goal - El goal del destinatario { id, mainCurrency, currentBalanceOnAccount, type }
 * @param {Object} expense - El objeto sharedExpense { amount, currency, category, categoryIcon }
 */
export async function assignSharedExpense(expenseId, goal, expense) {
  const user = auth.currentUser;
  if (!user) throw new Error('No autenticado');

  const key = deriveKey(user.uid);

  // Convertir moneda si es necesario
  const convertedAmount = await convertToMainCurrency(
    expense.amount,
    expense.currency,
    goal.mainCurrency
  );

  // Crear payment encriptado en el goal del destinatario
  const encryptedAmount = encrypt(convertedAmount.toString(), key);
  const encryptedCategory = encrypt(expense.category, key);
  const encryptedIcon = encrypt(expense.categoryIcon, key);

  const paymentRef = await addDoc(collection(db, 'payments'), {
    userId: user.uid,
    amount: encryptedAmount,
    category: encryptedCategory,
    categoryIcon: encryptedIcon,
    goalId: goal.id,
    date: Timestamp.now(),
    currency: goal.mainCurrency,
  });

  // Actualizar balance del goal
  const newBalance = goal.type === 'Cuenta bancaria'
    ? goal.currentBalanceOnAccount - convertedAmount
    : goal.currentBalanceOnAccount + convertedAmount;

  const encryptedBalance = encrypt(newBalance.toString(), key);
  await updateDoc(doc(db, 'goals', goal.id), {
    currentBalanceOnAccount: encryptedBalance,
  });

  // Marcar el gasto compartido como asignado (guardar datos para revertir si el creador elimina)
  await updateDoc(doc(db, 'sharedExpenses', expenseId), {
    status: 'assigned',
    recipientGoalId: goal.id,
    recipientPaymentId: paymentRef.id,
    recipientAmountInMainCurrency: convertedAmount,
    recipientGoalType: goal.type,
    assignedAt: Timestamp.now(),
  });
}

/**
 * Cuando el destinatario elimina un payment que recibió como gasto compartido,
 * actualiza el sharedExpense a cancelled para mantener consistencia.
 * @param {string} paymentId - ID del payment que el destinatario está eliminando
 */
export async function markSharedExpenseCancelledWhenRecipientDeletes(paymentId) {
  const user = auth.currentUser;
  if (!user || !paymentId) return;

  const q = query(
    collection(db, 'sharedExpenses'),
    where('recipientUserId', '==', user.uid),
    where('recipientPaymentId', '==', paymentId),
    where('status', '==', 'assigned')
  );
  const snap = await getDocs(q);
  for (const d of snap.docs) {
    await updateDoc(doc(db, 'sharedExpenses', d.id), {
      status: 'cancelled',
      cancelledBy: 'recipient',
      cancelledAt: Timestamp.now(),
    });
  }
}

/**
 * Procesa los ajustes de balance pendientes (cuando el creador eliminó un gasto compartido).
 * El backend crea balanceAdjustments que el destinatario debe aplicar.
 */
export async function processBalanceAdjustments() {
  const user = auth.currentUser;
  if (!user) return;

  const key = deriveKey(user.uid);
  const q = query(
    collection(db, 'balanceAdjustments'),
    where('userId', '==', user.uid)
  );
  const snap = await getDocs(q);
  if (snap.empty) return;

  for (const adjDoc of snap.docs) {
    const adj = adjDoc.data();
    try {
      const goalRef = doc(db, 'goals', adj.goalId);
      const goalSnap = await getDoc(goalRef);
      if (!goalSnap.exists()) {
        await deleteDoc(doc(db, 'balanceAdjustments', adjDoc.id));
        continue;
      }

      const goalData = goalSnap.data();
      const currentBalance = parseFloat(decrypt(goalData.currentBalanceOnAccount, key));
      const amountToAdd = Number(adj.amountInMainCurrency) || 0;
      const goalType = adj.goalType || 'Cuenta bancaria';

      const newBalance = goalType === 'Cuenta bancaria'
        ? currentBalance + amountToAdd
        : currentBalance - amountToAdd;

      await updateDoc(goalRef, {
        currentBalanceOnAccount: encrypt(newBalance.toString(), key),
      });
    } catch (e) {
      console.error('Error aplicando ajuste de balance:', e);
    } finally {
      await deleteDoc(doc(db, 'balanceAdjustments', adjDoc.id));
    }
  }
}

/**
 * Descarta un gasto compartido.
 */
export async function dismissSharedExpense(expenseId) {
  await updateDoc(doc(db, 'sharedExpenses', expenseId), {
    status: 'cancelled',
    cancelledBy: 'recipient',
    cancelledAt: Timestamp.now(),
  });
}

/**
 * Cuando el creador elimina su pago origen, marca el gasto compartido asignado como cancelado.
 * Esto permite que el destinatario detecte la cancelación y limpie su payment en el siguiente refresco.
 * @param {string} sourcePaymentId - ID del payment origen que el creador está eliminando
 */
export async function cancelSharedExpenseByCreator(sourcePaymentId) {
  const user = auth.currentUser;
  if (!user || !sourcePaymentId) return;

  const q = query(
    collection(db, 'sharedExpenses'),
    where('createdByUserId', '==', user.uid),
    where('sourcePaymentId', '==', sourcePaymentId),
  );
  const snap = await getDocs(q);
  for (const d of snap.docs) {
    const data = d.data();
    if (data.status === 'pending' || data.status === 'assigned') {
      await updateDoc(doc(db, 'sharedExpenses', d.id), {
        status: 'cancelled',
        cancelledBy: 'creator',
        cancelledAt: Timestamp.now(),
      });
    }
  }
}

/**
 * Para el destinatario: detecta y elimina los payments que corresponden a
 * gastos compartidos cancelados por el creador. Ajusta el balance del goal.
 * Llamar después de fetchPaymentsForGoal para limpiar pagos huérfanos.
 * @param {string[]} paymentIds - IDs de payments del goal actual
 * @param {string} goalId - ID del goal actual
 * @param {string} goalType - Tipo del goal
 * @returns {Promise<string[]>} IDs de los payments eliminados
 */
export async function cleanupCancelledSharedExpensesAsRecipient(paymentIds, goalId, goalType) {
  const user = auth.currentUser;
  if (!user || !paymentIds.length) return [];

  const key = deriveKey(user.uid);
  const paymentIdSet = new Set(paymentIds);

  const q = query(
    collection(db, 'sharedExpenses'),
    where('recipientUserId', '==', user.uid),
    where('recipientGoalId', '==', goalId),
    where('status', '==', 'cancelled')
  );
  const snap = await getDocs(q);
  if (snap.empty) return [];

  const deletedPaymentIds = [];

  for (const d of snap.docs) {
    const data = d.data();
    // Solo procesar si el payment aún existe en este goal (no fue eliminado ya por Cloud Function)
    if (!data.recipientPaymentId || !paymentIdSet.has(data.recipientPaymentId)) continue;
    if (data.recipientAmountInMainCurrency == null) continue;

    try {
      await deleteDoc(doc(db, 'payments', data.recipientPaymentId));
      deletedPaymentIds.push(data.recipientPaymentId);

      // Ajustar el balance del goal del destinatario (revertir el efecto de la asignación)
      const goalRef = doc(db, 'goals', goalId);
      const goalSnap = await getDoc(goalRef);
      if (goalSnap.exists()) {
        const currentBalance = parseFloat(decrypt(goalSnap.data().currentBalanceOnAccount, key));
        const amount = Number(data.recipientAmountInMainCurrency);
        const newBalance = goalType === 'Cuenta bancaria'
          ? currentBalance + amount
          : currentBalance - amount;
        await updateDoc(goalRef, {
          currentBalanceOnAccount: encrypt(newBalance.toString(), key),
        });
      }
    } catch (e) {
      console.error('Error limpiando gasto compartido cancelado:', e);
    }
  }

  return deletedPaymentIds;
}

/**
 * Para el creador: cuando el destinatario eliminó su payment asignado,
 * elimina el pago origen del creador y ajusta el balance de su goal.
 * @param {string[]} paymentIds - IDs de payments del goal actual
 * @param {string} goalId - ID del goal actual
 * @param {string} goalType - Tipo del goal
 * @param {string} goalMainCurrency - Moneda principal del goal (ya descifrada)
 * @returns {Promise<string[]>} IDs de los payments eliminados
 */
export async function cleanupCancelledSharedExpensesAsCreator(paymentIds, goalId, goalType, goalMainCurrency) {
  const user = auth.currentUser;
  if (!user || !paymentIds.length) return [];

  const key = deriveKey(user.uid);
  const paymentIdSet = new Set(paymentIds);

  const q = query(
    collection(db, 'sharedExpenses'),
    where('createdByUserId', '==', user.uid),
    where('sourceGoalId', '==', goalId),
    where('status', '==', 'cancelled')
  );
  const snap = await getDocs(q);
  if (snap.empty) return [];

  const deletedPaymentIds = [];

  for (const d of snap.docs) {
    const data = d.data();
    // Solo procesar si el pago origen aún existe en este goal
    if (!data.sourcePaymentId || !paymentIdSet.has(data.sourcePaymentId)) continue;

    try {
      // Calcular el monto que el creador tenía en su goal (su parte de la división)
      const sharedAmount = Number(data.originalAmount) * (Number(data.splitPercentage) / 100);
      const creatorAmount = Number(data.originalAmount) - sharedAmount;
      const creatorAmountInMain = await convertToMainCurrency(creatorAmount, data.currency, goalMainCurrency);

      // Eliminar el pago origen del creador
      await deleteDoc(doc(db, 'payments', data.sourcePaymentId));
      deletedPaymentIds.push(data.sourcePaymentId);

      // Restaurar el balance del goal del creador
      const goalRef = doc(db, 'goals', goalId);
      const goalSnap = await getDoc(goalRef);
      if (goalSnap.exists()) {
        const currentBalance = parseFloat(decrypt(goalSnap.data().currentBalanceOnAccount, key));
        const newBalance = goalType === 'Cuenta bancaria'
          ? currentBalance + creatorAmountInMain
          : currentBalance - creatorAmountInMain;
        await updateDoc(goalRef, {
          currentBalanceOnAccount: encrypt(newBalance.toString(), key),
        });
      }
    } catch (e) {
      console.error('Error limpiando gasto compartido cancelado para creador:', e);
    }
  }

  return deletedPaymentIds;
}

/**
 * Obtiene todos los gastos compartidos entre el usuario actual y un contacto específico.
 * @param {string} contactUserId - UID del contacto
 * @returns {Promise<Array>}
 */
export async function fetchSharedExpensesWith(contactUserId) {
  const user = auth.currentUser;
  if (!user) return [];

  const q1 = query(
    collection(db, 'sharedExpenses'),
    where('createdByUserId', '==', user.uid),
    where('recipientUserId', '==', contactUserId)
  );
  const q2 = query(
    collection(db, 'sharedExpenses'),
    where('createdByUserId', '==', contactUserId),
    where('recipientUserId', '==', user.uid)
  );

  const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
  return [
    ...snap1.docs.map(d => ({ id: d.id, ...d.data() })),
    ...snap2.docs.map(d => ({ id: d.id, ...d.data() })),
  ].sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate());
}
