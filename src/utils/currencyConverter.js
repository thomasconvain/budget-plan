export const fetchConversionRate = async (fromCurrency, toCurrency) => {
    const api_key = '8420e331e2699a89c6784062';
    const response = await fetch(`https://v6.exchangerate-api.com/v6/${api_key}/pair/${fromCurrency}/${toCurrency}`);
    const data = await response.json();
    const conversionRate = data.conversion_rate;
    return conversionRate; // Devolver la tasa de conversión si es necesario
}