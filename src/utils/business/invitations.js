import { getAuth } from 'firebase/auth';
import {
  getFirestore, collection, query, where, getDocs, getDoc, addDoc, updateDoc,
  doc, Timestamp, and, or
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/firebase';

const auth = getAuth();
const db = getFirestore();

/**
 * Envía una invitación a un usuario por email.
 * Usa la Cloud Function findUserByEmail para buscar al destinatario.
 */
export async function sendInvitation(email) {
  const user = auth.currentUser;
  if (!user) throw new Error('No autenticado');

  // Buscar al destinatario via Cloud Function
  const findUser = httpsCallable(functions, 'findUserByEmail');
  const { data: recipient } = await findUser({ email: email.trim().toLowerCase() });

  // Verificar que no exista ya una invitación pendiente o aceptada entre ambos
  const existingQuery = query(
    collection(db, 'invitations'),
    and(
      where('status', 'in', ['pending', 'accepted']),
      or(
        where('fromUserId', '==', user.uid),
        where('toUserId', '==', user.uid)
      )
    )
  );
  const existingSnap = await getDocs(existingQuery);
  const duplicate = existingSnap.docs.find(d => {
    const data = d.data();
    return (
      (data.fromUserId === user.uid && data.toUserId === recipient.uid) ||
      (data.fromUserId === recipient.uid && data.toUserId === user.uid)
    );
  });

  if (duplicate) {
    throw new Error('Ya existe una invitación con este usuario');
  }

  // Crear la invitación
  await addDoc(collection(db, 'invitations'), {
    fromUserId: user.uid,
    fromEmail: user.email,
    fromName: user.displayName || user.email,
    toUserId: recipient.uid,
    toEmail: recipient.email,
    toName: recipient.name,
    status: 'pending',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
}

/**
 * Obtiene las invitaciones recibidas pendientes.
 */
export async function fetchReceivedInvitations() {
  const user = auth.currentUser;
  if (!user) return [];

  const q = query(
    collection(db, 'invitations'),
    where('toUserId', '==', user.uid),
    where('status', '==', 'pending')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Obtiene las invitaciones enviadas pendientes.
 */
export async function fetchSentInvitations() {
  const user = auth.currentUser;
  if (!user) return [];

  const q = query(
    collection(db, 'invitations'),
    where('fromUserId', '==', user.uid),
    where('status', '==', 'pending')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Acepta una invitación recibida.
 */
export async function acceptInvitation(invitationId) {
  await updateDoc(doc(db, 'invitations', invitationId), {
    status: 'accepted',
    updatedAt: Timestamp.now(),
  });
}

/**
 * Rechaza una invitación recibida.
 */
export async function rejectInvitation(invitationId) {
  await updateDoc(doc(db, 'invitations', invitationId), {
    status: 'rejected',
    updatedAt: Timestamp.now(),
  });
}

/**
 * Elimina un contacto (invitación aceptada). Actualiza el estado a 'removed'
 * para que deje de aparecer en la lista de contactos.
 */
export async function removeContact(invitationId) {
  const user = auth.currentUser;
  if (!user) throw new Error('No autenticado');

  const invRef = doc(db, 'invitations', invitationId);
  const snap = await getDoc(invRef);
  if (!snap.exists()) throw new Error('Invitación no encontrada');

  const data = snap.data();
  const isFromMe = data.fromUserId === user.uid;
  const isToMe = data.toUserId === user.uid;
  if (!isFromMe && !isToMe) throw new Error('No puedes eliminar este contacto');

  if (data.status !== 'accepted') {
    throw new Error('Solo se pueden eliminar contactos aceptados');
  }

  await updateDoc(invRef, {
    status: 'removed',
    updatedAt: Timestamp.now(),
  });
}

/**
 * Obtiene los contactos aceptados (invitaciones aceptadas en cualquier dirección).
 * Retorna una lista de objetos { id, name, email, userId } del otro usuario.
 */
export async function fetchContacts() {
  const user = auth.currentUser;
  if (!user) return [];

  // Invitaciones que envié y fueron aceptadas
  const sentQ = query(
    collection(db, 'invitations'),
    where('fromUserId', '==', user.uid),
    where('status', '==', 'accepted')
  );
  // Invitaciones que recibí y acepté
  const receivedQ = query(
    collection(db, 'invitations'),
    where('toUserId', '==', user.uid),
    where('status', '==', 'accepted')
  );

  const [sentSnap, receivedSnap] = await Promise.all([
    getDocs(sentQ),
    getDocs(receivedQ)
  ]);

  const contacts = [];

  sentSnap.docs.forEach(d => {
    const data = d.data();
    contacts.push({
      invitationId: d.id,
      userId: data.toUserId,
      name: data.toName,
      email: data.toEmail,
    });
  });

  receivedSnap.docs.forEach(d => {
    const data = d.data();
    contacts.push({
      invitationId: d.id,
      userId: data.fromUserId,
      name: data.fromName,
      email: data.fromEmail,
    });
  });

  return contacts;
}
