// src/utils/currencyFormatter.js

// Función para formatear a pesos chilenos
export const formatCurrency = value => {
  const formatter = new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0
  });
  return formatter.format(value);
};

// Función para desformatear un string de moneda a número
export const parseCurrency = value => {
  return parseInt(value.replace(/[^0-9]/g, ''), 10);
};

// Función para formatear números con separadores de miles
export const formatNumber = (value) => {
  if (!value) return '';
  
  // Asegurarnos de que value sea un número
  const num = parseFloat(value, 10);
  
  if (isNaN(num)) return '';

  // Formatear el número con puntos cada 3 dígitos
  return num.toLocaleString('es-CL', { maximumFractionDigits: 0 });
};
