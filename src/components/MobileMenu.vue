<template>
<div class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-300 flex justify-around items-center h-16 shadow-lg">
  <!-- Botón 1 -->
  <button class="flex flex-col items-center text-gray-600 hover:text-gray-600 focus:outline-none"
    @click="$router.push({ name: 'Dashboard' })">
    <HomeIcon class="h-4 w-4" aria-hidden="true" />
    <span class="text-sm">Inicio</span>
  </button>

  <!-- Botón 2 -->
  <button class="flex flex-col items-center text-gray-600 hover:text-gray-600 focus:outline-none"
    @click="$router.push({ name: 'CreateGoal' })">
    <SquaresPlusIcon class="h-4 w-4" aria-hidden="true" />
    <span class="text-sm">Agregar</span>
  </button>

  <!-- Botón 3: Contactos -->
  <button class="flex flex-col items-center text-gray-600 hover:text-gray-600 focus:outline-none relative"
    @click="$router.push({ name: 'Contacts' })">
    <UserGroupIcon class="h-4 w-4" aria-hidden="true" />
    <span class="text-sm">Contactos</span>
    <span
      v-if="totalPendingCount > 0"
      class="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
      {{ totalPendingCount > 9 ? '9+' : totalPendingCount }}
    </span>
  </button>
</div>
</template>

<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';
import { HomeIcon, SquaresPlusIcon, UserGroupIcon } from '@heroicons/vue/24/outline';

const store = useStore();
const totalPendingCount = computed(() => store.getters.totalPendingCount || 0);
</script>
