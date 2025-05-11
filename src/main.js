// src/main.js
import { createApp } from 'vue'
import App from './App.vue'
import './assets/css/tailwind.css'
import store from './store'
import router from './router'
import { auth } from './firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { getFirestore, doc, onSnapshot } from 'firebase/firestore'
import { Capacitor } from '@capacitor/core'
import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor'

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
        // Guarda en Vuex (asegúrate de tener esta mutación)
        store.commit('setPremium', !!data.premium)
      })
    } else {
      // Usuario deslogueado: limpia store
      store.commit('clearUser')
      store.commit('setPremium', false)
      // Opcional: limpia RevenueCat
      await Purchases.reset()
    }
  })
})
