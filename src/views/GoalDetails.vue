<template>
  <div v-if="isLoading">
    <LoadingSpinner />
  </div>
  <div v-else>

    <div class="mt-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl text-white font-semibold">
          🚀 {{ goal.type }}
          <span
            class="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-700/10">
            {{ goal.mainCurrency }}
          </span>
        </h1>
        <p class="h-[20px] text-sm ml-9 text-slate-300">{{ goal.title }}</p>
      </div>
      <div v-if="!isNativeApp" class="flex justify-end">
      <button
        class="px-4 py-2 text-xs font-medium text-gray-700 bg-gray-50 border border-transparent rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        @click="goBack">
        Volver
      </button>
    </div>
    </div>

    <!-- Stats bar -->
    <div
      class="absolute md:relative md:mt-2 md:mb-6 inset-x-0 pt-4 px-8 md:px-0 md:pt-0 pb-2 flex flex-nowrap gap-1 overflow-auto scrollbar-hide">
      <div
        v-if="goal.type === 'Tarjeta de crédito'"
        class="min-w-fit inline-flex items-center px-3 py-1 border border-gray-300 rounded-full text-sm font-medium text-gray-300">
        Cupo de pago
        <strong class="ml-1 text-white">
          {{ currencySymbol(goal.mainCurrency) }} {{ formatNumber(goal.availableAmount, goal.mainCurrency) }}
        </strong>
      </div>
      <div
        v-if="goal.validUntil"
        class="min-w-fit inline-flex items-center px-3 py-1 border border-gray-300 rounded-full text-sm font-medium text-gray-300">
        <CalendarIcon class="h-4 w-4" />
        <strong class="text-white mx-1">{{ formatDate(goal.validFrom) }}</strong>
        hasta
        <strong class="text-white ml-1">{{ formatDate(goal.validUntil) }}</strong>
      </div>
      <div class="min-w-fit inline-flex items-center px-3 py-1 border border-gray-300 rounded-full text-sm font-medium text-gray-800">
        <InformationCircleIcon class="h-4 w-4 text-gray-300" />
        <strong class="text-white ml-1">
          <template v-if="daysRemaining > 0">{{ daysRemaining }} días restantes</template>
          <template v-else-if="goal.validUntil">Meta terminada</template>
          <template v-else>Sin fecha de término</template>
        </strong>
      </div>
    </div>

    <!-- Stats cards -->
    <div class="mt-20 md:mt-0 text-gray-950">
      <div
        class="grid grid-cols-1 gap-1"
        :class="{
          'lg:grid-cols-1': enabledStats.length === 1,
          'lg:grid-cols-2': enabledStats.length === 2,
          'lg:grid-cols-3': enabledStats.length === 3
        }">
        <div
          v-for="(stat, i) in enabledStats"
          :key="stat.id"
          :ref="el => { if (i === enabledStats.length - 1) lastCardRef = el }"
          class="flex flex-col items-center text-center p-4 bg-white shadow-lg rounded-lg"
          :class="[i === 0 ? 'responsive-rounded-l' : '', i === enabledStats.length - 1 ? 'responsive-rounded-r' : '']">

          <!-- Editable balance -->
          <div v-if="stat.id === 1" class="w-full flex justify-end">
            <component
              :is="balanceReadyToEdit ? XMarkIcon : PencilIcon"
              class="h-4 w-4 cursor-pointer hover:text-gray-600 z-10"
              @click="toggleBalanceEdit"
            />
          </div>

          <div v-if="stat.id === 1 && balanceReadyToEdit" class="-mt-4 flex items-center justify-center">
            <input
              v-model="balanceToUpdate"
              type="number"
              class="text-2xl font-bold bg-transparent text-center focus:outline-none"
              @blur="saveEditedBalance"
              @keydown.enter="saveEditedBalance"
            />
          </div>

          <span v-else class="text-2xl font-bold" :class="{'-mt-4': stat.id === 1, 'text-red-800': parseFloat(stat.value) <= 0}">
            {{ currencySymbol(goal.mainCurrency) }} {{ (stat.id === 3 && parseFloat(stat.value) < 0) ? '0 /día' : stat.value }}
          </span>

          <span class="text-sm text-gray-700 mt-1">{{ stat.name }}</span>

          <button
            v-if="stat.id === 1 && balanceReadyToEdit"
            class="px-4 py-2 text-xs font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 mt-2"
            @click="saveEditedBalance">
            Guardar
          </button>
        </div>
      </div>
    </div>

    <!-- Charts toggle -->
    <div class="my-6 grid lg:justify-items-end justify-items-center">
      <button
        class="flex gap-1 px-4 py-2 text-xs font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        @click="showCharts = !showCharts">
        <ChartPieIcon class="h-4 w-4" />
        {{ showCharts ? 'Ocultar' : 'Ver' }} repartición de gastos
      </button>
    </div>

    <div v-if="showCharts" class="w-full mt-8 h-96">
      <v-chart :option="chartOptions" />
    </div>

    <!-- Payments list -->
    <UserPaymentsList
      v-if="daysRemaining > 0 || !goal.validUntil"
      class="my-6"
      :selectedGoalId="route.params.goalId"
      :goalMainCurrency="goal.mainCurrency"
      @paymentSaved="onPaymentSaved"
    />

    <div
      v-else
      class="my-6 flex flex-wrap gap-5 bg-gray-50 text-sm text-gray-400 p-5 rounded-lg">
      <p>
        El periodo de tu presupuesto ha terminado, por lo que ya no puedes ingresar nuevos
        movimientos. Puedes crear un nuevo presupuesto para seguir monitoreando tus finanzas.
      </p>
    </div>

    <!-- Historic movements -->
    <h1 class="my-6 text-2xl font-semibold mb-4">Movimientos</h1>
    <div v-if="payments.length">
      <div v-for="(dayPayments, date) in groupedPayments" :key="date">
        <p class="mt-4 text-md font-semibold">{{ formatDateToLargeString(date) }}</p>
        <ul class="divide-y divide-gray-100">
          <li v-for="payment in dayPayments" :key="payment.id" 
              :class="{'animate-slide-in': payment.id.startsWith('temp-')}"
              class="relative">
            <div class="flex justify-between gap-x-6 py-2">
              <div class="flex items-center gap-x-4">
                <component
                  :is="payment.category !== 'Abono a cuenta' ? ArrowUpIcon : ArrowDownIcon"
                  :class="payment.category !== 'Abono a cuenta' ? 'h-4 w-4 text-red-600' : 'h-4 w-4 text-green-600'"
                />
                <div class="flex-auto">
                  <p class="text-sm font-semibold leading-6 text-gray-900">
                    {{ currencySymbol(payment.currency) }}{{ payment.currency !== goal.mainCurrency ? payment.currency : ''}} {{ formatNumber(payment.amount, payment.currency) }}
                  </p>
                  <p v-if="payment.currency !== goal.mainCurrency" class="mt-1 text-xs text-gray-500">
                    {{ currencySymbol(goal.mainCurrency) }} {{ formatNumber(payment.convertedAmount, goal.mainCurrency) }}
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <div class="flex items-center gap-2 w-6 min-[480px]:w-44 overflow-visible">
                  <component
                    :is="getIconComponent(payment.categoryIcon)"
                    class="h-4 w-4 text-gray-400"
                  />
                  <span class="text-sm text-gray-400 truncate max-[480px]:hidden">{{ payment.category }}</span>
                </div>
                <button @click="deletePayment(payment)">
                  <TrashIcon class="h-4 w-4 text-slate-300 hover:text-red-600" />
                </button>
              </div>
            </div>
            <!-- Indicador de estado -->
            <div v-if="payment.id.startsWith('temp-')" 
                 class="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-8 bg-gray-500 animate-pulse rounded-full">
            </div>
          </li>
        </ul>
      </div>
    </div>
    <p v-else class="text-sm text-slate-400">Aún no tienes movimientos ingresados</p>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, provide, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Timestamp, getFirestore, doc, getDoc, updateDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import UserPaymentsList from '../components/UserPaymentsList.vue';
