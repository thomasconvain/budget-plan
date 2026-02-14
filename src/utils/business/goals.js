// src/services/goals.js  (o donde tengas este método)
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter
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

/**
 * Fetch de tarjetas archivadas con paginación real desde Firestore.
 * @param {number} pageSize - Cantidad de documentos por página
 * @param {DocumentSnapshot|null} lastDoc - Último documento de la página anterior (cursor)
 * @returns {{ goals: Array, lastDoc: DocumentSnapshot|null, hasMore: boolean }}
 */
export const fetchArchivedGoals = async (pageSize = 3, lastDoc = null) => {
  const user = auth.currentUser;
  if (!user) return { goals: [], lastDoc: null, hasMore: false };

  const key = deriveKey(user.uid);

  const constraints = [
    collection(db, 'goals'),
    where('userId', '==', user.uid),
    where('isArchived', '==', true),
    orderBy('validUntil', 'desc'),
    limit(pageSize),
  ];

  if (lastDoc) {
    constraints.splice(4, 0, startAfter(lastDoc));
  }

  const q = query(...constraints);
  const snapshot = await getDocs(q);

  const goals = snapshot.docs.map(doc => {
    const data = doc.data();

    const title = tryDecrypt(data.title, key);
    const type = tryDecrypt(data.type, key);
    const availableAmount = parseFloat(tryDecrypt(data.availableAmount, key));
    const currentBalanceOnAccount = parseFloat(tryDecrypt(data.currentBalanceOnAccount, key));
    const mainCurrency = tryDecrypt(data.mainCurrency, key);

    return {
      id: doc.id,
      ...data,
      title,
      type,
      availableAmount,
      currentBalanceOnAccount,
      mainCurrency,
    };
  });

  const lastVisible = snapshot.docs[snapshot.docs.length - 1] || null;

  return {
    goals,
    lastDoc: lastVisible,
    hasMore: snapshot.docs.length === pageSize,
  };
};
