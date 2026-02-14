// functions/billingPeriod.js
// Versión CommonJS de la utilidad de periodos de facturación.

/**
 * Obtiene la cantidad de días en un mes dado.
 * @param {number} year Año.
 * @param {number} month Mes (0-indexed).
 * @return {number} Días en el mes.
 */
function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Obtiene el día de facturación efectivo para un mes.
 * @param {number} billingDay Día de facturación.
 * @param {number} year Año.
 * @param {number} month Mes (0-indexed).
 * @return {number} Día efectivo.
 */
function getEffectiveBillingDay(billingDay, year, month) {
  return Math.min(billingDay, getDaysInMonth(year, month));
}

/**
 * Calcula el siguiente periodo de facturación.
 * @param {number} billingDay Día de facturación.
 * @param {Date} currentValidUntil Fecha de fin actual.
 * @return {{validFrom: Date, validUntil: Date}} Periodo.
 */
function calculateNextBillingPeriod(billingDay, currentValidUntil) {
  const validFrom = new Date(currentValidUntil);
  validFrom.setDate(validFrom.getDate() + 1);

  const curMonth = currentValidUntil.getMonth();
  const curYear = currentValidUntil.getFullYear();
  const nextMonth = curMonth === 11 ? 0 : curMonth + 1;
  const nextYear = curMonth === 11 ? curYear + 1 : curYear;
  const effectiveDay = getEffectiveBillingDay(
      billingDay, nextYear, nextMonth,
  );

  return {
    validFrom,
    validUntil: new Date(nextYear, nextMonth, effectiveDay),
  };
}

module.exports = {calculateNextBillingPeriod};
