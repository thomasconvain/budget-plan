<template>
  <TransitionRoot :show="open" as="template">
    <Dialog @close="$emit('close')" class="relative z-[55]">
      <!-- Backdrop -->
      <TransitionChild
        enter="transition-opacity duration-300 ease-out"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="transition-opacity duration-200 ease-in"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-gray-950/95 backdrop-blur-sm" />
      </TransitionChild>

      <!-- Panel -->
      <div class="fixed inset-0 flex justify-end">
        <TransitionChild
          enter="transition-transform duration-300 ease-out"
          enter-from="translate-x-full"
          enter-to="translate-x-0"
          leave="transition-transform duration-200 ease-in"
          leave-from="translate-x-0"
          leave-to="translate-x-full"
        >
          <DialogPanel class="h-full w-full md:w-96 bg-gray-950 flex flex-col px-8 py-6 md:px-10 md:py-8">
            <!-- Header: close button -->
            <div class="flex items-center justify-end mb-12">
              <button @click="$emit('close')" class="text-white/60 hover:text-white transition-colors">
                <XMarkIcon class="h-8 w-8" />
              </button>
            </div>

          <!-- Navigation -->
          <nav class="flex-1 flex flex-col gap-2">
            <router-link
              v-for="item in navItems"
              :key="item.to"
              :to="item.to"
              @click="$emit('close')"
              :class="[
                'flex items-center gap-3 px-4 py-3 rounded-xl text-lg font-semibold transition-all duration-200',
                isActive(item.to)
                  ? 'bg-white/10 text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              ]"
            >
              <component :is="item.icon" class="h-6 w-6" />
              <span>{{ item.label }}</span>
              <span
                v-if="item.badge > 0"
                class="ml-auto h-6 min-w-[24px] px-1.5 bg-red-500 rounded-full text-sm font-bold text-white flex items-center justify-center"
              >
                {{ item.badge > 9 ? '9+' : item.badge }}
              </span>
            </router-link>
          </nav>

          <!-- User section -->
          <div v-if="user" class="mt-auto pt-8 border-t border-white/10">
            <div class="flex items-center gap-4 mb-6">
              <img
                :src="user.photoURL || defaultAvatar"
                class="h-12 w-12 rounded-full object-cover border-2 border-white/20"
              />
              <div class="flex-1 min-w-0">
                <p class="text-lg font-medium text-white truncate">{{ user.displayName }}</p>
                <p class="text-sm text-white/40 truncate">{{ user.email }}</p>
              </div>
            </div>
            <div class="flex flex-col gap-3">
              <button
                @click="handleLogout"
                class="flex items-center gap-3 text-white/50 hover:text-white transition-colors text-base"
              >
                <ArrowRightOnRectangleIcon class="h-5 w-5" />
                <span>Cerrar sesion</span>
              </button>
              <button
                @click="handleDeleteAccount"
                class="flex items-center gap-3 text-white/30 hover:text-red-400 transition-colors text-sm"
              >
                <TrashIcon class="h-4 w-4" />
                <span>Eliminar mi cuenta</span>
              </button>
            </div>
          </div>
        </DialogPanel>
        </TransitionChild>
      </div>
    </Dialog>
  </TransitionRoot>

  <!-- Confirm delete: bottom sheet (mobile) / modal (desktop) -->
  <TransitionRoot :show="showDeleteConfirm" as="template">
    <Dialog @close="showDeleteConfirm = false" class="relative z-[60]">
      <TransitionChild
        enter="transition-opacity duration-200 ease-out"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="transition-opacity duration-150 ease-in"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-black/60" />
      </TransitionChild>

      <div class="fixed inset-0 flex items-end md:items-center md:justify-center">
        <TransitionChild
          enter="transition duration-300 ease-out"
          enter-from="translate-y-full md:translate-y-0 md:opacity-0 md:scale-95"
          enter-to="translate-y-0 md:opacity-100 md:scale-100"
          leave="transition duration-200 ease-in"
          leave-from="translate-y-0 md:opacity-100 md:scale-100"
          leave-to="translate-y-full md:translate-y-0 md:opacity-0 md:scale-95"
        >
          <DialogPanel class="w-full md:max-w-sm bg-white rounded-t-2xl md:rounded-2xl p-6 pb-8 md:pb-6">
            <div class="flex flex-col items-center text-center">
              <div class="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <ExclamationTriangleIcon class="h-6 w-6 text-red-600" />
              </div>
              <DialogTitle class="text-lg font-semibold text-gray-900 mb-2">Eliminar cuenta</DialogTitle>
              <p class="text-sm text-gray-500 mb-6">Esta accion es irreversible. Se eliminaran todos tus datos permanentemente.</p>
              <div class="flex flex-col w-full gap-3">
                <button
                  @click="confirmDeleteAccount"
                  class="w-full py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors"
                >
                  Si, eliminar mi cuenta
                </button>
                <button
                  @click="showDeleteConfirm = false"
                  class="w-full py-3 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </DialogPanel>
        </TransitionChild>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import { Dialog, DialogPanel, DialogTitle, TransitionRoot, TransitionChild } from '@headlessui/vue';
import {
  HomeIcon,
  PlusCircleIcon,
  UserGroupIcon,
  BellIcon,
  BoltIcon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  TrashIcon,
  ExclamationTriangleIcon,
} from '@heroicons/vue/24/outline';
import { Capacitor } from '@capacitor/core';
import defaultAvatarImg from '@/assets/img/default_profile.webp';

defineProps({ open: Boolean });
const emit = defineEmits(['close']);

const store = useStore();
const route = useRoute();
const router = useRouter();
const user = computed(() => store.getters.user);
const totalPendingCount = computed(() => store.getters.totalPendingCount || 0);
const unreadNotificationsCount = computed(() => store.getters.unreadNotificationsCount || 0);
const defaultAvatar = defaultAvatarImg;

const isNative = Capacitor.isNativePlatform();

const navItems = computed(() => {
  const items = [
    { to: '/dashboard', label: 'Inicio', icon: HomeIcon, badge: 0 },
    { to: '/create-goal', label: 'Agregar', icon: PlusCircleIcon, badge: 0 },
    { to: '/contacts', label: 'Contactos', icon: UserGroupIcon, badge: totalPendingCount.value },
    { to: '/notifications', label: 'Notificaciones', icon: BellIcon, badge: unreadNotificationsCount.value },
  ];
  if (isNative) {
    items.push({ to: '/settings/auto-payments', label: 'Pagos automáticos', icon: BoltIcon, badge: 0 });
  }
  return items;
});

const isActive = (path) => {
  if (path === '/dashboard') return route.path === '/dashboard' || route.path.startsWith('/goal/');
  return route.path === path;
};

const handleLogout = () => {
  emit('close');
  store.dispatch('logout');
};

const showDeleteConfirm = ref(false);

const handleDeleteAccount = () => {
  emit('close');
  setTimeout(() => {
    showDeleteConfirm.value = true;
  }, 250);
};

const confirmDeleteAccount = async () => {
  try {
    if (user.value) {
      await user.value.delete();
      showDeleteConfirm.value = false;
      emit('close');
      router.push('/');
    }
  } catch (error) {
    console.error("Error al eliminar el usuario y sus datos:", error);
  }
};
</script>
