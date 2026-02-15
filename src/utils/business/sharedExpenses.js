import { getAuth } from 'firebase/auth';
import {
  getFirestore, collection, query, where, getDocs, addDoc, updateDoc, doc,
  getDoc, Timestamp
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

  // Marcar el gasto compartido como asignado
  await updateDoc(doc(db, 'sharedExpenses', expenseId), {
    status: 'assigned',
    recipientGoalId: goal.id,
    recipientPaymentId: paymentRef.id,
    assignedAt: Timestamp.now(),
  });
}

/**
 * Descarta un gasto compartido.
 */
export async function dismissSharedExpense(expenseId) {
  await updateDoc(doc(db, 'sharedExpenses', expenseId), {
    status: 'dismissed',
  });
}
