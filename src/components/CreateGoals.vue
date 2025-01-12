<template>
  <div>
    <div class="w-full flex justify-end">
      <button
        class="px-4 py-2 text-xs font-medium text-indigo-700 bg-indigo-50 border border-transparent rounded-lg hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        @click="() => { $router.push({ name: 'Dashboard' }); }">
          Volver
      </button>
    </div>
    <h1 v-if="!type" class="mt-6 text-2xl font-semibold mb-4">Elige lo que quieres agregar a tu perfil</h1>
    <h1 v-else class="mt-6 text-2xl font-semibold mb-4">Configura tu nueva {{ type?.toLowerCase() }}</h1>
    <!-- Etapa 1: Información básica -->
    <div v-if="stage === 1" class="my-1 flex flex-col gap-4">
      <div class="flex flex-col gap-2">
        <div class="flex items-center">
          <input
            v-model="type"
            type="radio"
            id="bankAccount"
            value="Cuenta bancaria"
            class="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
          />
          <label for="bankAccount" class="ml-2 text-sm text-gray-700">Cuenta bancaria</label>
        </div>
        <div class="flex items-center">
          <input
            v-model="type"
            type="radio"
            id="creditCard"
            value="Tarjeta de crédito"
            class="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
          />
          <label for="creditCard" class="ml-2 text-sm text-gray-700">Tarjeta de crédito</label>
        </div>
        <label class="text-sm font-medium text-gray-700 mt-4">¿Cómo quieres que se llame?</label>
        <input
          v-model="title"
          type="text"
          class="my-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder="por ej: Tarjeta BCi XXX" />
      </div>
      <div class="flex justify-end">
        <button
          @click="nextStage"
          :disabled="!canProceedToNextStage"
          class="mt-2 flex gap-2 items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400">
          <ArrowRightIcon class="h-4 w-4" aria-hidden="true" />
          Siguiente
        </button>
      </div>
    </div>

    <!-- Etapa 2: Configuración de moneda y montos -->
    <div v-if="stage === 2" class="my-1 flex flex-col gap-1">
      <!-- <select
        v-model="mainCurrency"
        class="block w-full pl-2 pr-3 py-2 my-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
        <option v-for="option in options" :key="option.value" :value="option.value" :disabled="option.disabled">
          {{ option.text }}
        </option>
      </select> -->
      <div>
        <p class="text-sm/6 text-gray-600">Elige la moneda principal de tu objetivo:</p>
      </div>
      <div class="flex sm:flex-row flex-col gap-2">
        <button
          v-for="option in options"
          :key="option.value"
          :class="[
            'flex items-center px-4 py-2 border rounded-lg transition',
            mainCurrency === option.value
              ? 'bg-indigo-500 text-white'
              : 'bg-gray-200 text-gray-700',
            'hover:bg-indigo-300 hover:text-white'
          ]"
          @click="selectCurrency(option.value)"
          :disabled="option.disabled"
        >
          <country-flag
            :country="option.countryCode"
            rounded
            class=""
          />
          {{ option.text }}
        </button>
      </div>
      <div v-if="type === 'Tarjeta de crédito'">
        <div>
          <p  class="text-sm/6 text-gray-600 mt-4">Indica el monto de gasto máximo que quieres configurar para esta tarjeta:</p>
        </div>
        <CurrencyInput
          v-if="mainCurrency == 'CLP'"
          v-model="availableAmount"
          class="w-full my-1"
          placeholder="100.000"
          :showSelect="false"
          :options="{ currency: mainCurrency }"
        />
        <CurrencyInput
          v-if="mainCurrency == 'COP'"
          v-model="availableAmount"
          class="w-full my-1"
          placeholder="400.000"
          :showSelect="false"
          :options="{ currency: mainCurrency }"
        />
        <p class="mb-3 text-sm/6 text-gray-400 italic">Puede ser el cupo de tu tarjeta de crédito o cualquier monto que estimes conveniente para mantener el control sobre tus finanzas</p>
      </div>
      <div v-else>
        <div>
          <p  class="text-sm/6 text-gray-600 mt-4">Indica el balance actual que tienes en tu cuenta:</p>
        </div>
        <CurrencyInput
          v-if="mainCurrency == 'CLP'"
          v-model="currentBalanceOnAccount"
          class="w-full my-1"
          placeholder="100.000"
          :showSelect="false"
          :options="{ currency: mainCurrency }"
        />
        <CurrencyInput
          v-if="mainCurrency == 'COP'"
          v-model="currentBalanceOnAccount"
          class="w-full my-1"
          placeholder="400.000"
          :showSelect="false"
          :options="{ currency: mainCurrency }"
        />
      </div>
      <div class="flex justify-between">
        <button @click="previousStage" class="flex gap-2 items-center mt-2 text-indigo-600 hover:text-indigo-800">
          <ArrowLeftIcon class="h-4 w-4" aria-hidden="true" />
          Atrás
        </button>
        <button
          v-if="type === 'Tarjeta de crédito'"
          @click="nextStage"
          :disabled="!canProceedToNextStage"
          class="flex gap-2 items-center mt-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400">
          <ArrowRightIcon class="h-4 w-4" aria-hidden="true" />
          Siguiente
        </button>
        <button
          v-else
          @click="handleSaveGoal"
          :disabled="!canSaveGoal"
          class="mt-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400">
          <svg v-if="isLoading" aria-hidden="true" role="status" class="inline w-4 h-4 me-3 text-white animate-spin" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="#E5E7EB"/>
            <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentColor"/>
          </svg>
          Crear {{ type?.toLowerCase() }}
        </button>
      </div>
    </div>

    <!-- Etapa 3: Fechas -->
    <div v-if="stage === 3" class="my-1 flex flex-col gap-4">
  <!-- Fecha de inicio -->
  <div class="flex flex-col w-full">
    <label for="ValidFrom" class="block text-sm font-medium leading-6 text-gray-900">
      Fecha de inicio
    </label>
    <input
      v-model="validFrom"
      name="validFrom"
      type="date"
      class="block w-full px-3 py-2 my-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
      placeholder="Válido desde"
    />
  </div>

  <!-- Fecha de término -->
  <div class="flex flex-col w-full">
    <div class="flex items-center justify-between">
      <label for="ValidUntil" class="block text-sm font-medium leading-6 text-gray-900">
        Fecha de facturación
      </label>
      <div class="flex items-center">
        <input
          v-model="disableValidUntil"
          type="checkbox"
          id="disableValidUntil"
          class="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
        />
        <label for="disableValidUntil" class="ml-2 text-sm text-gray-700">Sin fecha de facturación</label>
      </div>
    </div>
    <input
      v-model="validUntil"
      :disabled="disableValidUntil"
      :min="validFrom"
      type="date"
      class="block w-full my-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
      placeholder="Válido hasta"
    />
  </div>

  <!-- Botones de navegación -->
  <div class="flex justify-between">
    <button @click="previousStage" class="flex gap-2 items-center mt-2 text-indigo-600 hover:text-indigo-800">
      <ArrowLeftIcon class="h-4 w-4" aria-hidden="true" />
      Atrás
    </button>
    <button
      @click="handleSaveGoal"
      :disabled="!canSaveGoal"
      class="mt-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400">
      <svg v-if="isLoading" aria-hidden="true" role="status" class="inline w-4 h-4 me-3 text-white animate-spin" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="#E5E7EB"/>
        <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentColor"/>
      </svg>
      Crear {{ type?.toLowerCase() }}
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
import { ArrowRightIcon, ArrowLeftIcon } from '@heroicons/vue/24/outline';
import CountryFlag from 'vue-country-flag-next';


