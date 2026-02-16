import { getAuth } from 'firebase/auth';
import {
  getFirestore, collection, query, where, getDocs, addDoc, updateDoc,
  doc, Timestamp, orderBy, writeBatch, limit
} from 'firebase/firestore';

const auth = getAuth();
const db = getFirestore();

export async function fetchNotifications(maxResults = 50) {
  const user = auth.currentUser;
  if (!user) return [];

  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', user.uid),
    orderBy('createdAt', 'desc'),
    limit(maxResults)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function markAsRead(notificationId) {
  await updateDoc(doc(db, 'notifications', notificationId), {
    read: true,
  });
}

export async function markAllAsRead() {
  const user = auth.currentUser;
  if (!user) return;

  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', user.uid),
    where('read', '==', false)
  );
  const snap = await getDocs(q);
  const batch = writeBatch(db);
  snap.docs.forEach(d => {
    batch.update(d.ref, { read: true });
  });
  await batch.commit();
}

export async function createNotification({ userId, type, title, message, relatedId = null }) {
  await addDoc(collection(db, 'notifications'), {
    userId,
    type,
    title,
    message,
    read: false,
    createdAt: Timestamp.now(),
    relatedId,
  });
}
