<template>
  <div class="bg-gray-50 min-h-screen">
    <div v-if="user">
      <NavBar />
    </div>
    <div class="px-10 md:max-w-4xl m-auto">
      <router-view />
    </div>
  </div>
</template>

<script setup>
import NavBar from './components/NavBar.vue'

import { useStore } from 'vuex';
import { computed } from 'vue';

const store = useStore();

// Acceder al getter 'user' del store
const user = computed(() => store.getters.user);
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;

  color: #2c3e50;
}
</style>
