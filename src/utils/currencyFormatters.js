// src/utils/currencyFormatter.js

// Función para formatear una moneda específica (CLP, USD, etc.)
export const formatNumber = (value, currency) => {
  const isCLP = currency === 'CLP';

  const formatter = new Intl.NumberFormat(
    isCLP ? 'es-CL' : 'es-CL', // Configurar la localización según la moneda
    {
      style: 'decimal',
      currency: currency, // Define la moneda
      minimumFractionDigits: isCLP ? 0 : 2, // 0 decimales para CLP, 2 para USD
      maximumFractionDigits: isCLP ? 0 : 2 // Limitar también el máximo
    }
  );
  return formatter.format(value);
};
