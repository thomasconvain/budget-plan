<template>
  <div v-if="isLoading">
    <LoadingSpinner />
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
      <p v-if="daysRemaining > 0" class="flex gap-1 items-center"><InformationCircleIcon class="h-4 w-4" aria-hidden="true" /><strong>{{ daysRemaining }} días</strong> restantes</p>
      <p v-else class="flex gap-1 items-center"><InformationCircleIcon class="h-4 w-4" aria-hidden="true" /><strong>Meta terminada</strong></p>
    </div>
    
    <div class="mt-6 bg-white shadow-lg rounded-2xl pt-6 sm:pt-12 flex flex-col justify-center">
      <div class="mx-auto max-w-7xl px-6 lg:px-8">
        <dl v-if="daysRemaining > 0" class="grid grid-cols-1 gap-x-8 gap-y-8 text-center lg:grid-cols-3">
          <div v-for="stat in stats" :key="stat.id" class="mx-auto flex max-w-xs flex-col gap-y-1">
            <dt class="text-base text-sm leading-5 text-gray-500">{{ stat.name }}</dt>
            <dd class="order-first text-xl font-semibold tracking-tight text-gray-900 sm:text-3xl">${{ stat.value }}</dd>
          </div>
        </dl>
        <dl v-else class="grid grid-cols-1 gap-x-8 gap-y-8 text-center lg:grid-cols-2">
          <div v-for="stat in statsResume" :key="stat.id" class="mx-auto flex max-w-xs flex-col gap-y-1">
            <dt class="text-base text-sm leading-5 text-gray-500">{{ stat.name }}</dt>
            <dd class="order-first text-xl font-semibold tracking-tight text-gray-900 sm:text-3xl">${{ stat.value }}</dd>
          </div>
        </dl>
      </div>
      <div class="my-6 grid lg:justify-items-end justify-items-center px-6 lg:px-8">
        <button
          class="px-4 py-2 text-xs font-medium text-indigo-700 bg-indigo-50 border border-transparent rounded-lg  hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          @click="showCharts = !showCharts">
            {{ showCharts ? 'Ocultar' : 'Ver' }} repartición de gastos
        </button>
      </div>
      <div v-if="showCharts" class="w-100 mt-8 h-96"   >
        <v-chart :option="chartOptions" />
      </div>
    </div>

    <UserPaymentsList
      v-if="daysRemaining > 0"
      class="my-6"
      :selectedGoalId="route.params.goalId"
      :goalMainCurrency="goal.mainCurrency" 
      @paymentSaved="onPaymentSaved" />

    <div v-else class="my-6 flex flex-wrap gap-5 bg-indigo-50 text-sm text-indigo-400 p-5 rounded-lg">
      <p>El periodo de tu presupuesto ha terminado, por lo que ya no puedes ingresar nuevos movimientos. Puedes crear un nuevo presupuesto para seguir monitoreando tus finanzas.</p>
    </div>


    <h1 class="my-6 text-2xl font-semibold	mb-4">Movimientos</h1>
    <div v-if="payments.length > 0">
      <div v-for="(payments, date) in groupedPayments" :key="date">
        <p class="mt-4 text-md font-semibold">{{ formatDateToLargeString(date) }}</p>
        <ul role="list" class="divide-y divide-gray-100">
          <li v-for="payment in payments" :key="payment.id">
            <div class="flex justify-between gap-x-6 py-2">
              <div class="flex items-center	min-w-4 gap-x-4">
                <ArrowUpIcon v-if="payment.category !== 'Abono a cuenta'" class="h-4 w-4 text-red-600" />
                <ArrowDownIcon v-if="payment.category === 'Abono a cuenta'" class="h-4 w-4 text-green-600" />
                <div class="min-w-14 flex-auto">
                  <p class="text-sm font-semibold leading-6 text-gray-900">${{ payment.currency !== goal.mainCurrency ? payment.currency :  '' }} {{ formatNumber(payment.amount) }}</p>
                  <p v-if="payment.currency !== goal.mainCurrency" class="mt-1 truncate text-xs leading-5 text-gray-500">{{goal.mainCurrency}} {{ formatNumber(convertToMainCurrency(payment.amount, payment.currency, goal.mainCurrency)) }}</p>
                </div>
              </div>
              <div class="shrink-0 flex flex-col sm:flex-row sm:items-center items-end gap-2">
                <p class="text-sm leading-6 text-gray-400">{{ payment.category }}</p>
                <button @click="handleDeletePayment(payment.id)" class="ml-4 text-slate-300 hover:text-red-600"><TrashIcon class="h-4 w-4" aria-hidden="true" /></button>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
    <p v-else class="text-sm text-slate-400">Aún no tienes movimientos ingresados</p>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, provide } from 'vue';
