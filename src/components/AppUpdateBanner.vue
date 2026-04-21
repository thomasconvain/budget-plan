<template>
  <!-- Modal bloqueante: versión por debajo del mínimo -->
  <div
    v-if="forceUpdate"
    class="fixed inset-0 z-[70] bg-gray-950/80 flex items-center justify-center px-4">
    <div class="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6">
      <div class="flex items-center justify-center h-12 w-12 rounded-2xl bg-amber-50 mb-4 mx-auto">
        <ArrowDownTrayIcon class="h-6 w-6 text-amber-500" />
      </div>
      <h2 class="text-lg font-semibold text-gray-900 text-center mb-2">
        Actualización requerida
      </h2>
      <p class="text-sm text-gray-500 text-center mb-5">
        Esta versión ya no es compatible. Actualizá desde Play Store para seguir usando la app.
      </p>
      <button
        @click="openPlayStore"
        class="w-full px-4 py-3 text-sm font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition">
        Actualizar ahora
      </button>
    </div>
  </div>

  <!-- Banner descartable: hay versión nueva disponible -->
  <Transition name="update-banner">
    <div
      v-if="showBanner"
      class="fixed bottom-20 left-0 right-0 z-40 flex justify-center px-4 pointer-events-none">
      <div class="w-full max-w-md bg-white rounded-2xl shadow-lg border border-gray-100 p-4 pointer-events-auto">
        <div class="flex items-start gap-3">
          <div class="flex items-center justify-center h-9 w-9 rounded-xl bg-amber-50 shrink-0">
            <ArrowDownTrayIcon class="h-4 w-4 text-amber-500" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900">Nueva versión disponible</p>
            <p class="text-xs text-gray-500 mt-0.5">
              Actualizá para obtener las últimas mejoras y correcciones.
            </p>
          </div>
          <button
            @click="dismiss"
            class="p-1 rounded-lg hover:bg-gray-100 transition shrink-0">
            <XMarkIcon class="h-4 w-4 text-gray-400" />
          </button>
        </div>
        <div class="flex gap-2 mt-3">
          <button
            @click="dismiss"
            class="flex-1 px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition">
            Luego
          </button>
          <button
            @click="openPlayStore"
            class="flex-1 px-3 py-2 text-xs font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition">
            Actualizar
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { doc, onSnapshot } from 'firebase/firestore'
import { Capacitor } from '@capacitor/core'
import { ArrowDownTrayIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { db } from '@/firebase'
import {
  CURRENT_ANDROID_VERSION_CODE,
  PLAY_STORE_URL,
  PLAY_STORE_MARKET_URL,
} from '@/config/appVersion'

const DISMISS_STORAGE_KEY = 'appUpdateBanner:dismissedForVersion'

const latestVersionCode = ref(null)
const minVersionCode = ref(null)
const dismissedForVersion = ref(
  Number(localStorage.getItem(DISMISS_STORAGE_KEY)) || 0
)

let unsubscribe = null

const isAndroid = Capacitor.getPlatform() === 'android'

const forceUpdate = computed(() => {
  if (!isAndroid) return false
  if (!minVersionCode.value) return false
  return CURRENT_ANDROID_VERSION_CODE < minVersionCode.value
})

const showBanner = computed(() => {
  if (!isAndroid) return false
  if (forceUpdate.value) return false
  if (!latestVersionCode.value) return false
  if (CURRENT_ANDROID_VERSION_CODE >= latestVersionCode.value) return false
  return dismissedForVersion.value < latestVersionCode.value
})

function dismiss() {
  if (!latestVersionCode.value) return
  dismissedForVersion.value = latestVersionCode.value
  localStorage.setItem(DISMISS_STORAGE_KEY, String(latestVersionCode.value))
}

function openPlayStore() {
  const url = isAndroid ? PLAY_STORE_MARKET_URL : PLAY_STORE_URL
  try {
    window.open(url, '_system')
  } catch {
    window.open(PLAY_STORE_URL, '_system')
  }
}

onMounted(() => {
  if (!isAndroid) return
  unsubscribe = onSnapshot(doc(db, 'config', 'app'), snap => {
    const data = snap.data() || {}
    latestVersionCode.value = Number(data.androidLatestVersionCode) || null
    minVersionCode.value = Number(data.androidMinVersionCode) || null
  })
})

onUnmounted(() => {
  if (unsubscribe) unsubscribe()
})
</script>

<style scoped>
.update-banner-enter-active {
  transition: all 0.3s ease-out;
}
.update-banner-leave-active {
  transition: all 0.2s ease-in;
}
.update-banner-enter-from {
  opacity: 0;
  transform: translateY(30px);
}
.update-banner-leave-to {
  opacity: 0;
  transform: translateY(30px);
}
</style>
