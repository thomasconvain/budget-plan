// src/utils/currencyFormatter.js

// Formatea un número según la moneda:
//  - CLP, COP → 0 decimales, locales es-CL y es-CO respectivamente
//  - resto → 2 decimales, locale es-CL (puedes cambiar a en-US si prefieres)
export const formatNumber = (value, currency) => {
  const zeroDecimalCurrencies = ['CLP', 'COP'];
  const fractionDigits = zeroDecimalCurrencies.includes(currency) ? 0 : 2;

  // Define locale según la moneda
  const locale = currency === 'COP'
    ? 'es-CO'
    : currency === 'CLP' ? 'es-CL'
    : currency === 'USD' ? 'en-US'
    : currency === 'EUR' ? 'es-ES' :
    'es-CL';

  const formatter = new Intl.NumberFormat(locale, {
    style: 'decimal',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });

  return formatter.format(value);
};
