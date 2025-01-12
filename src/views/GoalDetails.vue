<template>
  <div v-if="isLoading">
    <LoadingSpinner />
  </div>
  <div v-else>
    <div v-if="!isNativeApp" class="w-full flex justify-end">
      <button
          class="px-4 py-2 text-xs font-medium text-indigo-700 bg-indigo-50 border border-transparent rounded-lg  hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          @click="() => { $router.push({ name: 'Dashboard' }); }">
            Volver
        </button>
    </div>{{ goal._id }}
    <div class="mt-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold">🚀 {{ goal.type }} <span class="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">{{ goal.mainCurrency }}</span></h1>
        <p class="h-[20px] text-sm ml-9 text-slate-400">{{ goal.title }}</p>
      </div>
    </div>
    <div class="absolute md:relative md:mt-2 md:mb-6 inset-x-0 pt-4 px-8 md:px-0 md:pt-0 pb-2 flex flex-nowrap gap-1 overflow-auto scrollbar-hide">
      <div v-if="goal.type === 'Tarjeta de crédito'" class="min-w-fit	inline-flex items-center px-3 py-1 border border-gray-300 rounded-full text-sm font-medium text-gray-800">
        Cupo de pago<strong class="ml-1 text-indigo-700"> ${{ formatNumber(goal.availableAmount, goal.mainCurrency) }}</strong>
      </div>
      <div v-if="goal.validUntil !== null" class="min-w-fit	inline-flex items-center px-3 py-1 border border-gray-300 rounded-full text-sm font-medium text-gray-800">
        <p class="flex gap-1 items-center"><CalendarIcon class="h-4 w-4" aria-hidden="true" /> <strong class="text-indigo-700">{{ formatDate(goal.validFrom) }}</strong>hasta<strong class="text-indigo-700">{{ formatDate(goal.validUntil) }}</strong></p>
      </div>
      <div class="min-w-fit	inline-flex items-center px-3 py-1 border border-gray-300 rounded-full text-sm font-medium text-gray-800">
        <p v-if="daysRemaining > 0" class="flex gap-1 items-center"><InformationCircleIcon class="h-4 w-4" aria-hidden="true" /><strong class="text-indigo-700">{{ daysRemaining }} días</strong> restantes</p>
        <p v-else-if="goal.validUntil !== null" class="flex gap-1 items-center"><InformationCircleIcon class="h-4 w-4" aria-hidden="true" /><strong class="text-indigo-700">Meta terminada</strong></p>
        <p v-else class="flex gap-1 items-center"><InformationCircleIcon class="h-4 w-4" aria-hidden="true" /><strong class="text-indigo-700">Sin fecha de término</strong></p>
      </div>
    </div>

    <div class="mt-20 md:mt-0 text-indigo-950">
      <div class="grid grid-cols-1 gap-1" :class="`lg:grid-cols-${enabledStats.length.toString()}`">
        <div v-for="(stat, i) in enabledStats" :key="stat.id" class="flex flex-col items-center text-center p-4 bg-gray-100" :class="i == (stats.length -1) ? 'responsive-rounded-r' : i == 0 ? 'responsive-rounded-l' : ''">
          <span class="text-2xl font-bold">${{ stat.value }}</span>
          <span class="text-sm text-indigo-700">{{ stat.name }}</span>
        </div>
      </div>
      <!-- <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-1">
        <div v-for="(stat, i) in statsResume" :key="stat.id" class="flex flex-col items-center text-center p-4 bg-gray-100" :class="i == (statsResume.length -1) ? 'responsive-rounded-r' : i == 0 ? 'responsive-rounded-l' : ''">
          <span class="text-2xl font-bold">${{ stat.value }}</span>
          <span class="text-sm text-indigo-700">{{ stat.name }}</span>
        </div>
      </div> -->
    </div>

    <div class="my-6 grid lg:justify-items-end justify-items-center">
        <button
          class="flex gap-1 px-4 py-2 text-xs font-medium text-indigo-700 bg-indigo-50 border border-transparent rounded-lg  hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          @click="showCharts = !showCharts">
            <ChartPieIcon class="h-4 w-4" aria-hidden="true" />
            {{ showCharts ? 'Ocultar' : 'Ver' }} repartición de gastos
        </button>
      </div>
      <div v-if="showCharts" class="w-100 mt-8 h-96"   >
        <v-chart :option="chartOptions" />
      </div>


    <UserPaymentsList
      v-if="daysRemaining > 0 || goal.validUntil === null"
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
                  <p class="text-sm font-semibold leading-6 text-gray-900">${{ payment.currency !== goal.mainCurrency ? payment.currency :  '' }} {{ formatNumber(payment.amount, payment.currency) }}</p>
                  <p v-if="payment.currency !== goal.mainCurrency" class="mt-1 truncate text-xs leading-5 text-gray-500">{{goal.mainCurrency}} {{ formatNumber(convertToMainCurrency(payment.amount, payment.currency, goal.mainCurrency), goal.mainCurrency) }}</p>
                </div>
              </div>
              <div class="shrink-0 flex flex-row sm:items-center gap-2">
                <p class="text-sm leading-6 text-gray-400 flex items-center gap-2 w-6 min-[480px]:w-44 overflow-visible">
                  <component :is="getIconComponent(payment.categoryIcon)" class="min-w-4 h-4" />
                  <span class="max-[480px]:hidden">{{ payment.category }}</span></p>
                <button @click="handleDeletePayment(payment.id, payment.amount, payment.currency)" class="ml-4 text-slate-300 hover:text-red-600"><TrashIcon class="h-4 w-4" aria-hidden="true" /></button>
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
import { getFirestore, doc, getDoc, updateDoc, collection, query, where, getDocs, deleteDoc, Timestamp } from 'firebase/firestore';
import { useRoute } from 'vue-router';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import UserPaymentsList from '../components/UserPaymentsList.vue';
import LoadingSpinner from '../components/LoadingSpinner.vue'
import {formatDate, formatDateToLargeString} from '../utils/dateFormatter.js'
import { formatNumber } from '../utils/currencyFormatters.js';
import { fetchConversionRate } from '../utils/currencyConverter.js';
import { CalendarIcon, InformationCircleIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon, ChartPieIcon } from '@heroicons/vue/24/outline';
import { use } from 'echarts/core';
import { PieChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import * as OutlineIcons from '@heroicons/vue/24/outline';
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
} from 'echarts/components';
import VChart, { THEME_KEY } from 'vue-echarts';
import { Capacitor } from '@capacitor/core';

