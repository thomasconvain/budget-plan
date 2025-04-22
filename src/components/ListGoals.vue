<template>
  <div v-if="isLoading">
    <LoadingSpinner />
  </div>
  <div v-else>
    <div
        class="grid grid-cols-1 gap-1 mb-16">
        <div class="flex flex-col items-center text-center p-4 bg-gray-100 rounded-lg">
          <span class="text-2xl font-bold">${{ formatNumber(goalsTotalBalance, 'CLP') }}</span>
          <span class="text-sm text-indigo-700">Balance general</span>
        </div>
      </div>
    <h1 class="text-2xl font-semibold	mb-4">Tus tarjetas</h1>
    <div v-if="creditCardGoals.length > 0" class="max-w-4xl mx-auto">
      <ul role="list" class="">
        <li v-for="goal in creditCardGoals" :key="goal.id" class="mb-4">
          <div class="flex items-center justify-between z-2 relative px-4 py-4 bg-white shadow-lg rounded-lg hover:bg-gray-50">
            <router-link :to="`/goal/${goal.id}`" class="flex items-center flex-1">
              <CreditCardIcon class="h-6 w-6" aria-hidden="true" />
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-900">{{ goal.title }}</p>
                <p 
                  v-if="calculateDaysRemaining(goal.validUntil?.toDate()) > 0"
                  class="text-sm text-gray-500">
                  Se factura en {{calculateDaysRemaining(goal.validUntil.toDate()) }}  {{ calculateDaysRemaining(goal.validUntil.toDate()) <= 1 ? 'día' : 'días' }}
                </p>
                <p 
                  v-else-if="goal.type !== 'Tarjeta de crédito' || goal.validUntil === null"
                  class="text-sm text-gray-500">
                  Sin fecha de facturación
                </p>
                <span 
                  v-else
                  class="text-sm text-gray-500 flex items-center gap-x-2">
                  <p>
                    Se ha facturado esta tarjeta
                  </p>
                  <button
                    class="px-4 py-2 text-xs font-medium text-indigo-700 bg-indigo-50 border border-transparent rounded-lg hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    @click.stop.prevent="archiveGoal(goal.id)">
                      Archivar
                  </button>
                </span>
              </div>
              <div class="text-right ml-auto">
                <p class="text-md text-gray-800 font-semibold flex items-center gap-x-2">
                  <ArrowUpIcon class="h-4 w-4 text-red-600" />
                  ${{ formatNumber(goal.currentBalanceOnAccount, 'CLP') }}
                </p>
              </div>
            </router-link>
            <button @click="handleDeleteGoal(goal.id)" class="ml-4 text-slate-300 hover:text-red-600"><TrashIcon class="h-4 w-4" aria-hidden="true" /></button>
          </div>
          <div class="w-full -mt-2 z-1 bg-gray-200 rounded-md h-4">
            <div
              class="bg-indigo-600 h-4 rounded-md max-w-full"
              :style="{ width: (goal.currentBalanceOnAccount / goal.availableAmount * 100) + '%' }"
            ></div>
          </div>
        </li>
      </ul>
    </div>
    <p v-else class="my-8 text-gray-400">Aún no tienes tarjeta agregada</p>
    <div v-if="archivedCreditCardGoals.length > 0" class="max-w-4xl mx-auto">
      <p class="my-2 text-gray-400">Tu tarjetas archivadas:</p>
      <ul role="list" class="">
        <li v-for="goal in archivedCreditCardGoals" :key="goal.id" class="mb-4">
          <div class="flex items-center justify-between z-2 relative px-4 py-4 bg-white shadow-lg rounded-lg hover:bg-gray-50">
            <router-link :to="`/goal/${goal.id}`" class="flex items-center flex-1">
              <CreditCardIcon class="h-6 w-6" aria-hidden="true" />
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-900">{{ goal.title }}</p>
              </div>
              <div class="text-right ml-auto">
                <p class="text-md text-gray-800 font-semibold flex items-center gap-x-2">
                  <ArrowUpIcon class="h-4 w-4 text-red-600" />
                  ${{ formatNumber(goal.currentBalanceOnAccount, 'CLP') }}
                </p>
              </div>
            </router-link>
            <button @click="handleDeleteGoal(goal.id)" class="ml-4 text-slate-300 hover:text-red-600"><TrashIcon class="h-4 w-4" aria-hidden="true" /></button>
          </div>
        </li>
      </ul>
    </div>
    <h1 class="text-2xl font-semibold	mb-4 mt-16">Tus cuentas bancarias</h1>
    <div v-if="bankAccountGoals.length > 0" class="max-w-4xl mx-auto">
      <ul role="list" class="">
        <li v-for="goal in bankAccountGoals" :key="goal.id" class="mb-4 flex items-center justify-between px-4 py-4 bg-white shadow-lg rounded-lg hover:bg-gray-50">
          <router-link :to="`/goal/${goal.id}`" class="flex items-center flex-1">
            <CurrencyDollarIcon class="h-6 w-6" aria-hidden="true" />
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-900">{{ goal.title }}</p>
            </div>
            <div class="text-right ml-auto">
              <p class="text-md text-gray-800 font-semibold flex items-center gap-x-2">
                <ArrowDownIcon class="h-4 w-4 text-green-600" />
                ${{ formatNumber(goal.currentBalanceOnAccount, 'CLP') }}
              </p>
            </div>
          </router-link>
          <button @click="handleDeleteGoal(goal.id)" class="ml-4 text-slate-300 hover:text-red-600"><TrashIcon class="h-4 w-4" aria-hidden="true" /></button>
        </li>
      </ul>
    </div>
    <p v-else class="my-8 text-gray-400">Aún no tienes cuenta agregada</p>
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
import { ref, onMounted, computed } from 'vue';
import { ArrowUpIcon,ArrowDownIcon, CurrencyDollarIcon, CreditCardIcon, TrashIcon, PlusCircleIcon } from '@heroicons/vue/24/outline';
import { getFirestore, collection, getDocs, updateDoc, query, where, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import {fetchGoals} from '../utils/business/goals.js'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import { formatNumber } from '../utils/currencyFormatters.js';


const auth = getAuth();
const db = getFirestore();

const isLoading = ref('true')
const goals = ref([]);
const goalsTotalBalance = ref(0);

const creditCardGoals = computed(() => goals.value.filter(goal => goal.type === 'Tarjeta de crédito' && goal.isArchived !== true));
const archivedCreditCardGoals = computed(() => goals.value.filter(goal => goal.type === 'Tarjeta de crédito' && goal.isArchived === true));
const bankAccountGoals = computed(() => goals.value.filter(goal => goal.type === 'Cuenta bancaria'));

onMounted(() => {
  onAuthStateChanged(auth, async (user) => {
      isLoading.value = true;
    if (user) {
      goals.value = await fetchGoals();
      // Sumar los valores para 'Tarjeta de crédito'
      const creditCardTotal = goals.value
        .filter(goal => goal.type === 'Tarjeta de crédito' && goal.isArchived !== true)
        .reduce((sum, goal) => sum + goal.currentBalanceOnAccount, 0);

      // Sumar los valores para 'Cuenta bancaria'
      const bankAccountTotal = goals.value
        .filter(goal => goal.type === 'Cuenta bancaria')
        .reduce((sum, goal) => sum + goal.currentBalanceOnAccount, 0);

      // Calcular la diferencia
      goalsTotalBalance.value = bankAccountTotal - creditCardTotal;
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

const archiveGoal = async (goalId) => {
  try {
    const goalRef = doc(db, 'goals', goalId)
    await updateDoc(goalRef, { isArchived: true })
    console.log(`Goal ${goalId} archivado correctamente`)
    // aquí podrías emitir un evento o actualizar un state local
    // Actualizar la lista de presupuestos después de eliminar
    goals.value = await fetchGoals();
  } catch (error) {
    console.error('Error archivando goal:', error)
  }
}

const calculateDaysRemaining = (targetDate) => {
  const today = new Date();
  const differenceInMillis = targetDate - today;
  return Math.ceil(differenceInMillis / (1000 * 60 * 60 * 24));
}

</script>

<style scoped>

</style>