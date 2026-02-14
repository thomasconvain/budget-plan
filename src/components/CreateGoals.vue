<template>
  <div>
    <div class="w-full flex justify-end mb-4">
      <button
        class="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition"
        @click="$router.push({ name: 'Dashboard' })">
        <ArrowLeftIcon class="h-4 w-4 text-white" aria-hidden="true" />
      </button>
    </div>

    <h1 v-if="!type" class="text-2xl font-bold text-gray-900 mb-1 mt-12">¿Qué quieres agregar?</h1>
    <h1 v-else class="text-2xl font-bold text-gray-900 mb-1">Configura tu {{ type?.toLowerCase() }}</h1>
    <p class="text-sm text-gray-400 mb-6">
      {{ stage === 1 && !type ? 'Elige el tipo y un nombre' : stage === 1 ? 'Un paso más' : stage === 2 ? 'Moneda y montos' : 'Día de facturación' }}
    </p>

    <!-- Etapa 1: Información básica -->
    <div v-if="stage === 1" class="flex flex-col gap-5">
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <p class="text-xs font-medium text-gray-400 mb-3">Tipo</p>
        <div class="grid grid-cols-2 gap-3">
          <button
            type="button"
            @click="type = 'Cuenta bancaria'"
            :class="[
              'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition',
              type === 'Cuenta bancaria'
                ? 'border-gray-900 bg-gray-50'
                : 'border-gray-100 hover:border-gray-200'
            ]">
            <div class="flex items-center justify-center h-10 w-10 rounded-xl bg-emerald-50">
              <CurrencyDollarIcon class="h-5 w-5 text-emerald-600" aria-hidden="true" />
            </div>
            <span class="text-sm font-medium text-gray-900">Cuenta bancaria</span>
          </button>
          <button
            type="button"
            @click="type = 'Tarjeta de crédito'"
            :class="[
              'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition',
              type === 'Tarjeta de crédito'
                ? 'border-gray-900 bg-gray-50'
                : 'border-gray-100 hover:border-gray-200'
            ]">
            <div class="flex items-center justify-center h-10 w-10 rounded-xl bg-gray-900">
              <CreditCardIcon class="h-5 w-5 text-white" aria-hidden="true" />
            </div>
            <span class="text-sm font-medium text-gray-900">Tarjeta de crédito</span>
          </button>
        </div>
      </div>

      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <label class="block text-xs font-medium text-gray-400 mb-1.5">Nombre</label>
        <input
          v-model="title"
          type="text"
          class="block w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent text-sm text-gray-900"
          placeholder="Ej: Tarjeta BCi XXX"
        />
      </div>

      <button
        @click="nextStage"
        :disabled="!canProceedToNextStage"
        class="w-full py-3 text-sm font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition active:scale-[0.98] flex items-center justify-center gap-2">
        <span>Siguiente</span>
        <ArrowRightIcon class="h-4 w-4" aria-hidden="true" />
      </button>
    </div>

    <!-- Etapa 2: Configuración de moneda y montos -->
    <div v-if="stage === 2" class="flex flex-col gap-5">
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <p class="text-xs font-medium text-gray-400 mb-3">Moneda</p>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="option in options"
            :key="option.value"
            :class="[
              'inline-flex items-center gap-2 px-4 py-2 rounded-xl border transition w-full sm:w-auto',
              mainCurrency === option.value
                ? 'border-gray-900 bg-gray-900 text-white'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
            ]"
            @click="selectCurrency(option.value)"
            :disabled="option.disabled">
            <country-flag :country="option.countryCode" rounded class="shrink-0" />
            <span class="text-sm font-medium">{{ option.text }}</span>
          </button>
        </div>
      </div>

      <div v-if="type === 'Tarjeta de crédito'" class="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <label class="block text-xs font-medium text-gray-400 mb-1.5">Cupo máximo de gasto</label>
        <CurrencyInput
          v-model.lazy="availableAmount"
          class="w-full"
          :placeholder="placeholderAmount"
          :currency="mainCurrency"
          :showSelect="false"
          :options="{ currency: mainCurrency, currencyDisplay: 'hidden' }"
        />
        <p class="mt-2 text-xs text-gray-400">Cupo de tu tarjeta o el monto que quieras controlar</p>
      </div>

      <div v-else class="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <label class="block text-xs font-medium text-gray-400 mb-1.5">Balance actual</label>
        <CurrencyInput
          v-model.lazy="currentBalanceOnAccount"
          class="w-full"
          :placeholder="placeholderAmount"
          :currency="mainCurrency"
          :showSelect="false"
          :options="{ currency: mainCurrency, currencyDisplay: 'hidden' }"
        />
      </div>

      <div class="flex gap-3">
        <button
          @click="previousStage"
          class="flex-1 py-3 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition flex items-center justify-center gap-2">
          <ArrowLeftIcon class="h-4 w-4" aria-hidden="true" />
          Atrás
        </button>
        <button
          v-if="type === 'Tarjeta de crédito'"
          @click="nextStage"
          :disabled="!canProceedToNextStage"
          class="flex-1 py-3 text-sm font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition active:scale-[0.98] flex items-center justify-center gap-2">
          <span>Siguiente</span>
          <ArrowRightIcon class="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          v-else
          @click="handleSaveGoal"
          :disabled="!canSaveGoal"
          class="flex-1 py-3 text-sm font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition active:scale-[0.98] flex items-center justify-center gap-2">
          <svg v-if="isLoading" class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span v-else>Crear cuenta</span>
        </button>
      </div>
    </div>

    <!-- Etapa 3: Día de facturación (solo tarjetas de crédito) -->
    <div v-if="stage === 3" class="flex flex-col gap-5">
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <label class="block text-xs font-medium text-gray-400 mb-1.5">Día de facturación</label>
        <p class="text-sm text-gray-500 mb-3">El día del mes en que se factura. Se renovará automáticamente cada mes.</p>
        <select
          v-model.number="billingDay"
          class="block w-full h-10 px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent text-sm text-gray-900">
          <option v-for="day in 31" :key="day" :value="day">{{ day }}</option>
        </select>
      </div>

      <div class="flex gap-3">
        <button
          @click="previousStage"
          class="flex-1 py-3 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition flex items-center justify-center gap-2">
          <ArrowLeftIcon class="h-4 w-4" aria-hidden="true" />
          Atrás
        </button>
        <button
          @click="handleSaveGoal"
          :disabled="!canSaveGoal"
          class="flex-1 py-3 text-sm font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition active:scale-[0.98] flex items-center justify-center gap-2">
          <svg v-if="isLoading" class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span v-else>Crear tarjeta</span>
        </button>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import CurrencyInput from './CurrencyInput.vue';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { fetchGoals } from '../utils/business/goals.js';