import { getFirestore, doc, getDoc, collection, query, where, getDocs, deleteDoc, Timestamp } from 'firebase/firestore';
import { useRoute } from 'vue-router';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import UserPaymentsList from '../components/UserPaymentsList.vue';
import LoadingSpinner from '../components/LoadingSpinner.vue'
import {formatDate, formatDateToLargeString} from '../utils/dateFormatter.js'
import { formatNumber } from '../utils/currencyFormatters.js';
import { fetchConversionRate } from '../utils/currencyConverter.js';
import { CalendarIcon, InformationCircleIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/vue/24/outline';
import { use } from 'echarts/core';
import { PieChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
} from 'echarts/components';
import VChart, { THEME_KEY } from 'vue-echarts';

// ECharts necesita importar las capacidades de los gráficos y renderizado
use([
  CanvasRenderer,
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
]);

provide(THEME_KEY, 'light');

const goal = ref(null);
const payments = ref([]);
const isLoading = ref(true);
const daysRemaining = ref(null);
const targetDate = ref(null);
const conversionRateUSDCLP = ref(0);
const conversionRateUSDCOP = ref(0);
const conversionRateCOPCLP = ref(0);
const conversionRateCLPCOP = ref(0);
const showCharts = ref(false);
const route = useRoute();
const db = getFirestore();
const auth = getAuth();
const stats = computed(() => [
  { id: 1, name: 'Total de gastos durante el periodo', value: formatNumber(totalPaymentsAmount.value.total - totalPaymentsAmount.value.negative) || 0 },
  { id: 2, name: 'Total restante para gastar', value: formatNumber(availableTotalAmountForPeriod.value) || 0 },
  { id: 3, name: 'Gasto diario promedio para cumplir con tu meta de ahorro', value: `${formatNumber(averageAvailableAmountPerDay.value)} /día` || 0 }
]);
const statsResume = computed(() => [
  { id: 1, name: 'Total de gastos durante el periodo', value: formatNumber(totalPaymentsAmount.value.total - totalPaymentsAmount.value.negative) || 0 },
  { id: 2, name: 'Lo que lograste ahorrar durante el periodo', value: formatNumber(availableTotalAmountForPeriod.value + goal.value.savingGoalAmount)|| 0 },
]);

const chartOptions = computed(() => {
  const categories = Object.keys(totalPaymentsAmount.value.byCategory);
  const data = categories.map(category => ({
    value: Math.round(totalPaymentsAmount.value.byCategory[category]),
    name: category
  }));

  return {
    tooltip: {
    trigger: data.name,
  },
  legend: {
    top: '0%',
    left: 'center'
  },
  series: [
    {
      name: 'Categoría',
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      padAngle: 5,
      itemStyle: {
        borderRadius: 10
      },
      label: {
        show: false,
        position: 'inner'
      },
      labelLine: {
        show: false
      },
      data: data, // Se asignan los datos dinámicamente
      color: ['#4f46e5', '#6c63f0', '#8981fa', '#a7a0ff', '#c4bfff', '#3d3ab3', '#312e8b', '#262366', '#1c1940', '#110e33'], // Tailwind colors
    },
  ],
  };
});

const calculateDaysRemaining = () => {
  const today = new Date();
  const differenceInMillis = targetDate.value - today;
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
    // Luego, elimina el presupuesto
    await deleteDoc(doc(db, 'payments', paymentId));

    // Actualizar la lista de presupuestos después de eliminar
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


// Computed property para agrupar los pagos por fecha única y ordenar por fecha más reciente
const groupedPayments = computed(() => {
  const grouped = payments.value.reduce((acc, payment) => {
    const date = payment.date instanceof Timestamp ? payment.date.toDate() : new Date(payment.date);

    // Normalizar la fecha a medianoche para ignorar horas, minutos y segundos
    const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() +1);

    // Convertir la fecha a una cadena en formato 'YYYY-MM-DD'
    const dateString = normalizedDate.toISOString().split('T')[0];

    if (!acc[dateString]) {
      acc[dateString] = [];
    }

    acc[dateString].push(payment);

    return acc;
  }, {});

  // Ordenar las fechas (claves) en orden descendente para que la fecha más reciente esté arriba
  return Object.keys(grouped)
    .sort((a, b) => new Date(b) - new Date(a))
    .reduce((acc, key) => {
      acc[key] = grouped[key];
      return acc;
    }, {});
});

const totalPaymentsAmount = computed(() => {
  const totalUSD = payments.value
    .filter(payment => payment.currency === 'USD')
    .reduce((sum, payment) => sum + payment.amount, 0);

  const totalCOP = payments.value
    .filter(payment => payment.currency === 'COP')
    .reduce((sum, payment) => sum + payment.amount, 0);

  const totalCLP = payments.value
    .filter(payment => payment.currency === 'CLP')
    .reduce((sum, payment) => sum + payment.amount, 0);

  // Filtrando payments con valores negativos para mainCurrency
  const negativePaymentsMainCurrency = payments.value
    .filter(payment => (payment.currency === goal.value.mainCurrency || payment.currency === undefined) && payment.amount < 0)
    .reduce((sum, payment) => sum + payment.amount, 0);

  // Calculando el totalMainCurrency normal sin filtrar por negativos
  const totalMainCurrency = payments.value
    .filter(payment => payment.currency === goal.value.mainCurrency || payment.currency === undefined)
    .reduce((sum, payment) => sum + payment.amount, 0);

  // Calculando los montos por categoría
  const amountsByCategory = payments.value
  .filter(payment => payment.category !== 'Abono a cuenta') // Excluyendo 'Abono a cuenta'
  .reduce((acc, payment) => {
    const category = payment.category || 'Unknown'; // Usa una categoría 'Unknown' si no tiene
    const amountInMainCurrency = payment.currency === 'USD' ? payment.amount * conversionRateUSDCLP.value
      : payment.currency === 'COP' ? payment.amount * conversionRateCOPCLP.value
      : payment.amount;
    
    acc[category] = (acc[category] || 0) + amountInMainCurrency;
    return acc;
  }, {});

  if (goal.value.mainCurrency === 'CLP') {
    return {
      total: (totalUSD * conversionRateUSDCLP.value) + (totalCOP * conversionRateCOPCLP.value) + totalMainCurrency,
      negative: negativePaymentsMainCurrency,
      byCategory: amountsByCategory
    };
  }

  if (goal.value.mainCurrency === 'COP') {
    return {
      total: (totalUSD * conversionRateUSDCOP.value) + (totalCLP * conversionRateCLPCOP.value) + totalMainCurrency,
      negative: negativePaymentsMainCurrency,
      byCategory: amountsByCategory
    };
  }

  return {
    total: totalMainCurrency,
    negative: negativePaymentsMainCurrency,
    byCategory: amountsByCategory
  };
});



const availableTotalAmountForPeriod = computed(() => {
  return goal.value.availableAmount - totalPaymentsAmount.value.total - goal.value.savingGoalAmount;
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

