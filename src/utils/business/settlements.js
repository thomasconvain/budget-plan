import { getAuth } from 'firebase/auth';
import {
  getFirestore, collection, query, where, getDocs, addDoc, Timestamp
} from 'firebase/firestore';

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
 * Registra una liquidación (pago o reembolso) entre el usuario actual y un contacto.
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

  await addDoc(collection(db, 'settlements'), {
    fromUserId,
    toUserId,
    amount: Math.abs(amount),
    currency,
    note: note || '',
    createdByUserId: user.uid,
    createdAt: Timestamp.now(),
  });
}
