<template>
  <div>
    <div class="w-full flex justify-end">
      <button
        class="px-4 py-2 text-xs font-medium text-indigo-700 bg-indigo-50 border border-transparent rounded-lg hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        @click="() => { $router.push({ name: 'Dashboard' }); }">
          Volver
      </button>
    </div>
    <h1 class="mt-6 text-2xl font-semibold mb-4">Tu nuevo presupuesto</h1>

    <!-- Etapa 1: Información básica -->
    <div v-if="stage === 1" class="my-1 flex flex-col gap-1">
      <input 
        v-model="title"
        type="text"
        class="my-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        placeholder="Título" />
      <input
        v-model="description"
        type="text"
        class="my-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        placeholder="Descripción (opcional)" />
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
      <CurrencyInput
        v-if="mainCurrency == 'CLP'"
        v-model="availableAmount"
        class="w-full my-1"
        placeholder="Ingresos"
        :showSelect="false"
        :options="{ currency: mainCurrency }"
      />
      <CurrencyInput
        v-if="mainCurrency == 'COP'"
        v-model="availableAmount"
        class="w-full my-1"
        placeholder="Ingresos"
        :showSelect="false"
        :options="{ currency: mainCurrency }"
      />
      <p class="mb-3 text-sm/6 text-gray-400 italic">Indica el monto que tendrás disponible durante el periodo</p>
      <CurrencyInput
        v-if="mainCurrency == 'CLP' && !savingDisabled"
        v-model="savingGoalAmount"
        :disabled="savingDisabled"
        class="w-full my-1"
        placeholder="Meta de ahorro"
        :showSelect="false"
        :options="{ currency: mainCurrency }"
      />
      <CurrencyInput
        v-if="mainCurrency == 'COP' && !savingDisabled"
        v-model="savingGoalAmount"
        :disabled="savingDisabled"
        class="w-full my-1"
        placeholder="Meta de ahorro"
        :showSelect="false"
        :options="{ currency: mainCurrency }"
      />
      <p v-if="!savingDisabled" class="mb-3 text-sm/6 text-gray-400 italic">Indica el monto que esperas ahorrar durante el periodo.</p>
      <div class="relative flex gap-x-3">
        <div class="flex h-6 items-center">
          <input @change="savingGoalAmount = 0, savingDisabled = !savingDisabled" id="candidates" name="candidates" type="checkbox" :checked="savingDisabled" class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600">
        </div>
        <div class="text-sm/6">
          <label for="candidates" class="font-medium text-gray-900">Prefiero no ahorrar para este presupuesto</label>
        </div>
      </div>
      <div class="flex justify-between">
        <button @click="previousStage" class="flex gap-2 items-center mt-2 text-indigo-600 hover:text-indigo-800">
          <ArrowLeftIcon class="h-4 w-4" aria-hidden="true" />
          Atrás
        </button>
        <button
          @click="nextStage"
          :disabled="!canProceedToNextStage"
          class="flex gap-2 items-center mt-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400">
          <ArrowRightIcon class="h-4 w-4" aria-hidden="true" />
          Siguiente
        </button>
      </div>
    </div>

    <!-- Etapa 3: Fechas -->
    <div v-if="stage === 3" class="my-1 flex flex-col gap-1">
      <div class="flex flex-col w-full">
        <label for="ValidFrom" class="block text-sm font-medium leading-6 text-gray-900">Fecha de inicio</label>
        <input
          v-model="validFrom"
          name="validFrom"
          type="date"
          class="block w-full px-3 py-2 my-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder="Válido desde" />
      </div>
      <div class="flex flex-col w-full">
        <label for="ValidUntil" class="block text-sm font-medium leading-6 text-gray-900">Fecha de termino</label>
        <input
          v-model="validUntil"
          :min="validFrom"
          type="date"
          class="block w-full my-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder="Válido hasta" />
      </div>
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
          Crear presupuesto
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
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
const description = ref('');
const availableAmount = ref(null);
const savingGoalAmount = ref(null);
const savingDisabled = ref(false);
const mainCurrency = ref('CLP');
const today = new Date().toISOString().split('T')[0];
const validFrom = ref(today);
const validUntil = ref('');
const options = ref([
  { value: 'CLP', text: 'Pesos Chilenos', countryCode: 'CL' },
  { value: 'COP', text: 'Pesos Colombianos', countryCode: 'CO' },
]);
const isLoading = ref(false);

const stage = ref(1);

const canProceedToNextStage = computed(() => {
  if (stage.value === 1) return title.value.trim() !== '';
  if (stage.value === 2) return mainCurrency.value && availableAmount.value && (savingGoalAmount.value || savingDisabled.value);
  if (stage.value === 3) return validFrom.value && validUntil.value;
  return false;
});

const canSaveGoal = computed(() => canProceedToNextStage.value && stage.value === 3);

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
      title: title.value,
      description: description.value,
      userId: user.uid,
      availableAmount: parseFloat(availableAmount.value),
      savingGoalAmount: parseFloat(savingGoalAmount.value),
      mainCurrency: mainCurrency.value,
      validFrom: Timestamp.fromDate(new Date(validFrom.value)),
      validUntil: Timestamp.fromDate(new Date(validUntil.value)),
    });

    goals.value = await fetchGoals();
    title.value = '';
    description.value = '';
    availableAmount.value = '';
    savingGoalAmount.value = '';
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
