<template>
  <div v-if="isLoading">
    <LoadingSpinner />
  </div>
  <div v-else>
    <div v-if="!isNativeApp" class="w-full flex justify-end">
      <button
        class="px-4 py-2 text-xs font-medium text-indigo-700 bg-indigo-50 border border-transparent rounded-lg hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        @click="goBack">
        Volver
      </button>
    </div>

    <div class="mt-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold">
          🚀 {{ goal.type }}
          <span
            class="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
            {{ goal.mainCurrency }}
          </span>
        </h1>
        <p class="h-[20px] text-sm ml-9 text-slate-400">{{ goal.title }}</p>
      </div>
    </div>

    <!-- Stats bar -->
    <div
      class="absolute md:relative md:mt-2 md:mb-6 inset-x-0 pt-4 px-8 md:px-0 md:pt-0 pb-2 flex flex-nowrap gap-1 overflow-auto scrollbar-hide">
      <div
        v-if="goal.type === 'Tarjeta de crédito'"
        class="min-w-fit inline-flex items-center px-3 py-1 border border-gray-300 rounded-full text-sm font-medium text-gray-800">
        Cupo de pago
        <strong class="ml-1 text-indigo-700">
          {{ currencySymbol(goal.mainCurrency) }} {{ formatNumber(goal.availableAmount, goal.mainCurrency) }}
        </strong>
      </div>
      <div
        v-if="goal.validUntil"
        class="min-w-fit inline-flex items-center px-3 py-1 border border-gray-300 rounded-full text-sm font-medium text-gray-800">
        <CalendarIcon class="h-4 w-4" />
        <strong class="text-indigo-700 ml-1">{{ formatDate(goal.validFrom) }}</strong>
        hasta
        <strong class="text-indigo-700 ml-1">{{ formatDate(goal.validUntil) }}</strong>
      </div>
      <div class="min-w-fit inline-flex items-center px-3 py-1 border border-gray-300 rounded-full text-sm font-medium text-gray-800">
        <InformationCircleIcon class="h-4 w-4" />
        <strong class="text-indigo-700 ml-1">
          <template v-if="daysRemaining > 0">{{ daysRemaining }} días restantes</template>
          <template v-else-if="goal.validUntil">Meta terminada</template>
          <template v-else>Sin fecha de término</template>
        </strong>
      </div>
    </div>

    <!-- Stats cards -->
    <div class="mt-20 md:mt-0 text-indigo-950">
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
          class="flex flex-col items-center text-center p-4 bg-gray-100"
          :class="[i === 0 ? 'responsive-rounded-l' : '', i === enabledStats.length - 1 ? 'responsive-rounded-r' : '']">

          <!-- Editable balance -->
          <div v-if="stat.id === 1" class="w-full flex justify-end">
            <component
              :is="balanceReadyToEdit ? XMarkIcon : PencilIcon"
              class="h-4 w-4 cursor-pointer hover:text-indigo-600"
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

          <span v-else class="text-2xl font-bold" :class="{'-mt-4': stat.id === 1}">
            {{ currencySymbol(goal.mainCurrency) }} {{ stat.value }}
          </span>

          <span class="text-sm text-indigo-700 mt-1">{{ stat.name }}</span>

          <button
            v-if="stat.id === 1 && balanceReadyToEdit"
            class="px-4 py-2 text-xs font-medium text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mt-2"
            @click="saveEditedBalance">
            Guardar
          </button>
        </div>
      </div>
    </div>

    <!-- Charts toggle -->
    <div class="my-6 grid lg:justify-items-end justify-items-center">
      <button
        class="flex gap-1 px-4 py-2 text-xs font-medium text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
      class="my-6 flex flex-wrap gap-5 bg-indigo-50 text-sm text-indigo-400 p-5 rounded-lg">
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
          <li v-for="payment in dayPayments" :key="payment.id">
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
          </li>
        </ul>
      </div>
    </div>
    <p v-else class="text-sm text-slate-400">Aún no tienes movimientos ingresados</p>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getFirestore, doc, getDoc, updateDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import UserPaymentsList from '../components/UserPaymentsList.vue';
