<template>
  <div class="pt-6">
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
        <p class="text-sm text-gray-500">{{ formatDate(goal.validUntil) }}</p>
      </div>
    </router-link>
    <button @click="handleDeleteGoal(goal.id)" class="ml-4 text-red-600 hover:text-red-800">
      Eliminar
    </button>
  </li>
</ul>

    </div>
    <p v-else>No tienes metas registradas.</p>

    <h1 class="mt-6 text-2xl font-semibold	mb-4">Crear nueva meta</h1>
    <input 
      v-model="title"
      type="text" 
      class="my-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
      placeholder="Título" />
    <textarea
      v-model="description"
      class="my-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
      placeholder="Descripción">
    </textarea>
    <div class="my-1 flex gap-1 flex-wrap sm:flex-nowrap">
      <div class="relative flex w-full">
        <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
        <input
          :value="formattedAvailableAmount"
          @input="updateAvailableAmount($event)"
          type="text"
          class="block w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder="Monto disponible" />
      </div>
      <div class="relative flex w-full">
        <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
        <input
          :value="formattedSavingGoalAmount"
          @input="updateSavingGoalAmount($event)"
          type="text"
          class="block w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder="Monto objetivo de ahorro" />
      </div>
      <select
          v-model="mainCurrency"
          placeholder="Divisa principal"
          class="block w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
          <option v-for="option in options" :key="option.value" :value="option.value" :disabled="option.disabled">
        {{ option.text }}
      </option>
    </select>
    </div>
    <div class="my-1 flex gap-1 flex-wrap sm:flex-nowrap">
      <input
        v-model="validFrom"
        type="date"
        class="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        placeholder="Válido desde" />
      <input
        v-model="validUntil"
        type="date"
        class="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        placeholder="Válido hasta" />
    </div>
    <button
      class="mt-4 relative flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg group hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      @click="handleSaveGoal">
        Guardar meta
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getFirestore, collection, addDoc, getDocs, query, where, deleteDoc, doc, writeBatch, Timestamp } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { CurrencyDollarIcon } from '@heroicons/vue/24/outline';
import { formatNumber } from '../utils/currencyFormatters.js';
import {formatDate} from '../utils/dateFormatter.js'
import { computed } from 'vue';

const title = ref('');
const description = ref('');
const availableAmount = ref('');
const savingGoalAmount = ref('');
const mainCurrency = ref('')
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

const fetchGoals = async () => {
  const user = auth.currentUser;
  if (user) {
    const q = query(collection(db, 'goals'), where('userId', '==', user.uid));
    const querySnapshot = await getDocs(q);
    goals.value = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
};

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
    fetchGoals();

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
    fetchGoals();
  }
};

// Computed properties para formatear los montos
const formattedAvailableAmount = computed(() => formatNumber(availableAmount.value || 0));
const formattedSavingGoalAmount = computed(() => formatNumber(savingGoalAmount.value || 0));

// Funciones para manejar la actualización de los campos con formateo
const updateAvailableAmount = (event) => {
  const value = event.target.value.replace(/[^0-9]/g, ''); // Eliminar todo excepto números
  availableAmount.value = parseInt(value, 10) || ''; // Actualizar si es un número
  event.target.value = formatNumber(availableAmount.value); // Formatear el valor mostrado
};

const updateSavingGoalAmount = (event) => {
  const value = event.target.value.replace(/[^0-9]/g, ''); // Eliminar todo excepto números
  savingGoalAmount.value = parseInt(value, 10) || ''; // Actualizar si es un número
  event.target.value = formatNumber(savingGoalAmount.value); // Formatear el valor mostrado
};

onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      fetchGoals();
    }
  });
});
</script>