import LoadingSpinner from '../components/LoadingSpinner.vue';
import { formatDate, formatDateToLargeString } from '../utils/dateFormatter';
import { formatNumber } from '../utils/currencyFormatters';
import { convertToMainCurrency } from '../utils/currencyConverter';
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
} from 'echarts/components';
import { use } from 'echarts/core';
import { PieChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import VChart, { THEME_KEY } from 'vue-echarts';
import {
  PencilIcon,
  XMarkIcon,
  CalendarIcon,
  InformationCircleIcon,
  TrashIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ChartPieIcon
} from '@heroicons/vue/24/outline';
import * as OutlineIcons from '@heroicons/vue/24/outline';
import { Capacitor } from '@capacitor/core';
import { deriveKey, decrypt, encrypt } from '@/services/encryption';
import { defineEmits } from 'vue';

// ECharts necesita importar las capacidades de los gráficos y renderizado
use([
  PieChart,
  CanvasRenderer,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
]);

provide(THEME_KEY, 'light');

const db = getFirestore();
const auth = getAuth();
const user = auth.currentUser;
const key = user ? deriveKey(user.uid) : null;
const route = useRoute();
const router = useRouter();

const isNativeApp = Capacitor.isNativePlatform();
const goal = ref(null);
const payments = ref([]);
const isLoading = ref(true);
const daysRemaining = ref(0);
const showCharts = ref(false);
const balanceReadyToEdit = ref(false);
const balanceToUpdate = ref(0);
const lastCardRef = ref(null);
const emit = defineEmits(['last-card-position']);

const goBack = () => router.push({ name: 'Dashboard' });

// Icon helper
const getIconComponent = name => OutlineIcons[name] || null;

function tryDecrypt(strOrFallback, key, parser = x => x) {
  try {
    const dec = decrypt(strOrFallback, key);
    return parser(dec);
  } catch {
    return typeof strOrFallback === 'string'
      ? parser(strOrFallback)
      : strOrFallback;
  }
}

// Fetch goal and calculate remaining days
const fetchGoalDetails = async (id) => {

  if (!user) throw new Error('Usuario no autenticado');

  // 2) Obtener el documento
  const snap = await getDoc(doc(db, 'goals', id));
  if (!snap.exists()) throw new Error('Goal no encontrado');

  const data = snap.data();

  // 3) Descifrar los campos que estaban cifrados
  let title, type, decryptedAvailableAmount, availableAmount, decryptedCurrentBalanceOnAccount, currentBalanceOnAccount, mainCurrency;

    title                   = tryDecrypt(data.title, key);
    type                    = tryDecrypt(data.type, key);
    decryptedAvailableAmount = tryDecrypt(data.availableAmount, key);
    availableAmount         = parseFloat(decryptedAvailableAmount);
    decryptedCurrentBalanceOnAccount = tryDecrypt(data.currentBalanceOnAccount, key);
    currentBalanceOnAccount = parseFloat(decryptedCurrentBalanceOnAccount);
    mainCurrency            = tryDecrypt(data.mainCurrency, key);

  // 4) Asignar goal.value con los campos descifrados
  goal.value = {
    id: snap.id,
    ...data,                     // mete todos los campos crudos
    title,                       // sobrescribe con los descifrados
    type,
    availableAmount,
    currentBalanceOnAccount,
    mainCurrency
  };

  // 5) Lógica ya existente para validUntil y daysRemaining
  if (goal.value.validUntil) {
    const diff =
      new Date(goal.value.validUntil.toDate()).getTime() -
      Date.now();
    daysRemaining.value = Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  // 6) Inicializar el balance al valor descifrado
  balanceToUpdate.value = goal.value.currentBalanceOnAccount;
};

// Fetch and augment payments with convertedAmount
const fetchPaymentsForGoal = async (goalId) => {
  if (!user) return;
  // 2) Crea la consulta
  const q = query(
    collection(db, 'payments'),
    where('goalId', '==', goalId),
    where('userId', '==', user.uid)
  );

  // 3) Obtén los documentos
  const snap = await getDocs(q);
  const raw = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // 4) Descifra y convierte
  payments.value = await Promise.all(
    raw.map(async p => {
      let category, categoryIcon, decryptedAmount, amount;

      try {
        category     = decrypt(p.category, key);
        categoryIcon = decrypt(p.categoryIcon, key);
        decryptedAmount = decrypt(p.amount, key);
        amount = parseFloat(decryptedAmount);
        console.log('Descifrado:', { category, categoryIcon, amount });
      } catch (e) {
        category     = p.category;
        categoryIcon = p.categoryIcon;
        amount = p.amount;
      }

      const convertedAmount = await convertToMainCurrency(
        amount,
        p.currency || goal.value.mainCurrency,
        goal.value.mainCurrency
      );

      return {
        ...p,
        category,
        categoryIcon,
        amount,
        convertedAmount
      };
    })
  );
};

const currencySymbol = (currency) => {
  const map = {
    EUR: '€',
    USD: '$',
    CLP: '$',
    COP: '$',
  };
  return map[currency] || currency;
};

// Computed stats
const stats = computed(() => [
  { id: 1, name: goal.value.type === 'Tarjeta de crédito' ? 'Cupo utilizado' : 'Balance actual', enable: true, value: formatNumber(goal.value.currentBalanceOnAccount, goal.value.mainCurrency) },
  { id: 2, name: 'Total restante para gastar', enable: goal.value.type === 'Tarjeta de crédito', value: `${formatNumber(goal.value.availableAmount - goal.value.currentBalanceOnAccount, goal.value.mainCurrency)}` },
  { id: 3, name: 'Gasto diario promedio autorizado', enable: !!goal.value.validUntil && daysRemaining.value >=0, value: `${formatNumber((goal.value.availableAmount - goal.value.currentBalanceOnAccount) / daysRemaining.value, goal.value.mainCurrency)} /día` }
]);
const enabledStats = computed(() => stats.value.filter(s => s.enable));

// Chart data
const chartOptions = computed(() => {
  const data = Object.entries(
    payments.value.reduce((acc, p) => {
      if (p.category === 'Abono a cuenta') return acc;
      acc[p.category] = (acc[p.category] || 0) + (p.currency === goal.value.mainCurrency ? p.amount : p.convertedAmount);
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value: Math.round(value) }));

  return {
    tooltip: { trigger: 'item' },
    legend: { top: '0%', left: 'center' },
    series: [
    {
      name: 'Categoría',
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      padAngle: 1,
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

// Group by date
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

// Save balance edits
const toggleBalanceEdit = () => (balanceReadyToEdit.value = !balanceReadyToEdit.value);
const saveEditedBalance = async () => {
  const balanceToUpdateValue = parseFloat(balanceToUpdate.value);
  await updateDoc(doc(db, 'goals', goal.value.id), { currentBalanceOnAccount: encrypt(balanceToUpdateValue.toString(), key)});
  balanceReadyToEdit.value = false;
  await fetchGoalDetails(goal.value.id);
};

// Handle payment saved / deleted
const onPaymentSaved = async (amount, currency, categoryInfo) => {
  const id = route.params.goalId;
  
  // Actualizar la UI inmediatamente
  const delta = await convertToMainCurrency(amount, currency, goal.value.mainCurrency);
  const newBal = goal.value.type === 'Cuenta bancaria'
    ? goal.value.currentBalanceOnAccount - delta
    : goal.value.currentBalanceOnAccount + delta;
  
  // Actualizar el estado local inmediatamente
  goal.value.currentBalanceOnAccount = newBal;

  // Crear un nuevo pago temporal para mostrar en la UI
  const tempPayment = {
    id: 'temp-' + Date.now(),
    amount: amount,
    currency: currency,
    category: categoryInfo.name,
    categoryIcon: categoryInfo.icon,
    date: Timestamp.now(),
    convertedAmount: delta,
    isPending: true
  };

  // Agregar el pago temporal al inicio de la lista
  payments.value = [tempPayment, ...payments.value];
  
  // Realizar las operaciones de base de datos en segundo plano
  try {
    const newBalToEncrypt = newBal.toString();
    await updateDoc(doc(db, 'goals', id), { currentBalanceOnAccount: encrypt(newBalToEncrypt, key) });
    await fetchPaymentsForGoal(id);
  } catch (error) {
    console.error('Error al actualizar el balance:', error);
    // Aquí podrías implementar una lógica para revertir los cambios en la UI si es necesario
  }
};

const deletePayment = async p => {
  // Actualizar la UI inmediatamente
  const index = payments.value.findIndex(payment => payment.id === p.id);
  if (index !== -1) {
    payments.value.splice(index, 1);
  }

  // Actualizar el balance inmediatamente
  const delta = await convertToMainCurrency(-p.amount, p.currency, goal.value.mainCurrency);
  
  // La lógica depende del tipo de meta:
  let newBal;
  if (goal.value.type === 'Cuenta bancaria') {
    // Para cuenta bancaria:
    // - Si es un gasto (positivo), al eliminarlo sumamos el monto original al balance
    // - Si es un abono (negativo), al eliminarlo restamos el monto original del balance
    newBal = goal.value.currentBalanceOnAccount - delta;
  } else {
    // Para tarjeta:
    // - Si es un gasto (positivo), al eliminarlo disminuimos el cupo utilizado (sumamos el delta)
    // - Si es un abono (negativo), al eliminarlo aumentamos el cupo utilizado (sumamos el delta)
    newBal = goal.value.currentBalanceOnAccount + delta;
  }
  
  // Actualizar el estado local inmediatamente
  goal.value.currentBalanceOnAccount = newBal;

  // Realizar las operaciones de base de datos en segundo plano
  try {
    const newBalToEncrypt = newBal.toString();
    await deleteDoc(doc(db, 'payments', p.id));
    await updateDoc(doc(db, 'goals', route.params.goalId), { 
      currentBalanceOnAccount: encrypt(newBalToEncrypt, key) 
    });
    await fetchPaymentsForGoal(route.params.goalId);
  } catch (error) {
    console.error('Error al eliminar el pago:', error);
    // Revertir los cambios en la UI si hay error
    await fetchPaymentsForGoal(route.params.goalId);
    await fetchGoalDetails(route.params.goalId);
  }
};

// Init
onMounted(() => {
  onAuthStateChanged(auth, async user => {
    if (user) {
      const id = route.params.goalId;
      await fetchGoalDetails(id);
      await fetchPaymentsForGoal(id);
      isLoading.value = false;
      
      // Emitir la posición del último card después de que se monte el componente
      nextTick(() => {
        if (lastCardRef.value) {
          const rect = lastCardRef.value.getBoundingClientRect();
          emit('last-card-position', rect.top);
        }
      });
    }
  });
});
</script>

<style>
/* ... tu CSS personalizado ... */

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.animate-slide-in {
  animation: slideIn 0.3s ease-out forwards;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