// ECharts necesita importar las capacidades de los gráficos y renderizado
use([
  CanvasRenderer,
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
]);

provide(THEME_KEY, 'light');

const isNativeApp = Capacitor.isNativePlatform();
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
const getIconComponent = (iconName) => {
  return iconMap[iconName] || null;
};
const iconMap = {
  GlobeAmericasIcon: OutlineIcons.GlobeAmericasIcon,
  HomeIcon : OutlineIcons.HomeIcon,
  MapPinIcon : OutlineIcons.MapPinIcon,
  FilmIcon : OutlineIcons.FilmIcon,
  BuildingStorefrontIcon : OutlineIcons.BuildingStorefrontIcon,
  ShoppingCartIcon : OutlineIcons.ShoppingCartIcon,
  ShoppingBagIcon : OutlineIcons.ShoppingBagIcon,
  BanknotesIcon : OutlineIcons.BanknotesIcon,
  CurrencyDollarIcon : OutlineIcons.CurrencyDollarIcon,
  LightBulbIcon : OutlineIcons.LightBulbIcon,
  ComputerDesktopIcon : OutlineIcons.ComputerDesktopIcon,
  HeartIcon : OutlineIcons.HeartIcon

  // Agrega aquí todos los íconos que necesites
};
const stats = computed(() => [
  { id: 1, name: goal.value.type === 'Tarjeta de crédito' ? 'Cupo utilizado' : 'Balance actual', enable: true, value: formatNumber(goal.value.currentBalanceOnAccount, goal.value.mainCurrency) || 0 },
  { id: 2, name: 'Total restante para gastar', enable: goal.value.type === 'Tarjeta de crédito', value: formatNumber(availableTotalAmountForPeriod.value, goal.value.mainCurrency) || 0 },
  { id: 3, name: 'Gasto diario promedio autorizado por tu cupo disponible', enable: goal.value.validUntil ? true : false, value: `${formatNumber(averageAvailableAmountPerDay.value, goal.value.mainCurrency)} /día` || 0 }
]);

const enabledStats = computed(() => stats.value.filter(stat => stat.enable));
// const statsResume = computed(() => [
//   { id: 1, name: 'Total de gastos durante el periodo', value: formatNumber(totalPaymentsAmount.value.total - totalPaymentsAmount.value.negative) || 0 },
//   { id: 2, name: 'Lo que lograste ahorrar durante el periodo', value: formatNumber(availableTotalAmountForPeriod.value + goal.value.savingGoalAmount)|| 0 },
// ]);

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
      if (goal.value.validUntil !== null) {
        targetDate.value = goal.value.validUntil.toDate();
      }
      calculateDaysRemaining();
    } else {
      throw new Error('Goal not found');
    }
  } catch (error) {
    console.error('Error fetching goal details:', error);
  }
};

