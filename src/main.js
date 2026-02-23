// src/main.js
import { createApp } from 'vue'
import App from './App.vue'
import './assets/css/tailwind.css'
import store from './store'
import router from './router'
import { auth, messagingPromise } from './firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { getFirestore, doc, onSnapshot, collection, query, where } from 'firebase/firestore'
import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'
import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor'
import { initPushNotifications } from './services/notifications'
import { createNotification } from './utils/business/notifications'

// Configurar StatusBar para que no se superponga con la app
if (Capacitor.isNativePlatform()) {
  StatusBar.setOverlaysWebView({ overlay: false })
  StatusBar.setStyle({ style: Style.Dark })
  StatusBar.setBackgroundColor({ color: '#030712' }) // gray-950
}

const REVENUECAT_KEY = 'goog_cDBJOWVyBuCtmZPVGnNzywMQPUl'
const db = getFirestore()

async function initRevenueCat(appUserID) {
  if (Capacitor.getPlatform() !== 'web') {
    try {
      await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG })
      await Purchases.configure({ apiKey: REVENUECAT_KEY, appUserID })
      console.log('RevenueCat listo para:', appUserID)
    } catch (e) {
      console.error('Error inicializando RevenueCat:', e)
    }
  }
}

const app = createApp(App)
app.use(store)
app.use(router)

app.mount('#app')

onAuthStateChanged(auth, async user => {
  if (user) {
    // 1) Guarda datos de usuario en Vuex
    store.commit('setUser', user)

    // 2) Inicializa RevenueCat con el mismo UID
    await initRevenueCat(user.uid)
    store.commit('setRevenueCatReady', true)

    // 3) Crea una suscripción a Firestore para el campo `premium`
    const userDoc = doc(db, 'users', user.uid)
    onSnapshot(userDoc, snap => {
      const data = snap.data() || {}
      store.commit('setPremium', !!data.premium)
    })

    // 4) Listeners en tiempo real para badges de contactos
    const pendingExpensesQuery = query(
      collection(db, 'sharedExpenses'),
      where('recipientUserId', '==', user.uid),
      where('status', '==', 'pending')
    )
    let isFirstExpenseSnapshot = true
    onSnapshot(pendingExpensesQuery, snap => {
      store.commit('setPendingSharedExpensesCount', snap.size)
      if (isFirstExpenseSnapshot) {
        isFirstExpenseSnapshot = false
        return
      }
      snap.docChanges().forEach(change => {
        if (change.type === 'added') {
          const data = change.doc.data()
          createNotification({
            userId: user.uid,
            type: 'shared_expense',
            title: 'Gasto compartido recibido',
            message: `${data.createdByName} compartió un gasto de ${data.currency} ${data.amount}`,
            relatedId: change.doc.id,
          })
        }
      })
    })

    const pendingInvitationsQuery = query(
      collection(db, 'invitations'),
      where('toUserId', '==', user.uid),
      where('status', '==', 'pending')
    )
    let isFirstInvitationSnapshot = true
    onSnapshot(pendingInvitationsQuery, snap => {
      store.commit('setPendingInvitationsCount', snap.size)
      if (isFirstInvitationSnapshot) {
        isFirstInvitationSnapshot = false
        return
      }
      snap.docChanges().forEach(change => {
        if (change.type === 'added') {
          const data = change.doc.data()
          createNotification({
            userId: user.uid,
            type: 'invitation',
            title: 'Nueva invitación',
            message: `${data.fromName} te envió una invitación de contacto`,
            relatedId: change.doc.id,
          })
        }
      })
    })

    // 4b) Listener en tiempo real para badge de notificaciones no leídas
    const unreadNotificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      where('read', '==', false)
    )
    onSnapshot(unreadNotificationsQuery, snap => {
      store.commit('setUnreadNotificationsCount', snap.size)
    })

    // 5) Inicializar FCM para push notifications
    const webMessaging = await messagingPromise
    initPushNotifications(webMessaging, (payload) => {
      console.log('Notificación recibida en foreground:', payload)
    })
  } else {
    // Usuario deslogueado: limpia store
    store.commit('clearUser')
    store.commit('setPremium', false)
    store.commit('setPendingSharedExpensesCount', 0)
    store.commit('setPendingInvitationsCount', 0)
    store.commit('setUnreadNotificationsCount', 0)
    // Opcional: limpia RevenueCat
    await Purchases.reset()
  }
})
