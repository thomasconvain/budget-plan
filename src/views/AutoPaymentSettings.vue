<template>
  <div class="max-w-2xl mx-auto pb-20">
    <div class="flex items-center justify-between mt-6 mb-6">
      <h1 class="text-2xl font-bold text-white">Pagos automáticos</h1>
      <button
        class="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition"
        @click="$router.push({ name: 'Dashboard' })">
        <ArrowLeftIcon class="h-4 w-4 text-white" />
      </button>
    </div>

    <!-- Permission status -->
    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="flex items-center justify-center h-10 w-10 rounded-xl"
            :class="permissionGranted ? 'bg-emerald-50' : 'bg-amber-50'">
            <ShieldCheckIcon v-if="permissionGranted" class="h-5 w-5 text-emerald-500" />
            <ShieldExclamationIcon v-else class="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <p class="text-sm font-medium text-gray-900">Acceso a notificaciones</p>
            <p class="text-xs text-gray-500">
              {{ permissionGranted ? 'Permiso otorgado' : 'Se requiere permiso para leer notificaciones bancarias' }}
            </p>
          </div>
        </div>
        <button
          v-if="!permissionGranted"
          class="px-3 py-1.5 text-xs font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition"
          @click="handleRequestPermission">
          Activar
        </button>
      </div>
    </div>

    <!-- Error message -->
    <div v-if="errorMessage" class="bg-red-50 border border-red-100 rounded-2xl p-4 mb-4">
      <p class="text-xs text-red-600">{{ errorMessage }}</p>
    </div>

    <!-- Main toggle -->
    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-900">Detección automática</p>
          <p class="text-xs text-gray-500">Detectar compras desde notificaciones bancarias</p>
        </div>
        <button
          @click="toggleEnabled"
          class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
          :class="config.enabled ? 'bg-emerald-500' : 'bg-gray-200'">
          <span
            class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
            :class="config.enabled ? 'translate-x-6' : 'translate-x-1'" />
        </button>
      </div>
    </div>

    <!-- Bank selection -->
    <div v-if="config.enabled" class="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
      <p class="text-sm font-medium text-gray-900 mb-3">Bancos monitoreados</p>
      <div class="space-y-2">
        <label
          v-for="bank in availableBanks"
          :key="bank.id"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-gray-50 transition">
          <input
            type="checkbox"
            :checked="config.monitoredBanks.includes(bank.packageName)"
            @change="toggleBank(bank.packageName)"
            class="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900" />
          <CreditCardIcon class="h-5 w-5 text-gray-400" />
          <span class="text-sm text-gray-700">{{ bank.name }}</span>
        </label>
      </div>
    </div>

    <!-- Default goal -->
    <div v-if="config.enabled && goals.length" class="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
      <p class="text-sm font-medium text-gray-900 mb-3">Tarjeta por defecto</p>
      <p class="text-xs text-gray-500 mb-3">Los pagos detectados se registrarán en esta tarjeta</p>
      <div class="space-y-2">
        <label
          v-for="goal in goals"
          :key="goal.id"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-gray-50 transition"
          :class="config.defaultGoalId === goal.id ? 'bg-gray-50 ring-1 ring-gray-200' : ''">
          <input
            type="radio"
            name="defaultGoal"
            :value="goal.id"
            :checked="config.defaultGoalId === goal.id"
            @change="setDefaultGoal(goal.id)"
            class="h-4 w-4 border-gray-300 text-gray-900 focus:ring-gray-900" />
          <div>
            <p class="text-sm text-gray-700">{{ goal.title }}</p>
            <p class="text-xs text-gray-400">{{ goal.type }} · {{ goal.mainCurrency }}</p>
          </div>
        </label>
      </div>
    </div>

    <!-- Merchant mappings -->
    <div v-if="config.enabled && mappingEntries.length" class="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
      <p class="text-sm font-medium text-gray-900 mb-1">Comercios memorizados</p>
      <p class="text-xs text-gray-500 mb-3">Los pagos de estos comercios se categorizan automáticamente</p>
      <div class="space-y-2">
        <div
          v-for="[merchant, mapping] in mappingEntries"
          :key="merchant"
          class="flex items-center justify-between px-3 py-2.5 rounded-xl bg-gray-50">
          <div class="flex items-center gap-3 min-w-0">
            <component
              :is="getIconComponent(mapping.categoryIcon)"
              class="h-5 w-5 text-gray-400 shrink-0" />
            <div class="min-w-0">
              <p class="text-sm text-gray-700 truncate">{{ merchant }}</p>
              <p class="text-xs text-gray-400">{{ mapping.categoryName }}</p>
            </div>
          </div>
          <button
            @click="handleDeleteMapping(merchant)"
            class="p-1.5 rounded-lg hover:bg-gray-200 transition shrink-0 ml-2">
            <TrashIcon class="h-4 w-4 text-gray-400" />
          </button>
        </div>
      </div>
    </div>

    <!-- Info -->
    <div v-if="config.enabled" class="bg-gray-50 rounded-2xl p-4">
      <div class="flex gap-3">
        <InformationCircleIcon class="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
        <div class="text-xs text-gray-500 space-y-1">
          <p>Los pagos se detectan leyendo las notificaciones de tus apps bancarias.</p>
          <p>Cuando detectamos una compra en un comercio nuevo, te pediremos elegir la categoría. Las siguientes veces se asignará automáticamente.</p>
          <p class="text-gray-400">No almacenamos ni compartimos datos de tus notificaciones.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import * as OutlineIcons from '@heroicons/vue/24/outline';
