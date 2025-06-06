// src/utils/currencyConverter.js

import {
  getFirestore,
  doc,
  getDoc
} from "firebase/firestore";

const db = getFirestore();

/**
 * Lee la tasa ya precargada en Firestore para 'fromCurrency→toCurrency' en la fecha de hoy.
 * Si no existe el doc, devuelve null (o puedes decidir llamar al endpoint como fallback).
 *
 * @param {string} fromCurrency  - ISO code de moneda origen.
 * @param {string} toCurrency    - ISO code de moneda destino.
 * @returns {Promise<number|null>}
 */
export const fetchConversionRate = async (fromCurrency, toCurrency) => {
  // 1) Formateamos la fecha *de la misma forma* que en el Cloud Function.
  const today = new Date();
  const yyyy = today.getUTCFullYear();
  const mm = String(today.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(today.getUTCDate()).padStart(2, "0");
  const dateString = `${yyyy}-${mm}-${dd}`;

  // 2) Construimos el ID del doc
  const rateId = `${fromCurrency}_${toCurrency}_${dateString}`;
  const rateDocRef = doc(db, "conversion-rates", rateId);
  const snap = await getDoc(rateDocRef);
  if (!snap.exists()) {
    console.warn(`No existe conversión para ${rateId}.`);
    return null; // O podrías elegir disparar un fallback aquí
  }

  return snap.data().conversionRate;
};

/**
 * Convierte un monto usando la tasa precargada por el job nocturno.
 *
 * @param {number} amount
 * @param {string} paymentCurrency
 * @param {string} mainCurrency
 * @returns {Promise<number>}
 */
export async function convertToMainCurrency(amount, paymentCurrency, mainCurrency) {
  if (paymentCurrency === mainCurrency) {
    return amount;
  }

  const rate = await fetchConversionRate(paymentCurrency, mainCurrency);
  if (rate == null) {
    // Si no existe la tasa (p. ej. falla del job nocturno), devolvemos el monto sin convertir
    return amount;
  }
  return amount * rate;
}
