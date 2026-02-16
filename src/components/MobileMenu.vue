<template>
<div class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-300 flex justify-around items-center h-16 shadow-lg md:hidden">
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
</div>
</template>

<script setup>
import { HomeIcon, SquaresPlusIcon } from '@heroicons/vue/24/outline';
</script>
