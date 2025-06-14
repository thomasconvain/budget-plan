<template>
    <div class="space-y-6">
      <!-- Banner dinámico -->
      <div v-if="$store.state.premium" class="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
        🏅 Usuario PRO
      </div>
  
      <div
        v-else
        class="bg-gray-800 text-white px-4 py-3 rounded-md shadow flex flex-col sm:flex-row items-center justify-between gap-3"
      >
        <div class="text-center sm:text-left">
          <p class="text-sm font-semibold">🚀 Mejora tu experiencia con PRO</p>
          <p class="text-xs text-gray-100">
            Accede a funcionalidades premium como presupuestos ilimitados y divisas múltiples.
          </p>
        </div>
  
        <button
          v-if="isNative"
          @click="comprar(unicoPaquete)"
          class="bg-white text-gray-600 px-4 py-2 rounded-md hover:bg-gray-50 transition"
          :disabled="!unicoPaquete"
        >
          {{ unicoPaquete?.product.priceString || 'Suscribirse' }}
        </button>
  
        <a
          v-else
          href="https://play.google.com/store/apps/details?id=com.budgetplanapp"
          target="_blank"
          class="bg-white text-gray-600 px-4 py-2 rounded-md hover:bg-gray-50 transition"
        >
          Descarga la app
        </a>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, watch, computed } from 'vue'
  import { useStore } from 'vuex'
  import { Capacitor } from '@capacitor/core'
  import { Purchases } from '@revenuecat/purchases-capacitor'
  
  const store = useStore()
  const offerings = ref(null)
  const isNative = Capacitor.getPlatform() !== 'web'
  
  const unicoPaquete = computed(() => {
    return offerings.value?.all?.['default']?.availablePackages?.[0] || null
  })
  
  watch(
    () => store.state.revenueCatReady,
    async (ready) => {
      if (ready && isNative) {
        try {
          const offeringsResponse = await Purchases.getOfferings()
          console.warn('Ofertas cargadas:', offeringsResponse)
          offerings.value = offeringsResponse
        } catch (e) {
          console.warn('Error cargando ofertas:', e)
        }
      }
    },
    { immediate: true }
  )
  
  async function comprar(pkg) {
    try {
      const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg })
      if (customerInfo.entitlements.active['premium']) {
        alert('¡Suscripción activada!')
      }
    } catch (e) {
      console.error('Compra fallida:', e)
    }
  }
  </script>
  