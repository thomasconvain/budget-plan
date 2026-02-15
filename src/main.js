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
import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor'
import { initPushNotifications } from './services/notifications'

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

router.isReady().then(() => {
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

      // 4) Listeners en tiempo real para badges de notificaciones
      const pendingExpensesQuery = query(
        collection(db, 'sharedExpenses'),
        where('recipientUserId', '==', user.uid),
        where('status', '==', 'pending')
      )
      onSnapshot(pendingExpensesQuery, snap => {
        store.commit('setPendingSharedExpensesCount', snap.size)
      })

      const pendingInvitationsQuery = query(
        collection(db, 'invitations'),
        where('toUserId', '==', user.uid),
        where('status', '==', 'pending')
      )
      onSnapshot(pendingInvitationsQuery, snap => {
        store.commit('setPendingInvitationsCount', snap.size)
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
      // Opcional: limpia RevenueCat
      await Purchases.reset()
    }
  })
})
