<template>
  <nav class="bg-transparent">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="relative flex h-16 items-center justify-between">
        <!-- Logo -->
        <div class="flex flex-1 items-center justify-start">
          <img class="h-8 w-auto invert" src="../assets/img/logo.svg" alt="BudgetPlan" />
        </div>

        <!-- Right side -->
        <div v-if="user" class="absolute inset-y-0 right-0 flex items-center gap-2">
          <!-- Bell: notifications -->
          <button type="button" @click="router.push('/notifications')" class="relative rounded-full p-1.5 text-white hover:text-gray-300 focus:outline-none">
            <span class="sr-only">Ver notificaciones</span>
            <BellIcon class="h-6 w-6" aria-hidden="true" />
            <span
              v-if="unreadNotificationsCount > 0"
              class="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
              {{ unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount }}
            </span>
          </button>

          <!-- Hamburger menu (desktop) -->
          <button
            @click="menuOpen = true"
            class="flex items-center justify-center rounded-full p-1.5 text-white hover:text-gray-300 focus:outline-none transition-colors"
          >
            <span class="sr-only">Abrir menu</span>
            <Bars3Icon class="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>

    <!-- Full screen overlay menu -->
    <FullScreenMenu :open="menuOpen" @close="menuOpen = false" />
  </nav>
</template>

<script setup>
import { Bars3Icon, BellIcon } from '@heroicons/vue/24/outline'
import FullScreenMenu from './FullScreenMenu.vue'
import { useStore } from 'vuex';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

const store = useStore();
const router = useRouter();
const user = computed(() => store.getters.user);
const unreadNotificationsCount = computed(() => store.getters.unreadNotificationsCount || 0);
const menuOpen = ref(false);
</script>