import {
  ArrowLeftIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  CreditCardIcon,
  InformationCircleIcon,
  TrashIcon,
} from '@heroicons/vue/24/outline';
import { SUPPORTED_BANKS } from '@/utils/business/bankNotificationParser';
import { fetchGoals } from '@/utils/business/goals';
import NotificationListener from '@/plugins/notification-listener';

const auth = getAuth();
const permissionGranted = ref(false);
const errorMessage = ref('');
const availableBanks = SUPPORTED_BANKS;
const goals = ref([]);
const config = ref({
  enabled: false,
  monitoredBanks: [],
  defaultGoalId: null,
  goalOverrides: {},
  merchantMappings: {},
});

const mappingEntries = computed(() => {
  const mappings = config.value.merchantMappings || {};
  return Object.entries(mappings).sort((a, b) => a[0].localeCompare(b[0]));
});

const getIconComponent = (iconName) => {
  const Icon = OutlineIcons[iconName];
  if (!Icon) return null;
  return Icon;
};

async function checkPermissionStatus() {
  try {
    const result = await NotificationListener.isPermissionGranted();
    permissionGranted.value = result.granted;
  } catch (e) {
    console.error('Error checking permission:', e);
    permissionGranted.value = false;
  }
}

async function loadConfig() {
  try {
    const { getAutoPaymentConfig } = await import('@/services/autoPayment');
    const saved = await getAutoPaymentConfig();
    if (saved) {
      config.value = {
        enabled: saved.enabled || false,
        monitoredBanks: saved.monitoredBanks || [],
        defaultGoalId: saved.defaultGoalId || null,
        goalOverrides: saved.goalOverrides || {},
        merchantMappings: saved.merchantMappings || {},
      };
    }
  } catch (e) {
    console.error('Error loading config:', e);
  }
}

async function save() {
  const { saveAutoPaymentConfig } = await import('@/services/autoPayment');
  await saveAutoPaymentConfig(config.value);
}

async function toggleEnabled() {
  if (!permissionGranted.value && !config.value.enabled) {
    await handleRequestPermission();
    return;
  }
  config.value.enabled = !config.value.enabled;
  await save();

  if (config.value.enabled) {
    const { startAutoPayment } = await import('@/services/autoPayment');
    await startAutoPayment();
  } else {
    const { stopAutoPayment } = await import('@/services/autoPayment');
    await stopAutoPayment();
  }
}

function toggleBank(packageName) {
  const idx = config.value.monitoredBanks.indexOf(packageName);
  if (idx >= 0) {
    config.value.monitoredBanks.splice(idx, 1);
  } else {
    config.value.monitoredBanks.push(packageName);
  }
  save();
}

function setDefaultGoal(goalId) {
  config.value.defaultGoalId = goalId;
  save();
}

async function handleDeleteMapping(merchantKey) {
  const { deleteMerchantMapping } = await import('@/services/autoPayment');
  await deleteMerchantMapping(merchantKey);
  // Actualizar local
  const mappings = { ...config.value.merchantMappings };
  delete mappings[merchantKey];
  config.value.merchantMappings = mappings;
}

async function handleRequestPermission() {
  errorMessage.value = '';
  try {
    await NotificationListener.requestPermission();
  } catch (e) {
    errorMessage.value = 'No se pudo abrir la configuración: ' + (e.message || e);
    console.error('Error requesting permission:', e);
  }
}

// Re-check permission when user comes back from Android Settings
function onVisibilityChange() {
  if (document.visibilityState === 'visible' && Capacitor.isNativePlatform()) {
    checkPermissionStatus();
  }
}

onMounted(() => {
  document.addEventListener('visibilitychange', onVisibilityChange);

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      if (Capacitor.isNativePlatform()) {
        await checkPermissionStatus();
      }
      await loadConfig();
      goals.value = (await fetchGoals()).filter(g => !g.isArchived);
    }
  });
});

onUnmounted(() => {
  document.removeEventListener('visibilitychange', onVisibilityChange);
});
</script>