import LoadingSpinner from '../components/LoadingSpinner.vue';
import { formatDate, formatDateToLargeString } from '../utils/dateFormatter';
import { formatNumber } from '../utils/currencyFormatters';
import { convertToMainCurrency } from '../utils/currencyConverter';
import VChart from 'vue-echarts';
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

const db = getFirestore();
const auth = getAuth();
const route = useRoute();
const router = useRouter();

const isNativeApp = false; // Ajusta según tu lógica de Capacitor
const goal = ref(null);
const payments = ref([]);
const isLoading = ref(true);
const daysRemaining = ref(0);
const showCharts = ref(false);
const balanceReadyToEdit = ref(false);
const balanceToUpdate = ref(0);

const goBack = () => router.push({ name: 'Dashboard' });

// Icon helper
const getIconComponent = name => OutlineIcons[name] || null;

// Fetch goal and calculate remaining days
const fetchGoalDetails = async id => {
  const snap = await getDoc(doc(db, 'goals', id));
  if (!snap.exists()) throw new Error('Goal no encontrado');
  goal.value = { id: snap.id, ...snap.data() };
  if (goal.value.validUntil) {
    const diff = new Date(goal.value.validUntil.toDate()) - new Date();
    daysRemaining.value = Math.ceil(diff / (1000 * 60 * 60 * 24));
  }
  balanceToUpdate.value = goal.value.currentBalanceOnAccount;
};

// Fetch and augment payments with convertedAmount
const fetchPaymentsForGoal = async id => {
  const user = auth.currentUser;
  const q = query(
    collection(db, 'payments'),
    where('goalId', '==', id),
    where('userId', '==', user.uid)
  );
  const snap = await getDocs(q);
  const raw = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  payments.value = await Promise.all(
    raw.map(async p => ({
      ...p,
      convertedAmount: await convertToMainCurrency(p.amount, p.currency || goal.value.mainCurrency, goal.value.mainCurrency)
    }))
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
  { id: 3, name: 'Gasto diario promedio autorizado', enable: !!goal.value.validUntil, value: `${formatNumber((goal.value.availableAmount - goal.value.currentBalanceOnAccount) / daysRemaining.value, goal.value.mainCurrency)} /día` }
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
    series: [{ type: 'pie', radius: ['40%', '70%'], data }]
  };
});

// Group by date
const groupedPayments = computed(() =>
  Object.entries(
    payments.value.reduce((acc, p) => {
      const d = p.date.toDate ? p.date.toDate() : new Date(p.date);
      const key = d.toISOString().split('T')[0];
      (acc[key] = acc[key] || []).push(p);
      return acc;
    }, {})
  )
    .sort(([a], [b]) => new Date(b) - new Date(a))
    .reduce((obj, [k, v]) => ((obj[k] = v), obj), {})
);

// Save balance edits
const toggleBalanceEdit = () => (balanceReadyToEdit.value = !balanceReadyToEdit.value);
const saveEditedBalance = async () => {
  await updateDoc(doc(db, 'goals', goal.value.id), { currentBalanceOnAccount: parseFloat(balanceToUpdate.value) });
  balanceReadyToEdit.value = false;
  await fetchGoalDetails(goal.value.id);
};

// Handle payment saved / deleted
const onPaymentSaved = async (amount, currency) => {
  const id = route.params.goalId;
  await fetchPaymentsForGoal(id);
  const delta = await convertToMainCurrency(amount, currency, goal.value.mainCurrency);
  const newBal = goal.value.type === 'Cuenta bancaria'
    ? goal.value.currentBalanceOnAccount - delta
    : goal.value.currentBalanceOnAccount + delta;
  await updateDoc(doc(db, 'goals', id), { currentBalanceOnAccount: newBal });
  await fetchGoalDetails(id);
};

const deletePayment = async p => {
  await deleteDoc(doc(db, 'payments', p.id));
  await onPaymentSaved(-p.amount, p.currency);
};

// Init
onMounted(() => {
  onAuthStateChanged(auth, async user => {
    if (user) {
      const id = route.params.goalId;
      await fetchGoalDetails(id);
      await fetchPaymentsForGoal(id);
      isLoading.value = false;
    }
  });
});
</script>

<style>
/* ... tu CSS personalizado ... */
</style>
