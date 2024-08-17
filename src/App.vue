<template>

  <div class="bg-gray-50 min-h-screen">
    <div>
      <NavBar />
    </div>
    <div class="px-10 pb-20 md:max-w-4xl m-auto">
      <div v-if="loading">
        <p>Cargando...</p> <!-- Aquí podrías usar un spinner o algo más estilizado -->
      </div>
      <router-view v-else />
    </div>
    <FooterSection class="bottom-0"/>
  </div>
</template>

<script setup>
import NavBar from './components/NavBar.vue'
import FooterSection from './components/FooterSecction.vue'

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
