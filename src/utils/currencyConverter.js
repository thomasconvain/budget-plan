import { getFirestore, collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';

const db = getFirestore();

export const fetchConversionRate = async (fromCurrency, toCurrency) => {
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));

  // Paso 1: Verificar si la tasa de conversión ya está almacenada en Firestore para el día de hoy
  const conversionRateRef = collection(db, 'conversion-rates');
  const q = query(conversionRateRef, 
    where('fromCurrency', '==', fromCurrency), 
    where('toCurrency', '==', toCurrency), 
    where('date', '>=', Timestamp.fromDate(startOfDay))
  );

  const querySnapshot = await getDocs(q);
  
  if (!querySnapshot.empty) {
    // Si ya existe una tasa de conversión para hoy, devolverla
    const doc = querySnapshot.docs[0];
    return doc.data().conversionRate;
  }

  // Paso 2: Si no existe, consultar la API
  const response = await fetch(`https://us-central1-budget-plan-2c150.cloudfunctions.net/getConversionRate?from=${fromCurrency}&to=${toCurrency}`);
  const data = await response.json();
  const conversionRate = data.conversionRate;

  // Paso 3: Guardar la nueva tasa de conversión en Firestore
  await addDoc(conversionRateRef, {
    fromCurrency: fromCurrency,
    toCurrency: toCurrency,
    conversionRate: conversionRate,
    date: Timestamp.fromDate(new Date())
  });

  // Devolver la tasa de conversión
  return conversionRate;
};
