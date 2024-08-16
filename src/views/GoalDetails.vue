<template>
  <div v-if="isLoading">
    <p>Cargando información del goal...</p>
  </div>
  <div v-else>
    <div class="mt-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold">🚀 {{ goal.title }} <span class="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">{{ goal.mainCurrency }}</span></h1>
        <p class="text-sm ml-9 text-slate-400">{{ goal.description }}</p>
      </div>
      <button
        class="px-4 py-2 text-xs font-medium text-indigo-700 bg-indigo-50 border border-transparent rounded-lg  hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        @click="() => { $router.push({ name: 'Dashboard' }); }">
          Volver
      </button>
    </div>
    <div class="my-6 flex flex-wrap gap-5 bg-indigo-200 text-sm text-indigo-700 p-5 rounded-lg">
      <p>Ingresos: <strong>${{ formatNumber(goal.availableAmount) }}</strong></p>
      <p>Meta de ahorro: <strong>${{ formatNumber(goal.savingGoalAmount) }}</strong></p>
      <p class="flex gap-1 items-center"><CalendarIcon class="h-4 w-4" aria-hidden="true" /> <strong>{{ formatDate(goal.validFrom) }}</strong>hasta<strong>{{ formatDate(goal.validUntil) }}</strong></p>
      <p class="flex gap-1 items-center"><InformationCircleIcon class="h-4 w-4" aria-hidden="true" /><strong>{{ daysRemaining }} días</strong> restantes</p>
    </div>
    
    <div class="mt-6 bg-white shadow-lg rounded-2xl py-6 sm:py-12">
      <div class="mx-auto max-w-7xl px-6 lg:px-8">
        <dl class="grid grid-cols-1 gap-x-8 gap-y-8 text-center lg:grid-cols-3">
          <div v-for="stat in stats" :key="stat.id" class="mx-auto flex max-w-xs flex-col gap-y-1">
            <dt class="text-base text-sm leading-7 text-gray-500">{{ stat.name }}</dt>
            <dd class="order-first text-xl font-semibold tracking-tight text-gray-900 sm:text-3xl">${{ stat.value }}</dd>
          </div>
        </dl>
      </div>
    </div>

    <UserPaymentsList
      class="my-6"
      :selectedGoalId="route.params.goalId"
      :goalMainCurrency="goal.mainCurrency" 
      @paymentSaved="onPaymentSaved" />


    <h1 class="my-6 text-2xl font-semibold	mb-4">Pagos</h1>
    <table v-if="payments.length > 0" class="mb-24 min-w-full bg-white shadow-lg rounded-2xl">
      <thead>
        <tr>
          <th class="px-6 py-3 border-b border-gray-300 text-left leading-4 text-slate-500 tracking-wider">Monto</th>
          <th class="px-6 py-3 border-b border-gray-300 text-left leading-4 text-slate-500 tracking-wider">Categoría</th>
          <th class="px-6 py-3 border-b border-gray-300 text-left leading-4 text-slate-500 tracking-wider">Fecha</th>
          <th class="px-6 py-3 border-b border-gray-300 text-left leading-4 text-slate-500 tracking-wider"></th>
        </tr>
      </thead>
      <tbody class="bg-transparent">
        <tr v-for="payment in payments" :key="payment.id">
          <td class="px-6 py-4 whitespace-no-wrap border-b border-gray-100">${{ payment.currency !== goal.mainCurrency ? payment.currency :  '' }} {{ formatNumber(payment.amount) }} <span v-if="payment.currency !== goal.mainCurrency" class="text-sm text-slate-400">({{goal.mainCurrency}} {{ formatNumber(convertToMainCurrency(payment.amount, payment.currency, goal.mainCurrency)) }})</span></td>
          <td class="px-6 py-4 whitespace-no-wrap border-b border-gray-100">{{ payment.category }}</td>
          <td class="px-6 py-4 whitespace-no-wrap border-b border-gray-100 text-slate-300">{{ formatDate(payment.date) }}</td>
          <td class="px-6 py-4 whitespace-no-wrap border-b border-gray-100 text-slate-300"><button @click="handleDeletePayment(payment.id)" class="ml-4 text-slate-300 hover:text-red-600"><TrashIcon class="h-4 w-4" aria-hidden="true" /></button></td>
        </tr>
      </tbody>
    </table>
    <p v-else class="text-sm text-slate-400">Aún no tienes movimientos ingresados</p>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { getFirestore, doc, getDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { useRoute } from 'vue-router';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import UserPaymentsList from '../components/UserPaymentsList.vue';
import {formatDate} from '../utils/dateFormatter.js'
import { formatNumber } from '../utils/currencyFormatters.js';
import { fetchConversionRate } from '../utils/currencyConverter.js';
import { CalendarIcon, InformationCircleIcon, TrashIcon } from '@heroicons/vue/24/outline';


const goal = ref(null);
const payments = ref([]);
const isLoading = ref(true);
const daysRemaining = ref(null);
const targetDate = ref(null);
const conversionRateUSDCLP = ref(0);
const conversionRateUSDCOP = ref(0);
const conversionRateCOPCLP = ref(0);
const conversionRateCLPCOP = ref(0);
const route = useRoute();
const db = getFirestore();
const auth = getAuth();
const stats = computed(() => [
  { id: 1, name: 'Total de gastos durante el periodo', value: formatNumber(totalPaymentsAmount.value) || 0 },
  { id: 2, name: 'Total restante para gastar', value: formatNumber(availableTotalAmountForPeriod.value) || 0 },
  { id: 3, name: 'Gasto diario promedio', value: formatNumber(averageAvailableAmountPerDay.value) || 0 }
]);

const calculateDaysRemaining = () => {
  const today = new Date();
  const differenceInMillis = targetDate.value - today;
  console.log(targetDate.value)
  daysRemaining.value = Math.ceil(differenceInMillis / (1000 * 60 * 60 * 24));
}

const fetchGoalDetails = async (goalId) => {
  try {
    const goalDocRef = doc(db, 'goals', goalId);
    const goalDoc = await getDoc(goalDocRef);
    if (goalDoc.exists()) {
      goal.value = { id: goalDoc.id, ...goalDoc.data() };
      targetDate.value = goal.value.validUntil.toDate();
      calculateDaysRemaining();
    } else {
      throw new Error('Goal not found');
    }
  } catch (error) {
    console.error('Error fetching goal details:', error);
  }
};

const onPaymentSaved = () => {
  fetchPaymentsForGoal();
};

const handleDeletePayment = async (paymentId) => {
  const user = auth.currentUser;
  if (user) {
    // Luego, elimina la meta
    await deleteDoc(doc(db, 'payments', paymentId));

    // Actualizar la lista de metas después de eliminar
    fetchPaymentsForGoal();
  }
};

const fetchPaymentsForGoal = async () => {
  const user = auth.currentUser;
  try {
    const q = query(collection(db, 'payments'), where('goalId', '==', route.params.goalId), where('userId', '==', user.uid));
    const querySnapshot = await getDocs(q);
    payments.value = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching payments for goal:', error);
  }
};

const totalPaymentsAmount = computed(() => {
  const totalUSD = payments.value
    .filter(payment => payment.currency === 'USD')
    .reduce((sum, payment) => sum + (payment.amount), 0);

    const totalCOP = payments.value
    .filter(payment => payment.currency === 'COP')
    .reduce((sum, payment) => sum + (payment.amount), 0);

    const totalCLP = payments.value
    .filter(payment => payment.currency === 'CLP')
    .reduce((sum, payment) => sum + (payment.amount), 0);

  const totalMainCurrency = payments.value
    .filter(payment => payment.currency === goal.value.mainCurrency || payment.currency === undefined)
    .reduce((sum, payment) => sum + payment.amount, 0);
  if (goal.value.mainCurrency === 'CLP') {
    return (totalUSD * conversionRateUSDCLP.value) + (totalCOP * conversionRateCOPCLP.value) + totalMainCurrency;
  }
  if (goal.value.mainCurrency === 'COP') {
    return (totalUSD * conversionRateUSDCOP.value) + (totalCLP * conversionRateCLPCOP.value) + totalMainCurrency;
  }
  return totalMainCurrency
});

const availableTotalAmountForPeriod = computed(() => {
  return goal.value.availableAmount - totalPaymentsAmount.value - goal.value.savingGoalAmount;
});

const averageAvailableAmountPerDay = computed(() => {
  return availableTotalAmountForPeriod.value / daysRemaining.value
});

function convertToMainCurrency(amount, paymentCurrency, mainCurrency) {
  if (paymentCurrency == 'USD' && mainCurrency == 'CLP') {
    return amount * conversionRateUSDCLP.value;
  }
  if (paymentCurrency == 'USD' && mainCurrency == 'COP') {
    return amount * conversionRateUSDCOP.value;
  }
  if (paymentCurrency == 'COP' && mainCurrency == 'CLP') {
    return amount * conversionRateCOPCLP.value;
  }
  if (paymentCurrency == 'CLP' && mainCurrency == 'COP') {
    return amount * conversionRateCLPCOP.value;
  }
}

onMounted(async () => {
  const goalId = route.params.goalId;
  conversionRateUSDCLP.value = await fetchConversionRate('USD', 'CLP');
  conversionRateUSDCOP.value = await fetchConversionRate('USD', 'COP');
  conversionRateCOPCLP.value = await fetchConversionRate('COP', 'CLP');
  conversionRateCLPCOP.value = await fetchConversionRate('CLP', 'COP');
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        await fetchGoalDetails(goalId);
        await fetchPaymentsForGoal(goalId);
      } catch (error) {
        console.error('Error during onMounted:', error);
      } finally {
        isLoading.value = false; // Desactivar estado de carga cuando todo esté cargado
      }
    } else {
      console.error('User is not authenticated');
    }
  });
});
</script>

