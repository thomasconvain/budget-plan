import { getAuth } from 'firebase/auth';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';


const auth = getAuth();
const db = getFirestore();


export const fetchGoals = async () => {
  const user = auth.currentUser;
  if (user) {
    const q = query(collection(db, 'goals'), where('userId', '==', user.uid));
    const querySnapshot = await getDocs(q);
    const result = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return result;
  }
};