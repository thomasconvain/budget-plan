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
      <router-view  />
      </div>
    </div>
    <FooterSection class="bottom-0"/>
  </div>
</template>

<script setup>
import NavBar from './components/NavBar.vue'
import FooterSection from './components/FooterSection.vue'
import LoadingSpinner from './components/LoadingSpinner.vue'

import { useStore } from 'vuex';
import { computed } from 'vue';

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