import { useRouter } from 'vue-router';
import { ArrowRightIcon, ArrowLeftIcon, CreditCardIcon, CurrencyDollarIcon } from '@heroicons/vue/24/outline';
import CountryFlag from 'vue-country-flag-next';
import { deriveKey, encrypt } from '@/services/encryption';
import { calculateBillingPeriod } from '@/utils/billingPeriod';



const router = useRouter();
const goals = ref([]);
const title = ref('');
const type=ref(null);
const availableAmount = ref(null);
const currentBalanceOnAccount = ref(null);
const mainCurrency = ref('CLP');
const billingDay = ref(1);
const options = ref([
  { value: 'CLP', text: 'Pesos Chilenos', countryCode: 'CL' },
  { value: 'COP', text: 'Pesos Colombianos', countryCode: 'CO' },
  { value: 'EUR', text: 'Euros', countryCode: 'EU' },
  { value: 'USD', text: 'Dólares', countryCode: 'US' }
]);
const placeholderAmount = computed(() => {
  const map = {
    CLP: '100.000',
    COP: '400.000',
    EUR: '1.000',  // ajusta formato si necesitas
  };
  return map[mainCurrency.value] || '';
});
const isLoading = ref(false);

const stage = ref(1);

const computedAvailableAmount = computed(() => type.value === 'Cuenta bancaria' ? 0 : null);
const computedCurrentBalanceOnAccount = computed(() => type.value === 'Tarjeta de crédito' ? 0 : null);

watch(computedAvailableAmount, (newValue) => {
  availableAmount.value = newValue;
});

watch(computedCurrentBalanceOnAccount, (newValue) => {
  currentBalanceOnAccount.value = newValue;
});

const canProceedToNextStage = computed(() => {
  if (stage.value === 1) return type.value !== null && title.value;
  if (stage.value === 2) return mainCurrency.value && (availableAmount.value || currentBalanceOnAccount.value);
  if (stage.value === 3) return billingDay.value >= 1 && billingDay.value <= 31;
  return false;
});

const canSaveGoal = computed(() => canProceedToNextStage.value && (type.value === 'Cuenta bancaria' ? stage.value === 2 : stage.value === 3));

function selectCurrency(value) {
  mainCurrency.value = value;
}

const nextStage = () => {
  if (canProceedToNextStage.value && stage.value < 3) stage.value++;
};

const previousStage = () => {
  if (stage.value > 1) stage.value--;
};

const auth = getAuth();
const db = getFirestore();

const handleSaveGoal = async () => {
  isLoading.value = true;
  const user = auth.currentUser;
  if (user && canSaveGoal.value) {
    const key = deriveKey(user.uid);

    const encryptedType = encrypt(type.value, key);
    const encryptedTitle = encrypt(title.value, key);
    const encryptedMainCurrency = encrypt(mainCurrency.value, key);
    const encryptedAvailableAmount = encrypt((availableAmount.value || 0).toString(), key);
    const encryptedCurrentBalanceOnAccount = encrypt((currentBalanceOnAccount.value || 0).toString(), key);

    const goalData = {
      type: encryptedType,
      title: encryptedTitle,
      userId: user.uid,
      availableAmount: encryptedAvailableAmount,
      currentBalanceOnAccount: encryptedCurrentBalanceOnAccount,
      mainCurrency: encryptedMainCurrency,
    };

    if (type.value === 'Tarjeta de crédito') {
      const { validFrom, validUntil } = calculateBillingPeriod(billingDay.value);
      goalData.validFrom = Timestamp.fromDate(validFrom);
      goalData.validUntil = Timestamp.fromDate(validUntil);
      goalData.billingDay = billingDay.value;
      goalData.isRecurring = true;
      goalData.isArchived = false;
    } else {
      goalData.validFrom = Timestamp.fromDate(new Date());
      goalData.validUntil = null;
    }

    await addDoc(collection(db, 'goals'), goalData);

    goals.value = await fetchGoals();
    type.value = '';
    title.value = '';
    availableAmount.value = '';
    currentBalanceOnAccount.value = '';
    billingDay.value = 1;
    stage.value = 1;

    router.push('/dashboard');
  }
};
</script>

<style>
.normal-flag {
  margin: 0 !important;
  margin-left: -0.7rem !important;
}
</style>
