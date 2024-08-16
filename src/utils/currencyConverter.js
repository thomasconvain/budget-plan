export const fetchConversionRate = async (fromCurrency, toCurrency) => {
  const response = await fetch(`https://us-central1-budget-plan-2c150.cloudfunctions.net/getConversionRate?from=${fromCurrency}&to=${toCurrency}`);
  const data = await response.json();
  return data.conversionRate;
};
