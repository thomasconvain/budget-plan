<template>

  <div class="flex flex-col bg-gray-50 min-h-screen">
    <div class="z-50">
      <NavBar class="absolute w-full"/>
    </div>
    <div class="pt-24 relative">
      <div class="absolute inset-x-0 top-0 bg-gray-950 rounded-b-3xl"
           :style="{
             height: $route.path === '/dashboard' ? '145px' : 
                    $route.path === '/create-goal/' ? '140px' :
                    $route.path.startsWith('/goal') ? `${backgroundHeight}px` :
                    '385px'
           }">
      </div>
      <div class="px-10 pb-5 w-full md:max-w-4xl m-auto relative">
        <div v-if="loading">
          <LoadingSpinner />
        </div>
        <div v-else class="flex-grow">
          <router-view class="pb-16" @last-card-position="updateBackgroundHeight" />
        </div>
      </div>
    </div>
    <MobileMenu v-if="isNativeApp"/>
    <FooterSection v-if="!isNativeApp" class="bottom-0"/>
  </div>
</template>

<script setup>
import NavBar from './components/NavBar.vue'
import FooterSection from './components/FooterSection.vue'
import LoadingSpinner from './components/LoadingSpinner.vue'
import { Capacitor } from '@capacitor/core';
import { useStore } from 'vuex';
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import MobileMenu from './components/MobileMenu.vue';

const isNativeApp = Capacitor.isNativePlatform();
const store = useStore();
const loading = computed(() => store.getters.loading);
const backgroundHeight = ref(290); // altura por defecto
const route = useRoute();

const updateBackgroundHeight = (position) => {
  if (route.path.startsWith('/goal')) {
    backgroundHeight.value = position + 50; // 50px es la mitad aproximada de una card
  }
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;

  color: #2c3e50;
}
</style>
