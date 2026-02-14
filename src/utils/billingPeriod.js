/**
 * Utilidad para calcular periodos de facturación basados en un día de corte.
 */

/**
 * Obtiene la cantidad de días en un mes dado.
 * @param {number} year
 * @param {number} month - 0-indexed (0 = enero, 11 = diciembre)
 * @returns {number}
 */
function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Obtiene el día de facturación efectivo para un mes (maneja meses con menos días).
 * Ej: billingDay=31 en febrero → 28 (o 29 si bisiesto).
 * @param {number} billingDay
 * @param {number} year
 * @param {number} month - 0-indexed
 * @returns {number}
 */
function getEffectiveBillingDay(billingDay, year, month) {
  return Math.min(billingDay, getDaysInMonth(year, month));
}

/**
 * Calcula el periodo de facturación actual basado en un día de corte.
 *
 * Si hoy es antes o igual al día de facturación del mes actual:
 *   → periodo = (billingDay del mes anterior + 1) hasta (billingDay del mes actual)
 *
 * Si hoy es después del día de facturación del mes actual:
 *   → periodo = (billingDay del mes actual + 1) hasta (billingDay del mes siguiente)
 *
 * @param {number} billingDay - Día del mes (1-31)
 * @param {Date} [referenceDate] - Fecha de referencia (default: hoy)
 * @returns {{ validFrom: Date, validUntil: Date }}
 */
export function calculateBillingPeriod(billingDay, referenceDate = new Date()) {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();

  const effectiveDay = getEffectiveBillingDay(billingDay, year, month);
  const billingDateThisMonth = new Date(year, month, effectiveDay);

  if (referenceDate <= billingDateThisMonth) {
    // Estamos antes o en el día de facturación → periodo termina este mes
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const prevEffectiveDay = getEffectiveBillingDay(billingDay, prevYear, prevMonth);

    return {
      validFrom: new Date(prevYear, prevMonth, prevEffectiveDay + 1),
      validUntil: billingDateThisMonth,
    };
  } else {
    // Estamos después del día de facturación → periodo termina el mes siguiente
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    const nextEffectiveDay = getEffectiveBillingDay(billingDay, nextYear, nextMonth);

    return {
      validFrom: new Date(year, month, effectiveDay + 1),
      validUntil: new Date(nextYear, nextMonth, nextEffectiveDay),
    };
  }
}

/**
 * Calcula el siguiente periodo de facturación a partir de un validUntil existente.
 * Usado por la Cloud Function al renovar automáticamente.
 *
 * @param {number} billingDay
 * @param {Date} currentValidUntil - Fecha de facturación del periodo actual
 * @returns {{ validFrom: Date, validUntil: Date }}
 */
export function calculateNextBillingPeriod(billingDay, currentValidUntil) {
  const validFrom = new Date(currentValidUntil);
  validFrom.setDate(validFrom.getDate() + 1);

  const nextMonth = currentValidUntil.getMonth() === 11 ? 0 : currentValidUntil.getMonth() + 1;
  const nextYear = currentValidUntil.getMonth() === 11 ? currentValidUntil.getFullYear() + 1 : currentValidUntil.getFullYear();
  const effectiveDay = getEffectiveBillingDay(billingDay, nextYear, nextMonth);

  return {
    validFrom,
    validUntil: new Date(nextYear, nextMonth, effectiveDay),
  };
}
