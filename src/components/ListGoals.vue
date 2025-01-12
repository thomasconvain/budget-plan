<template>
  <div v-if="isLoading">
    <LoadingSpinner />
  </div>
  <div v-else>
    <h1 class="text-2xl font-semibold	mb-4">Tus cuentas y tarjetas:</h1>
    <div v-if="goals.length > 0" class="max-w-4xl mx-auto">
      <ul role="list" class="">
        <li v-for="goal in goals" :key="goal.id" class="mb-4 flex items-center justify-between px-4 py-4 bg-white shadow-lg rounded-lg hover:bg-gray-50">
          <router-link :to="`/goal/${goal.id}`" class="flex items-center flex-1">
            <CurrencyDollarIcon class="h-6 w-6" aria-hidden="true" />
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-900">{{ goal.type }}</p>
              <p class="text-sm text-gray-500">{{ goal.title }}</p>
            </div>
            <div class="text-right ml-auto">
              <p v-if="calculateDaysRemaining(goal.validUntil?.toDate()) > 0" class="text-sm text-gray-500">Termina en {{calculateDaysRemaining(goal.validUntil.toDate()) }}  {{ calculateDaysRemaining(goal.validUntil.toDate()) <= 1 ? 'día' : 'días' }}</p>
              <p v-else class="text-sm text-gray-500">Sin fecha de término</p>
            </div>
          </router-link>
          <button @click="handleDeleteGoal(goal.id)" class="ml-4 text-slate-300 hover:text-red-600"><TrashIcon class="h-4 w-4" aria-hidden="true" /></button>
        </li>
      </ul>
    </div>
    <p v-else class="my-8 text-gray-400">Aún no tienes cuenta o tarjeta agregada</p>
    <div class="bg-indigo-600 hover:bg-indigo-800 text-white flex items-center justify-between px-4 py-4 rounded-lg">
      <router-link :to="`/create-goal/`" class="flex items-center flex-1">
        <PlusCircleIcon class="h-6 w-6" aria-hidden="true" />
        <div class="ml-4">
          <p class="text-sm font-medium">Agregar nueva tarjeta o cuenta bancaria</p>
        </div>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { CurrencyDollarIcon, TrashIcon, PlusCircleIcon } from '@heroicons/vue/24/outline';
import { getFirestore, collection, getDocs, query, where, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import {fetchGoals} from '../utils/business/goals.js'
import LoadingSpinner from '../components/LoadingSpinner.vue'


const auth = getAuth();
const db = getFirestore();

const isLoading = ref('true')
const goals = ref([]);

onMounted(() => {
  onAuthStateChanged(auth, async (user) => {
      isLoading.value = true;
    if (user) {
      goals.value = await fetchGoals();
      isLoading.value = false; // Desactivar estado de carga cuando todo esté cargado
    }
  });
});

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
    // Luego, elimina el presupuesto
    await deleteDoc(doc(db, 'goals', goalId));

    // Actualizar la lista de presupuestos después de eliminar
    goals.value = await fetchGoals();
  }
};

const calculateDaysRemaining = (targetDate) => {
  const today = new Date();
  const differenceInMillis = targetDate - today;
  return Math.ceil(differenceInMillis / (1000 * 60 * 60 * 24));
}

</script>

<style scoped>

</style>