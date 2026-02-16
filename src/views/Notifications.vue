<template>
  <div v-if="isLoading">
    <NotificationsSkeleton />
  </div>
  <div v-else ref="contentRef" class="max-w-2xl mx-auto pb-20">
    <div class="flex items-center justify-between mt-6 mb-6">
      <h1 class="text-2xl font-bold text-white">Notificaciones</h1>
      <div class="flex items-center gap-2">
        <button
          v-if="notifications.some(n => !n.read)"
          class="px-3 py-1.5 text-xs font-medium text-white/70 hover:text-white bg-white/10 rounded-xl hover:bg-white/20 transition"
          @click="handleMarkAllAsRead">
          Marcar todo como leído
        </button>
        <button
          v-if="!isNativeApp"
          class="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition"
          @click="$router.push({ name: 'Dashboard' })">
          <ArrowLeftIcon class="h-4 w-4 text-white" />
        </button>
      </div>
    </div>

    <!-- Notification list -->
    <div v-if="notifications.length" class="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        class="flex items-start gap-3 px-4 py-3 transition cursor-pointer"
        :class="notification.read ? 'opacity-60' : ''"
        @click="handleNotificationClick(notification)">
        <!-- Icon based on type -->
        <div class="flex items-center justify-center h-8 w-8 rounded-lg shrink-0 mt-0.5"
          :class="iconBgClass(notification.type)">
          <component
            :is="iconForType(notification.type)"
            class="h-4 w-4"
            :class="iconColorClass(notification.type)"
          />
        </div>
        <!-- Content -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <p class="text-sm font-medium text-gray-900 truncate">{{ notification.title }}</p>
            <span
              v-if="!notification.read"
              class="h-2 w-2 bg-blue-500 rounded-full shrink-0">
            </span>
          </div>
          <p class="text-xs text-gray-500 mt-0.5">{{ notification.message }}</p>
          <p class="text-xs text-gray-400 mt-1">{{ formatTimeAgo(notification.createdAt) }}</p>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="text-center mt-12">
      <BellIcon class="h-12 w-12 text-white/20 mx-auto" />
      <p class="text-sm text-white/60 mt-4">No tienes notificaciones</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'vue-router';
import { Capacitor } from '@capacitor/core';
import {
  ArrowLeftIcon,
  BellIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  InformationCircleIcon,
} from '@heroicons/vue/24/outline';
import {
  fetchNotifications,
  markAsRead,
  markAllAsRead,
} from '@/utils/business/notifications';
import NotificationsSkeleton from '@/components/skeletons/NotificationsSkeleton.vue';

const isNativeApp = Capacitor.isNativePlatform();
const emit = defineEmits(['last-card-position']);
const auth = getAuth();
const router = useRouter();

const isLoading = ref(true);
const contentRef = ref(null);
const notifications = ref([]);

const iconForType = (type) => {
  switch (type) {
    case 'invitation': return UserGroupIcon;
    case 'shared_expense': return CurrencyDollarIcon;
    default: return InformationCircleIcon;
  }
};

const iconBgClass = (type) => {
  switch (type) {
    case 'invitation': return 'bg-indigo-50';
    case 'shared_expense': return 'bg-emerald-50';
    default: return 'bg-gray-100';
  }
};

const iconColorClass = (type) => {
  switch (type) {
    case 'invitation': return 'text-indigo-500';
    case 'shared_expense': return 'text-emerald-500';
    default: return 'text-gray-400';
  }
};

const formatTimeAgo = (timestamp) => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  if (diffDays < 7) return `Hace ${diffDays}d`;
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
};

const handleNotificationClick = async (notification) => {
  if (!notification.read) {
    await markAsRead(notification.id);
    notification.read = true;
  }
  if (notification.type === 'invitation' || notification.type === 'shared_expense') {
    router.push('/contacts');
  }
};

const handleMarkAllAsRead = async () => {
  await markAllAsRead();
  notifications.value.forEach(n => { n.read = true; });
};

onMounted(() => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      notifications.value = await fetchNotifications();
      isLoading.value = false;
    }
  });
});
</script>
