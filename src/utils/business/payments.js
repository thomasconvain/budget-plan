/**
 * Funciones reutilizables para crear pagos en Firestore.
 * Usadas tanto por UserPaymentsList (manual) como por autoPayment (automático).
 */
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { deriveKey, encrypt } from '@/services/encryption';
import { db } from '@/firebase';

const auth = getAuth();

/**
 * Crea un pago en Firestore.
 * @param {Object} params
 * @param {string} params.goalId - ID del goal destino
 * @param {number} params.amount - Monto del pago (positivo para gasto, negativo para abono)
 * @param {string} params.currency - Moneda (CLP, USD, etc.)
 * @param {string} params.categoryName - Nombre de la categoría
 * @param {string} params.categoryIcon - Nombre del ícono de la categoría
 * @param {boolean} [params.isAutoDetected=false] - Si fue detectado automáticamente
 * @param {string} [params.merchant] - Nombre del comercio (para pagos auto-detectados)
 * @returns {Promise<{ id: string, amount: number, currency: string, category: string, categoryIcon: string }>}
 */
export async function createPayment({ goalId, amount, currency, categoryName, categoryIcon, isAutoDetected = false, merchant = '' }) {
  const user = auth.currentUser;
  if (!user || !goalId || !amount || !currency) {
    throw new Error('Faltan datos para crear el pago');
  }

  const key = deriveKey(user.uid);
  const encryptedCategory = encrypt(categoryName, key);
  const encryptedIcon = encrypt(categoryIcon, key);
  const encryptedAmount = encrypt(amount.toString(), key);

  const paymentData = {
    userId: user.uid,
    amount: encryptedAmount,
    category: encryptedCategory,
    categoryIcon: encryptedIcon,
    goalId,
    date: Timestamp.now(),
    currency,
  };

  // Campos adicionales para pagos auto-detectados
  if (isAutoDetected) {
    paymentData.autoDetected = true;
    if (merchant) {
      paymentData.merchant = encrypt(merchant, key);
    }
  }

  const paymentDoc = await addDoc(collection(db, 'payments'), paymentData);

  return {
    id: paymentDoc.id,
    amount,
    currency,
    category: categoryName,
    categoryIcon,
  };
}
