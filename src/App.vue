<template>

  <div class="flex flex-col bg-gray-50 min-h-screen">
    <div class="mb-24 z-50">
      <NavBar class="fixed w-full"/>
    </div>
    <div class="px-10 pb-5 w-full md:max-w-4xl m-auto">
      <div v-if="loading">
        <LoadingSpinner />
      </div>
      <div v-else class="flex-grow">
      <router-view class="pb-16" />
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
import { computed } from 'vue';
import MobileMenu from './components/MobileMenu.vue';

const isNativeApp = Capacitor.isNativePlatform();

const store = useStore();
const loading = computed(() => store.getters.loading);
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;

  color: #2c3e50;
}
</style>