const router = useRouter();
const goals = ref([]);
const title = ref('');
const type=ref(null);
const availableAmount = ref(null);
const currentBalanceOnAccount = ref(null);
const mainCurrency = ref('CLP');
const today = new Date().toISOString().split('T')[0];
const validFrom = ref(today);
const validUntil = ref('');
const disableValidUntil = ref(false); // Controla si la fecha de término está deshabilitada
const options = ref([
  { value: 'CLP', text: 'Pesos Chilenos', countryCode: 'CL' },
  { value: 'COP', text: 'Pesos Colombianos', countryCode: 'CO' },
]);
const isLoading = ref(false);

const stage = ref(1);

const computedDisableValidUntil = computed(() => type.value === 'Cuenta bancaria');
const computedAvailableAmount = computed(() => type.value === 'Cuenta bancaria' ? 0 : null);
const computedCurrentBalanceOnAccount = computed(() => type.value === 'Tarjeta de crédito' ? 0 : null);

watch(computedDisableValidUntil, (newValue) => {
  disableValidUntil.value = newValue;
});

watch(computedAvailableAmount, (newValue) => {
  availableAmount.value = newValue;
});

watch(computedCurrentBalanceOnAccount, (newValue) => {
  currentBalanceOnAccount.value = newValue;
});

const canProceedToNextStage = computed(() => {
  if (stage.value === 1) return type.value !== null;
  if (stage.value === 2) return mainCurrency.value && (availableAmount.value || currentBalanceOnAccount.value);
  if (stage.value === 3) return validFrom.value && (validUntil.value || disableValidUntil.value);
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
    await addDoc(collection(db, 'goals'), {
      type: type.value,
      title: title.value,
      userId: user.uid,
      availableAmount: parseFloat(availableAmount.value),
      currentBalanceOnAccount: parseFloat(currentBalanceOnAccount.value),
      mainCurrency: mainCurrency.value,
      validFrom: Timestamp.fromDate(new Date(validFrom.value)),
      validUntil: validUntil.value ? Timestamp.fromDate(new Date(validUntil.value)) : null,
    });

    goals.value = await fetchGoals();
    type.value = '';
    title.value = '';
    availableAmount.value = '';
    currentBalanceOnAccount.value = '';
    validFrom.value = '';
    validUntil.value = '';
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