async function updateGoalCurrentBalance(goalId, newBalance) {
  try {
    // Referencia al documento en Firestore
    const goalRef = doc(db, 'goals', goalId);

    // Actualizar el campo `currentBalanceOnUpdate`
    await updateDoc(goalRef, {
      currentBalanceOnAccount: parseFloat(newBalance),
    });
  } catch (error) {
    console.error('Error al actualizar el campo currentBalanceOnUpdate:', error);
  }
}

async function onPaymentSaved(amount, currency) {
  const goalId = route.params.goalId;
  await fetchPaymentsForGoal();
  if (goal.value.type === 'Cuenta bancaria') {
    await updateGoalCurrentBalance(goalId, goal.value.currentBalanceOnAccount - convertToMainCurrency(amount, currency, goal.value.mainCurrency));
  } else {
    await updateGoalCurrentBalance(goalId, (goal.value.currentBalanceOnAccount + convertToMainCurrency(amount, currency, goal.value.mainCurrency)));
  }
  await fetchGoalDetails(goalId);
}

const handleDeletePayment = async (paymentId, paymentAmount, paymentCurrency) => {
  const user = auth.currentUser;
  const goalId = route.params.goalId;
  if (user) {
    // Luego, elimina el presupuesto
    await deleteDoc(doc(db, 'payments', paymentId));

    // Actualizar la lista de presupuestos después de eliminar
    fetchPaymentsForGoal();
    if (goal.value.type === 'Cuenta bancaria') {
      await updateGoalCurrentBalance(goalId, goal.value.currentBalanceOnAccount + convertToMainCurrency(paymentAmount, paymentCurrency, goal.value.mainCurrency));
    } else {
      await updateGoalCurrentBalance(goalId, goal.value.currentBalanceOnAccount - convertToMainCurrency(paymentAmount, paymentCurrency, goal.value.mainCurrency));
    }
    await fetchGoalDetails(goalId);
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
    if (goal.value.mainCurrency === 'CLP') {
    const amountInMainCurrency = payment.currency === 'USD' ? payment.amount * conversionRateUSDCLP.value
      : payment.currency === 'COP' ? payment.amount * conversionRateCOPCLP.value
      : payment.amount;
    
    acc[category] = (acc[category] || 0) + amountInMainCurrency;
    return acc;
    }

    if (goal.value.mainCurrency === 'COP') {
      const amountInMainCurrency = payment.currency === 'USD' ? payment.amount * conversionRateUSDCOP.value
      : payment.currency === 'CLP' ? payment.amount * conversionRateCLPCOP.value
      : payment.amount;
    
    acc[category] = (acc[category] || 0) + amountInMainCurrency;
    return acc;
    }
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
  return goal.value.availableAmount - goal.value.currentBalanceOnAccount;
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
  if (paymentCurrency == 'CLP' && mainCurrency == 'CLP') {
    return amount;
  }
  if (paymentCurrency == 'COP' && mainCurrency == 'COP') {
    return amount;
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

<style>
.responsive-rounded-r {
  border-top-right-radius: 0.75rem;
  border-bottom-right-radius: 0.75rem;
}

.responsive-rounded-l {
  border-top-left-radius: 0.75rem;
  border-bottom-left-radius: 0.75rem;
}

/* Personalización de la barra de desplazamiento */
.scrollbar-hide::-webkit-scrollbar {
  height: 3px;
  width: 50% !important;
}

.scrollbar-hide::-webkit-scrollbar-track {
  background: #f0f0f000; /* Color de fondo de la pista */
  border-radius: 4px;
}

.scrollbar-hide::-webkit-scrollbar-thumb {
  background-color: #dcdcdc; /* Color del pulgar */
  border-radius: 400px;
  border-left: 2.5rem solid #f9fafb; /* Espacio alrededor del pulgar */
  border-right: 2.5rem solid #f9fafb; /* Espacio alrededor del pulgar */
}

.scrollbar-hide::-webkit-scrollbar-thumb:hover {
  background-color: #b8b8b8; /* Color al pasar el mouse */
}

@media (max-width: 1023px ) {
  .responsive-rounded-r {
    border-top-right-radius: 0rem;
    border-bottom-right-radius: 0.75rem;
    border-bottom-left-radius: 0.75rem;
  }
  .responsive-rounded-l {
    border-top-right-radius: 0.75rem;
    border-top-left-radius: 0.75rem;
    border-bottom-left-radius: 0rem;
  }
}
</style>

