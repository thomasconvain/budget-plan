<template>

  <!-- Splash screen -->
  <Transition name="splash">
    <div v-if="loading" class="fixed inset-0 bg-gray-950 flex items-center justify-center z-[60]">
      <img src="@/assets/img/logo.svg" alt="BudgetPlan" class="w-40 logo-pulse" />
    </div>
  </Transition>

  <div class="flex flex-col bg-gray-50 min-h-screen">
    <div class="z-50">
      <NavBar class="absolute w-full"/>
    </div>
    <div ref="bgContainer" class="pt-24 relative">
      <div class="absolute inset-x-0 top-0 bg-gray-950 rounded-b-3xl"
           :style="{
             height: $route.path === '/dashboard' ? '145px' :
                    $route.path.startsWith('/create-goal') ? '140px' :
                    ($route.path.startsWith('/goal') || $route.path.startsWith('/contacts') || $route.path === '/notifications') ? `${backgroundHeight}px` :
                    '385px'
           }">
      </div>
      <div class="px-4 md:px-10 pb-5 w-full md:max-w-4xl m-auto relative">
        <div class="flex-grow">
          <router-view class="pb-16" @last-card-position="updateBackgroundHeight" />
        </div>
      </div>
    </div>
    <MobileMenu v-if="user"/>
    <FooterSection v-if="!isNativeApp" class="bottom-0 hidden md:block"/>
  </div>
</template>

<script setup>
import NavBar from './components/NavBar.vue'
import FooterSection from './components/FooterSection.vue'
import { Capacitor } from '@capacitor/core';
import { useStore } from 'vuex';
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import MobileMenu from './components/MobileMenu.vue';

const isNativeApp = Capacitor.isNativePlatform();
const store = useStore();
const loading = computed(() => store.getters.loading);
const user = computed(() => store.getters.user);
const backgroundHeight = ref(290); // altura por defecto
const bgContainer = ref(null);
const route = useRoute();

// Resetear la altura del fondo al navegar entre vistas
watch(() => route.path, () => {
  backgroundHeight.value = 290;
});

const updateBackgroundHeight = (cardBottom) => {
  if ((route.path.startsWith('/goal') || route.path.startsWith('/contacts') || route.path === '/notifications') && bgContainer.value) {
    const containerTop = bgContainer.value.getBoundingClientRect().top;
    backgroundHeight.value = cardBottom - containerTop;
  }
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
}

.logo-pulse {
  filter: invert(1);
  animation: pulse-subtle 2s ease-in-out infinite;
}

@keyframes pulse-subtle {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}

.splash-leave-active {
  transition: opacity 0.4s ease;
}
.splash-leave-to {
  opacity: 0;
}
</style>
