<template>
  <div v-if="isLoading">
    <LoadingSpinner />
  </div>
  <div v-else>
    <h1 class="text-2xl font-semibold	mb-4">Tus metas</h1>
    <div v-if="goals.length > 0" class="max-w-4xl mx-auto bg-white shadow-lg rounded-lg">
      <ul role="list" class="divide-y divide-gray-200">
  <li v-for="goal in goals" :key="goal.id" class="flex items-center justify-between px-4 py-4 hover:bg-gray-50 rounded-lg">
    <router-link :to="`/goal/${goal.id}`" class="flex items-center flex-1">
      <CurrencyDollarIcon class="h-6 w-6" aria-hidden="true" />
      <div class="ml-4">
        <p class="text-sm font-medium text-gray-900">{{ goal.title }}</p>
        <p class="text-sm text-gray-500">{{ goal.description }}</p>
      </div>
      <div class="text-right ml-auto">
        <p v-if="calculateDaysRemaining(goal.validUntil.toDate()) > 0" class="text-sm text-gray-500">Termina en {{calculateDaysRemaining(goal.validUntil.toDate()) }}  {{ calculateDaysRemaining(goal.validUntil.toDate()) <= 1 ? 'día' : 'días' }}</p>
        <p v-else class="text-sm text-gray-500">Meta terminada</p>
      </div>
    </router-link>
    <button @click="handleDeleteGoal(goal.id)" class="ml-4 text-slate-300 hover:text-red-600"><TrashIcon class="h-4 w-4" aria-hidden="true" /></button>
  </li>
</ul>

    </div>
    <p v-else>No tienes metas registradas.</p>

    <h1 class="mt-6 text-2xl font-semibold	mb-4">Crear nueva meta</h1>
    <div class="my-1 flex gap-1 flex-wrap sm:flex-nowrap">
    <input 
      v-model="title"
      type="text" 
      class="my-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
      placeholder="Título" />
    <input
      v-model="description"
      type="text"
      class="my-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
      placeholder="Descripción" />
    </div>
    <div class="my-1 flex gap-1 flex-wrap sm:flex-nowrap">
      <select
          v-model="mainCurrency"
          placeholder="Divisa principal"
          class="block w-full sm:w-1/2 pl-2 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
          <option v-for="option in options" :key="option.value" :value="option.value" :disabled="option.disabled">
            {{ option.text }}
          </option>
      </select>
      <CurrencyInput
        v-if="mainCurrency == 'CLP'"
        v-model="availableAmount"
        class="w-full"
        placeholder="Ingresos"
        :showSelect="false"
        :options="{ currency: 'CLP'
         }"
      />
      <CurrencyInput
        v-if="mainCurrency == 'COP'"
        v-model="availableAmount"
        class="w-full"
        placeholder="Ingresos"
        :showSelect="false"
        :options="{ currency: 'COP'
         }"
      />
      <CurrencyInput
        v-if="mainCurrency == 'CLP'"
        v-model="savingGoalAmount"
        class="w-full"
        placeholder="Objetivo de ahorro"
        :showSelect="false"
        :options="{ currency: 'CLP'
         }"
      />
      <CurrencyInput
        v-if="mainCurrency == 'COP'"
        v-model="savingGoalAmount"
        class="w-full"
        placeholder="Objetivo de ahorro"
        :showSelect="false"
        :options="{ currency: 'COP'
         }"
      />
    </div>
    <div class="my-1 flex gap-1 flex-wrap sm:flex-nowrap">
      <div class="flex flex-col w-full">
        <label for="ValidFrom" class="block text-sm font-medium leading-6 text-gray-900">Fecha de inicio</label>
        <input
          v-model="validFrom"
          name="validFrom"
          type="date"
          class="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder="Válido desde" />
      </div>
      <div class="flex flex-col w-full">
        <label for="ValidUntil" class="block text-sm font-medium leading-6 text-gray-900">Fecha de termino</label>
        <input
          v-model="validUntil"
          type="date"
          class="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder="Válido hasta" />
      </div>
    </div>
    <button
      class="mt-4 relative flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg group hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      @click="handleSaveGoal">
        Crear meta
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import CurrencyInput from './CurrencyInput.vue';
import { getFirestore, collection, addDoc, getDocs, query, where, deleteDoc, doc, writeBatch, Timestamp } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { CurrencyDollarIcon, TrashIcon } from '@heroicons/vue/24/outline';
// import {formatDateToLargeString} from '../utils/dateFormatter.js'
import {fetchGoals} from '../utils/business/goals.js'

const isLoading = ref('true')
const title = ref('');
const description = ref('');
const availableAmount = ref(null);
const savingGoalAmount = ref(null);
const mainCurrency = ref('CLP')
const validFrom = ref('');
const validUntil = ref('');
const goals = ref([]);
const options = ref([
  { value: '', text: 'Selecciona la moneda principal', disabled: true },
  { value: 'CLP', text: 'Pesos Chilenos' },
  { value: 'COP', text: 'Pesos Colombianos' },
]);

const auth = getAuth();
const db = getFirestore();

const handleSaveGoal = async () => {
  const user = auth.currentUser;
  if (user && title.value && savingGoalAmount.value && mainCurrency.value && validFrom.value && validUntil.value) {
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

    // Actualizar la lista de goals después de agregar uno nuevo
    goals.value = await fetchGoals();

    // Limpiar los campos del formulario
    title.value = '';
    description.value = '';
    availableAmount.value = '';
    savingGoalAmount.value = '';
    validFrom.value = '';
    validUntil.value = '';
  }
};

const handleDeleteGoal = async (goalId) => {
  const user = auth.currentUser;
  if (user) {
    // Primero, elimina todos los pagos asociados a este goalId
    const paymentsQuery = query(collection(db, 'payments'), where('goalId', '==', goalId), where('userId', '==', user.uid));
    const paymentsSnapshot = await getDocs(paymentsQuery);
    
    const batch = writeBatch(db);
    
    paymentsSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    // Luego, elimina la meta
    await deleteDoc(doc(db, 'goals', goalId));

    // Actualizar la lista de metas después de eliminar
    goals.value = await fetchGoals();
  }
};

const calculateDaysRemaining = (targetDate) => {
  const today = new Date();
  const differenceInMillis = targetDate - today;
  return Math.ceil(differenceInMillis / (1000 * 60 * 60 * 24));
}

onMounted(() => {
  onAuthStateChanged(auth, async (user) => {
      isLoading.value = true;
    if (user) {
      goals.value = await fetchGoals();
      isLoading.value = false; // Desactivar estado de carga cuando todo esté cargado
    }
  });
});
</script>


