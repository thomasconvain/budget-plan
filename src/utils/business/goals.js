// src/services/goals.js  (o donde tengas este método)
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where
} from 'firebase/firestore';
import { deriveKey, decrypt } from '@/services/encryption';

const auth = getAuth();
const db = getFirestore();


function tryDecrypt(strOrFallback, key, parser = x => x) {
  try {
    const dec = decrypt(strOrFallback, key);
    return parser(dec);
  } catch {
    return typeof strOrFallback === 'string'
      ? parser(strOrFallback)
      : strOrFallback;
  }
}

export const fetchGoals = async () => {
  const user = auth.currentUser;
  if (!user) return [];

  // 1) Deriva la clave una sola vez por llamada
  const key = deriveKey(user.uid);

  // 2) Construye y ejecuta la consulta
  const q = query(
    collection(db, 'goals'),
    where('userId', '==', user.uid)
  );
  const querySnapshot = await getDocs(q);

  // 3) Mapea y descifra
  const result = querySnapshot.docs.map(doc => {
    const data = doc.data();

    // Descifra cada campo que guardaste encriptado
    let title, type, decryptedAvailableAmount, availableAmount, decryptedCurrentBalanceOnAccount, currentBalanceOnAccount, mainCurrency;

      title       = tryDecrypt(data.title, key);
      type = tryDecrypt(data.type, key);
      decryptedAvailableAmount = tryDecrypt(data.availableAmount, key);
      availableAmount = parseFloat(decryptedAvailableAmount);
      decryptedCurrentBalanceOnAccount = tryDecrypt(data.currentBalanceOnAccount, key);
      currentBalanceOnAccount = parseFloat(decryptedCurrentBalanceOnAccount);
      mainCurrency = tryDecrypt(data.mainCurrency, key);

    // Si tienes otros campos cifrados, añádelos aquí:
    // por ejemplo, si targetAmount era string cifrado:
    // let targetAmount = parseFloat(decrypt(data.targetAmount, key));

    return {
      id: doc.id,
      // Mantenemos el resto de datos crudos
      ...data,
      // Sobrescribimos los campos descifrados
      title,
      type,
      availableAmount,
      currentBalanceOnAccount,
      mainCurrency,
    };
  });

  return result;
};
