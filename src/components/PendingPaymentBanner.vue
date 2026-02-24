<template>
  <TransitionGroup
    name="pending-payment"
    tag="div"
    class="fixed bottom-20 left-0 right-0 z-50 flex flex-col items-center gap-2 px-4 pointer-events-none">
    <div
      v-for="payment in pendingPayments"
      :key="payment.id"
      class="w-full max-w-md bg-white rounded-2xl shadow-lg border border-gray-100 p-4 pointer-events-auto">

      <!-- Header -->
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <div class="flex items-center justify-center h-8 w-8 rounded-xl bg-amber-50">
            <CreditCardIcon class="h-4 w-4 text-amber-500" />
          </div>
          <div>
            <p class="text-xs font-medium text-gray-900">Compra detectada</p>
            <p class="text-xs text-gray-400">{{ payment.bankName }}</p>
          </div>
        </div>
        <button
          @click="handleDismiss(payment.id)"
          class="p-1 rounded-lg hover:bg-gray-100 transition">
          <XMarkIcon class="h-4 w-4 text-gray-400" />
        </button>
      </div>

      <!-- Monto y comercio -->
      <div class="mb-3">
        <p class="text-lg font-semibold text-gray-900">
          {{ payment.currency === 'CLP' ? '$' : payment.currency + ' ' }}{{ formatAmount(payment.amount, payment.currency) }}
        </p>
        <p class="text-sm text-gray-500">{{ payment.merchant }}</p>
      </div>

      <!-- Selector de categoría -->
      <Listbox v-model="selectedCategories[payment.id]">
        <div class="relative mb-3">
          <ListboxButton class="relative w-full h-10 cursor-default rounded-xl bg-gray-50 py-0 pl-3 pr-10 text-left text-gray-900 ring-1 ring-inset ring-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 sm:text-sm">
            <span v-if="selectedCategories[payment.id]" class="flex items-center">
              <component :is="getIconComponent(selectedCategories[payment.id].icon)" class="w-4 h-4 text-gray-400" />
              <span class="ml-2 block truncate text-sm">{{ selectedCategories[payment.id].name }}</span>
            </span>
            <span v-else class="text-sm text-gray-400">Seleccionar categoría...</span>
            <span class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronUpDownIcon class="h-4 w-4 text-gray-400" />
            </span>
          </ListboxButton>
          <transition leave-active-class="transition ease-in duration-100" leave-from-class="opacity-100" leave-to-class="opacity-0">
            <ListboxOptions class="absolute z-10 mt-1 max-h-40 w-full overflow-auto rounded-xl bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
              <ListboxOption
                v-for="cat in categories"
                :key="cat.id"
                :value="cat"
                v-slot="{ active, selected }"
                as="template">
                <li :class="[active ? 'bg-gray-50 text-gray-900' : 'text-gray-700', 'relative cursor-default select-none py-2 pl-3 pr-9']">
                  <div class="flex items-center">
                    <component :is="getIconComponent(cat.icon)" class="w-4 h-4 text-gray-400" />
                    <span :class="[selected ? 'font-semibold' : 'font-normal', 'ml-2 block truncate text-sm']">{{ cat.name }}</span>
                  </div>
                  <span v-if="selected" class="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-600">
                    <CheckIcon class="h-4 w-4" />
                  </span>
                </li>
              </ListboxOption>
            </ListboxOptions>
          </transition>
        </div>
      </Listbox>

      <!-- Recordar mapeo -->
      <label class="flex items-center gap-2 mb-3 cursor-pointer">
        <input
          type="checkbox"
          v-model="rememberFlags[payment.id]"
          class="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900" />
        <span class="text-xs text-gray-500">Recordar para este comercio</span>
      </label>

      <!-- Botones -->
      <div class="flex gap-2">
        <button
          @click="handleDismiss(payment.id)"
          class="flex-1 px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition">
          Descartar
        </button>
        <button
          @click="handleConfirm(payment.id)"
          :disabled="!selectedCategories[payment.id]"
          class="flex-1 px-3 py-2 text-xs font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition disabled:opacity-40 disabled:cursor-not-allowed">
          Confirmar
        </button>
      </div>
    </div>
  </TransitionGroup>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/vue';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/vue/20/solid';
import { CreditCardIcon, XMarkIcon } from '@heroicons/vue/24/outline';
import * as OutlineIcons from '@heroicons/vue/24/outline';
import { collection, query, getDocs } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '@/firebase';

const auth = getAuth();
const categories = ref([]);
const selectedCategories = reactive({});
const rememberFlags = reactive({});
const pendingPayments = ref([]);
let confirmPendingPaymentFn = null;
let dismissPendingPaymentFn = null;
let autoPaymentLoaded = false;

const getIconComponent = (iconName) => {
  const Icon = OutlineIcons[iconName];
  if (!Icon) return null;
  return Icon;
};

function formatAmount(amount, currency) {
  if (currency === 'CLP') {
    return Math.round(amount).toLocaleString('es-CL');
  }
  return amount.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

async function fetchCategories() {
  const querySnapshot = await getDocs(query(collection(db, 'categories')));
  categories.value = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
}

async function ensureAutoPaymentLoaded() {
  if (autoPaymentLoaded) return;
  const mod = await import('@/services/autoPayment');
  pendingPayments.value = mod.pendingPayments;
  confirmPendingPaymentFn = mod.confirmPendingPayment;
  dismissPendingPaymentFn = mod.dismissPendingPayment;
  autoPaymentLoaded = true;
}

async function handleConfirm(paymentId) {
  const cat = selectedCategories[paymentId];
  if (!cat) return;

  const remember = rememberFlags[paymentId] !== false; // default true
  await ensureAutoPaymentLoaded();
  if (confirmPendingPaymentFn) {
    await confirmPendingPaymentFn(paymentId, cat.name, cat.icon, remember);
  }

  delete selectedCategories[paymentId];
  delete rememberFlags[paymentId];
}

function handleDismiss(paymentId) {
  ensureAutoPaymentLoaded().then(() => {
    if (dismissPendingPaymentFn) {
      dismissPendingPaymentFn(paymentId);
    }
  });
  delete selectedCategories[paymentId];
  delete rememberFlags[paymentId];
}

onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      fetchCategories();
      ensureAutoPaymentLoaded().catch(() => {});
    }
  });
});
</script>

<style scoped>
.pending-payment-enter-active {
  transition: all 0.3s ease-out;
}
.pending-payment-leave-active {
  transition: all 0.2s ease-in;
}
.pending-payment-enter-from {
  opacity: 0;
  transform: translateY(30px);
}
.pending-payment-leave-to {
  opacity: 0;
  transform: translateX(100px);
}
</style>
