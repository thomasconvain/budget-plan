// src/utils/currencyConverter.js

import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  Timestamp
} from 'firebase/firestore';

const db = getFirestore();

/**
 * Obtiene (y guarda sólo UNA VEZ) la tasa de conversión de una moneda a otra para el día actual.
 *
 * @param {string} fromCurrency - ISO code de moneda origen ('USD', 'CLP', 'COP').
 * @param {string} toCurrency   - ISO code de moneda destino.
 * @returns {Promise<number>}   - La tasa de conversión.
 */
export const fetchConversionRate = async (fromCurrency, toCurrency) => {
  // 1) Preparamos la fecha YYYY-MM-DD
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const dateString = `${yyyy}-${mm}-${dd}`;

  // 2) ID único por par de monedas + fecha
  const rateId = `${fromCurrency}_${toCurrency}_${dateString}`;

  // 3) Referencia al doc determinístico
  const rateDocRef = doc(db, 'conversion-rates', rateId);
  const existing = await getDoc(rateDocRef);
  if (existing.exists()) {
    return existing.data().conversionRate;
  }

  // 4) Si no existe, la pedimos al servicio externo
  const res = await fetch(
    `https://us-central1-budget-plan-2c150.cloudfunctions.net/getConversionRate?from=${fromCurrency}&to=${toCurrency}`
  );
  const { conversionRate } = await res.json();

  // 5) Guardamos con setDoc (crea/upserta sólo una vez con este ID)
  await setDoc(rateDocRef, {
    fromCurrency,
    toCurrency,
    conversionRate,
    date: Timestamp.fromDate(new Date(dateString))
  });

  return conversionRate;
};

/**
 * Convierte un monto desde la moneda de pago a la moneda principal.
 *
 * @param {number} amount          - Monto original.
 * @param {string} paymentCurrency - Código ISO de la moneda del monto.
 * @param {string} mainCurrency    - Código ISO de la moneda destino.
 * @returns {Promise<number>}      - Monto convertido.
 */
export async function convertToMainCurrency(amount, paymentCurrency, mainCurrency) {
  // 1) Si ya es la misma moneda, devolvemos el monto tal cual
  if (paymentCurrency === mainCurrency) {
    return amount;
  }

  try {
    // 2) Buscamos la tasa y aplicamos la conversión
    const rate = await fetchConversionRate(paymentCurrency, mainCurrency);
    return amount * rate;
  } catch (err) {
    console.warn(
      `Error al convertir ${amount} de ${paymentCurrency} a ${mainCurrency}:`,
      err
    );
    // En caso de fallo, devolvemos el monto sin convertir
    return amount;
  }
}
