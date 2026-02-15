import { getToken, onMessage } from 'firebase/messaging';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';

const db = getFirestore();
const auth = getAuth();

/**
 * Guarda el token FCM en el documento del usuario.
 */
async function saveFcmToken(token) {
  const user = auth.currentUser;
  if (!user || !token) return;

  await updateDoc(doc(db, 'users', user.uid), {
    fcmToken: token,
  });
}

/**
 * Inicializa notificaciones push en plataforma nativa (Android/iOS).
 * Solicita permisos, obtiene token FCM y lo guarda en Firestore.
 */
async function initNativePush(onNotification) {
  try {
    const permResult = await FirebaseMessaging.requestPermissions();
    if (permResult.receive !== 'granted') {
      console.warn('Permiso de notificaciones denegado');
      return null;
    }

    const { token } = await FirebaseMessaging.getToken();
    if (token) {
      await saveFcmToken(token);
    }

    // Listener cuando el token se renueva
    FirebaseMessaging.addListener('tokenReceived', async ({ token: newToken }) => {
      await saveFcmToken(newToken);
    });

    // Listener para notificaciones recibidas con la app en foreground
    FirebaseMessaging.addListener('notificationReceived', (notification) => {
      if (onNotification) {
        onNotification(notification);
      }
    });

    // Listener cuando el usuario toca una notificación
    FirebaseMessaging.addListener('notificationActionPerformed', (action) => {
      console.log('Notificación tocada:', action);
    });

    return token;
  } catch (e) {
    console.error('Error inicializando push nativo:', e);
    return null;
  }
}

/**
 * Inicializa notificaciones push en web.
 * Solicita permisos, obtiene token FCM via VAPID y lo guarda en Firestore.
 * @param {Object} messaging - Instancia de Firebase Messaging web
 */
async function initWebPush(messaging, onNotification) {
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

    // Listener para mensajes en foreground
    onMessage(messaging, (payload) => {
      if (onNotification) {
        onNotification(payload);
      }
    });

    return token;
  } catch (e) {
    console.error('Error inicializando push web:', e);
    return null;
  }
}

/**
 * Punto de entrada principal: detecta la plataforma y configura push.
 * @param {Object|null} webMessaging - Instancia de Firebase Messaging web (null en nativo)
 * @param {Function} onNotification - Callback cuando llega una notificación en foreground
 */
export async function initPushNotifications(webMessaging, onNotification) {
  if (Capacitor.isNativePlatform()) {
    return initNativePush(onNotification);
  }
  return initWebPush(webMessaging, onNotification);
}
