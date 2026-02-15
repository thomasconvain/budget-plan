import { getToken, onMessage } from 'firebase/messaging';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const db = getFirestore();
const auth = getAuth();

/**
 * Solicita permisos de notificación y obtiene el token FCM.
 * Guarda el token en el documento del usuario en Firestore.
 * @param {Object} messaging - Instancia de Firebase Messaging (puede ser null si no soportado)
 */
export async function requestNotificationPermission(messaging) {
  if (!messaging) return null;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY || '',
    });

    if (token) {
      await saveFcmToken(token);
    }

    return token;
  } catch (e) {
    console.error('Error obteniendo token FCM:', e);
    return null;
  }
}

/**
 * Guarda el token FCM en el documento del usuario.
 */
async function saveFcmToken(token) {
  const user = auth.currentUser;
  if (!user) return;

  await updateDoc(doc(db, 'users', user.uid), {
    fcmToken: token,
  });
}

/**
 * Configura el listener para mensajes en foreground.
 * @param {Object} messaging - Instancia de Firebase Messaging
 * @param {Function} onNotification - Callback cuando llega una notificación
 */
export function setupOnMessageListener(messaging, onNotification) {
  if (!messaging) return;

  onMessage(messaging, (payload) => {
    if (onNotification) {
      onNotification(payload);
    }
  });
}
