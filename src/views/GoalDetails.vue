<template>
  <div v-if="isLoading">
    <GoalDetailsSkeleton />
  </div>
  <div v-else>

    <div class="mt-6 flex items-center justify-between">
      <div class="min-w-0 flex-1">
        <p class="text-xs font-medium text-white/50">{{ goal.type }}</p>
        <h1 class="text-2xl text-white font-bold truncate mt-0.5">{{ goal.title }}</h1>
        <span class="text-xs font-medium text-white/60">{{ goal.mainCurrency }}</span>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <button
          class="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition"
          @click="openSettings">
          <Cog6ToothIcon class="h-4 w-4 text-white" />
        </button>
        <button
          v-if="!isNativeApp"
          class="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition"
          @click="goBack">
          <ArrowLeftIcon class="h-4 w-4 text-white" />
        </button>
      </div>
    </div>

    <!-- Stats bar -->
    <div
      class="absolute md:relative md:mt-3 md:mb-6 inset-x-0 pt-4 px-8 md:px-0 md:pt-0 pb-2 flex flex-nowrap gap-2 overflow-auto scrollbar-hide">
      <div
        v-if="goal.type === 'Tarjeta de crédito'"
        class="min-w-fit inline-flex items-center gap-1 px-3 py-1.5 bg-white/10 rounded-xl text-xs font-medium text-white/70">
        Cupo
        <strong class="text-white">
          {{ currencySymbol(goal.mainCurrency) }} {{ formatNumber(goal.availableAmount, goal.mainCurrency) }}
        </strong>
      </div>
      <div
        v-if="goal.billingDay"
        class="min-w-fit inline-flex items-center gap-1 px-3 py-1.5 bg-white/10 rounded-xl text-xs font-medium text-white/70">
        <CalendarIcon class="h-3.5 w-3.5" />
        Día
        <strong class="text-white">{{ goal.billingDay }}</strong>
      </div>
      <div
        v-else-if="goal.validUntil"
        class="min-w-fit inline-flex items-center gap-1 px-3 py-1.5 bg-white/10 rounded-xl text-xs font-medium text-white/70">
        <CalendarIcon class="h-3.5 w-3.5" />
        <strong class="text-white">{{ formatDate(goal.validFrom) }}</strong>
        –
        <strong class="text-white">{{ formatDate(goal.validUntil) }}</strong>
      </div>
      <div class="min-w-fit inline-flex items-center gap-1 px-3 py-1.5 bg-white/10 rounded-xl text-xs font-medium text-white/70">
        <InformationCircleIcon class="h-3.5 w-3.5" />
        <strong class="text-white">
          <template v-if="daysRemaining > 0">{{ daysRemaining }}d restantes</template>
          <template v-else-if="goal.validUntil">Terminada</template>
          <template v-else>Sin plazo</template>
        </strong>
      </div>
    </div>

    <!-- Stats cards -->
    <div class="mt-20 md:mt-0">
      <div
        class="grid grid-cols-1 gap-3"
        :class="{
          'lg:grid-cols-1': enabledStats.length === 1,
          'lg:grid-cols-2': enabledStats.length === 2,
          'lg:grid-cols-3': enabledStats.length === 3
        }">
        <div
          v-for="(stat, i) in enabledStats"
          :key="stat.id"
          :ref="el => { if (i === enabledStats.length - 1) lastCardRef = el }"
          class="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">

          <div class="flex items-center justify-between mb-2">
            <p class="text-xs font-medium text-gray-400">{{ stat.name }}</p>
            <button
              v-if="stat.id === 1"
              @click="toggleBalanceEdit"
              class="p-1 rounded-full border border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300 transition">
              <component
                :is="balanceReadyToEdit ? XMarkIcon : PencilIcon"
                class="h-3 w-3"
              />
            </button>
          </div>

          <div v-if="stat.id === 1 && balanceReadyToEdit">
            <input
              v-model="balanceToUpdate"
              type="number"
              class="text-2xl font-bold bg-transparent text-gray-900 focus:outline-none w-full"
              @blur="saveEditedBalance"
              @keydown.enter="saveEditedBalance"
            />
            <button
              class="mt-2 w-full px-3 py-2 text-xs font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition"
              @click="saveEditedBalance">
              Guardar
            </button>
          </div>

          <p v-else class="text-2xl font-bold text-gray-900" :class="{'text-red-600': parseFloat(stat.value) <= 0}">
            {{ currencySymbol(goal.mainCurrency) }} {{ (stat.id === 3 && parseFloat(stat.value) < 0) ? '0 /día' : stat.value }}
          </p>
        </div>
      </div>
    </div>

    <!-- Charts toggle -->
    <div class="my-6 flex justify-center lg:justify-end">
      <button
        class="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-gray-500 bg-white rounded-xl border border-gray-100 shadow-sm hover:bg-gray-50 transition"
        @click="showCharts = !showCharts">
        <ChartPieIcon class="h-4 w-4" />
        {{ showCharts ? 'Ocultar' : 'Ver' }} repartición
      </button>
    </div>

    <div v-if="showCharts" class="w-full h-96 bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      <v-chart :option="chartOptions" />
    </div>

    <!-- Payments list -->
    <UserPaymentsList
      v-if="daysRemaining > 0 || !goal.validUntil"
      class="my-6"
      :selectedGoalId="route.params.goalId"
      :goalMainCurrency="goal.mainCurrency"
      @paymentSaved="onPaymentSaved"
      @shareAvailable="onShareAvailable"
    />

    <div
      v-else
      class="my-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <p class="text-sm text-gray-400">
        El periodo de tu presupuesto ha terminado. Ya no puedes ingresar nuevos movimientos.
      </p>
    </div>

    <!-- Historic movements -->
    <div class="mt-8 mb-6">
      <h2 class="text-lg font-semibold text-gray-900 mb-3">Movimientos</h2>
      <div v-if="payments.length" class="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">
        <template v-for="(dayPayments, date) in groupedPayments" :key="date">
          <div class="px-4 py-2 bg-gray-50/50 first:rounded-t-2xl">
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider">{{ formatDateToLargeString(date) }}</p>
          </div>
          <div
            v-for="payment in dayPayments"
            :key="payment.id"
            :class="{'animate-slide-in': payment.id.startsWith('temp-')}"
            class="flex items-center gap-3 px-4 py-3 relative">
            <!-- Icon -->
            <div
              class="flex items-center justify-center h-8 w-8 rounded-lg shrink-0"
              :class="payment.category !== 'Abono a cuenta' ? 'bg-red-50' : 'bg-emerald-50'">
              <component
                :is="payment.category !== 'Abono a cuenta' ? ArrowUpIcon : ArrowDownIcon"
                class="h-4 w-4"
                :class="payment.category !== 'Abono a cuenta' ? 'text-red-500' : 'text-emerald-500'"
              />
            </div>
            <!-- Info -->
              <div class="flex-1 min-w-0">
              <div class="flex items-center gap-1.5">
                <component
                  :is="getIconComponent(payment.categoryIcon)"
                  class="h-3.5 w-3.5 text-gray-300 shrink-0"
                />
                <p class="text-sm font-medium text-gray-700 truncate">{{ payment.category }}</p>
              </div>
              <p v-if="payment.sharedInfo" class="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                <UserGroupIcon class="h-3.5 w-3.5 shrink-0 text-gray-400" />
                <span>Compartiste este gasto con {{ payment.sharedInfo.recipientName }}</span>
                <span v-if="payment.sharedInfo.originalAmount" class="text-gray-400">
                  · Total original: {{ currencySymbol(payment.sharedInfo.currency) }} {{ formatNumber(payment.sharedInfo.originalAmount, payment.sharedInfo.currency) }}
                </span>
              </p>
              <p v-if="payment.sharedFrom" class="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                <UserGroupIcon class="h-3.5 w-3.5 shrink-0 text-gray-400" />
                <span>{{ payment.sharedFrom.createdByName }} compartió este gasto</span>
              </p>
              <p v-if="payment.currency !== goal.mainCurrency" class="text-xs text-gray-400 mt-0.5">
                {{ currencySymbol(goal.mainCurrency) }} {{ formatNumber(payment.convertedAmount, goal.mainCurrency) }}
              </p>
            </div>
            <!-- Amount + delete -->
            <div class="flex items-center gap-2 shrink-0">
              <p class="text-sm font-semibold" :class="payment.category !== 'Abono a cuenta' ? 'text-gray-900' : 'text-emerald-600'">
                {{ payment.category !== 'Abono a cuenta' ? '-' : '+' }}{{ currencySymbol(payment.currency) }} {{ formatNumber(Math.abs(payment.amount), payment.currency) }}
              </p>
              <button
                @click="handleDeleteClick(payment)"
                class="p-1 rounded-full border border-gray-200 text-gray-300 hover:text-red-500 hover:border-red-300 hover:bg-red-50 transition">
                <TrashIcon class="h-3 w-3" />
              </button>
            </div>
            <!-- Pending indicator -->
            <div v-if="payment.id.startsWith('temp-')"
                 class="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-gray-400 animate-pulse rounded-full">
            </div>
          </div>
        </template>
      </div>
      <p v-else class="text-sm text-gray-400">Aún no tienes movimientos ingresados</p>
    </div>

    <!-- Settings: bottom sheet (mobile) / modal (desktop) -->
    <Transition name="overlay">
      <div v-if="showSettings" class="fixed inset-0 bg-black/40 z-40" @click="showSettings = false"></div>
    </Transition>
    <Transition name="sheet">
      <div
        v-if="showSettings"
        class="settings-panel fixed z-50 bg-white shadow-2xl p-6 overflow-y-auto
               inset-x-0 bottom-0 rounded-t-2xl max-h-[80vh]
               md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl md:w-full md:max-w-md md:max-h-[90vh]">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-lg font-semibold text-gray-900">Configuración</h2>
          <button class="p-1.5 rounded-full border border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300 transition" @click="showSettings = false">
            <XMarkIcon class="h-4 w-4" />
          </button>
        </div>

        <div class="flex flex-col gap-4">
          <!-- Nombre -->
          <div>
            <label class="block text-xs font-medium text-gray-400 mb-1.5">Nombre</label>
            <input
              v-model="settingsTitle"
              type="text"
              class="block w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent text-sm text-gray-900"
            />
          </div>

          <!-- Día de facturación (solo tarjetas de crédito) -->
          <div v-if="goal.billingDay || goal.type === 'Tarjeta de crédito'">
            <label class="block text-xs font-medium text-gray-400 mb-1.5">Día de facturación</label>
            <select
              v-model.number="settingsBillingDay"
              class="block w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent text-sm text-gray-900">
              <option v-for="day in 31" :key="day" :value="day">{{ day }}</option>
            </select>
          </div>

          <!-- Cupo de gasto máximo (solo tarjetas de crédito) -->
          <div v-if="goal.type === 'Tarjeta de crédito'">
            <label class="block text-xs font-medium text-gray-400 mb-1.5">Cupo de gasto máximo</label>
            <input
              v-model.number="settingsAvailableAmount"
              type="number"
              class="block w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent text-sm text-gray-900"
            />
          </div>
        </div>

        <button
          @click="saveSettings"
          :disabled="savingSettings"
          class="mt-6 w-full px-4 py-3 text-sm font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 disabled:opacity-50 transition active:scale-[0.98]">
          {{ savingSettings ? 'Guardando...' : 'Guardar cambios' }}
        </button>
      </div>
    </Transition>

    <!-- Share expense panel -->
    <ShareExpensePanel
      :visible="showSharePanel"
      :payment="sharePaymentData"
      @close="showSharePanel = false"
      @shared="onSharedExpense"
    />

    <!-- Confirmación: eliminar gasto compartido -->
    <Transition name="overlay">
      <div v-if="showDeleteSharedConfirm" class="fixed inset-0 bg-black/40 z-40" @click="showDeleteSharedConfirm = false"></div>
    </Transition>
    <Transition name="sheet">
      <div
        v-if="showDeleteSharedConfirm"
        class="fixed z-50 bg-white shadow-2xl p-6
               inset-x-0 bottom-0 rounded-t-2xl
               md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl md:w-full md:max-w-sm">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-base font-semibold text-gray-900">Eliminar gasto compartido</h2>
          <button
            class="p-1.5 rounded-full border border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300 transition"
            @click="showDeleteSharedConfirm = false">
            <XMarkIcon class="h-4 w-4" />
          </button>
        </div>
        <div class="flex items-start gap-3 p-3 bg-amber-50 rounded-xl mb-5">
          <UserGroupIcon class="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <p class="text-sm text-amber-700">{{ deleteSharedConfirmMessage }}</p>
        </div>
        <div class="flex gap-2">
          <button
            @click="showDeleteSharedConfirm = false"
            class="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition">
            Cancelar
          </button>
          <button
            @click="confirmDelete"
            class="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-500 rounded-xl hover:bg-red-600 transition active:scale-[0.98]">
            Eliminar para ambos
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, provide, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Timestamp, getFirestore, doc, getDoc, updateDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import UserPaymentsList from '../components/UserPaymentsList.vue';
import GoalDetailsSkeleton from '../components/skeletons/GoalDetailsSkeleton.vue';
import ShareExpensePanel from '../components/ShareExpensePanel.vue';
import { formatDate, formatDateToLargeString } from '../utils/dateFormatter';
import { formatNumber } from '../utils/currencyFormatters';
import { convertToMainCurrency } from '../utils/currencyConverter';
import { calculateBillingPeriod } from '../utils/billingPeriod';
import { getSharedRecipientNamesByPaymentIds, getSharedCreatorNamesByPaymentIds, markSharedExpenseCancelledWhenRecipientDeletes, cancelSharedExpenseByCreator, cleanupCancelledSharedExpensesAsRecipient, cleanupCancelledSharedExpensesAsCreator, processBalanceAdjustments } from '../utils/business/sharedExpenses';
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
  ChartPieIcon,
  Cog6ToothIcon,
  ArrowLeftIcon,
  UserGroupIcon,
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
const showSharePanel = ref(false);
const sharePaymentData = ref({ amount: 0, currency: 'CLP', category: '', categoryIcon: '', paymentId: '', goalId: '' });
const showDeleteSharedConfirm = ref(false);
const pendingDeletePayment = ref(null);
const emit = defineEmits(['last-card-position']);

const goBack = () => router.push({ name: 'Dashboard' });

const deleteSharedConfirmMessage = computed(() => {
  if (!pendingDeletePayment.value) return '';
  if (pendingDeletePayment.value.sharedInfo) {
    return `Este gasto fue compartido con ${pendingDeletePayment.value.sharedInfo.recipientName}. Al eliminarlo, también se eliminará de su cuenta.`;
  }
  if (pendingDeletePayment.value.sharedFrom) {
    return `Este gasto fue compartido por ${pendingDeletePayment.value.sharedFrom.createdByName}. Al eliminarlo, también se eliminará de su cuenta.`;
  }
  return '';
});

const handleDeleteClick = (payment) => {
  const isShared = !!payment.sharedInfo || !!payment.sharedFrom;
  if (isShared) {
    pendingDeletePayment.value = payment;
    showDeleteSharedConfirm.value = true;
  } else {
    deletePayment(payment);
  }
};

const confirmDelete = () => {
  showDeleteSharedConfirm.value = false;
  if (pendingDeletePayment.value) {
    deletePayment(pendingDeletePayment.value);
    pendingDeletePayment.value = null;
  }
};

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
  const list = await Promise.all(
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

  const paymentIds = list.map(p => p.id);
  const [sharedMap, creatorMap] = await Promise.all([
    getSharedRecipientNamesByPaymentIds(paymentIds),
    getSharedCreatorNamesByPaymentIds(paymentIds),
  ]);
  payments.value = list.map(p => ({
    ...p,
    sharedInfo: sharedMap[p.id] || null,
    sharedFrom: creatorMap[p.id] || null,
  }));
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
    legend: {
      bottom: '0%',
      left: 'center',
      orient: 'horizontal',
      type: 'scroll',
    },
    series: [
    {
      name: 'Categoría',
      type: 'pie',
      center: ['50%', '42%'],
      radius: ['35%', '60%'],
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
      // Dentro de cada fecha, ordenar por hora descendente (más reciente arriba, más antiguo abajo)
      acc[key] = grouped[key].sort((a, b) => {
        const dateA = a.date instanceof Timestamp ? a.date.toDate() : new Date(a.date);
        const dateB = b.date instanceof Timestamp ? b.date.toDate() : new Date(b.date);
        return dateB - dateA;
      });
      return acc;
    }, {});
});

// Settings bottom sheet
const showSettings = ref(false);
const settingsTitle = ref('');
const settingsBillingDay = ref(1);
const settingsAvailableAmount = ref(0);
const savingSettings = ref(false);

const openSettings = () => {
  settingsTitle.value = goal.value.title;
  settingsBillingDay.value = goal.value.billingDay || 1;
  settingsAvailableAmount.value = goal.value.availableAmount || 0;
  showSettings.value = true;
};

const saveSettings = async () => {
  savingSettings.value = true;
  try {
    const updates = {
      title: encrypt(settingsTitle.value.trim(), key),
    };

    if (goal.value.type === 'Tarjeta de crédito') {
      updates.availableAmount = encrypt(settingsAvailableAmount.value.toString(), key);

      if (settingsBillingDay.value !== goal.value.billingDay) {
        const { validFrom, validUntil } = calculateBillingPeriod(settingsBillingDay.value);
        updates.billingDay = settingsBillingDay.value;
        updates.validFrom = Timestamp.fromDate(validFrom);
        updates.validUntil = Timestamp.fromDate(validUntil);
      }
    }

    await updateDoc(doc(db, 'goals', goal.value.id), updates);
    showSettings.value = false;
    await fetchGoalDetails(goal.value.id);
  } catch (error) {
    console.error('Error al guardar configuración:', error);
  } finally {
    savingSettings.value = false;
  }
};

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

const onShareAvailable = (paymentData) => {
  sharePaymentData.value = paymentData;
  showSharePanel.value = true;
};

const onSharedExpense = async () => {
  showSharePanel.value = false;
  const id = route.params.goalId;
  await fetchGoalDetails(id);
  await fetchPaymentsForGoal(id);
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
    // Si es el creador eliminando su pago origen, cancelar el gasto compartido asignado
    await cancelSharedExpenseByCreator(p.id);
    // Si es el destinatario eliminando su pago recibido, marcar el sharedExpense como cancelado
    await markSharedExpenseCancelledWhenRecipientDeletes(p.id);
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

      // Limpiar pagos cuyo gasto compartido fue cancelado por la otra parte
      const currentPaymentIds = payments.value.map(p => p.id);
      const [deletedAsRecipient, deletedAsCreator] = await Promise.all([
        cleanupCancelledSharedExpensesAsRecipient(currentPaymentIds, id, goal.value.type),
        cleanupCancelledSharedExpensesAsCreator(currentPaymentIds, id, goal.value.type, goal.value.mainCurrency),
      ]);
      const allCleaned = [...deletedAsRecipient, ...deletedAsCreator];
      if (allCleaned.length > 0) {
        payments.value = payments.value.filter(p => !allCleaned.includes(p.id));
      }

      // Aplicar ajustes de balance pendientes (por si la Cloud Function ya eliminó el payment)
      await processBalanceAdjustments();
      // Re-leer el goal para reflejar cualquier cambio de balance
      await fetchGoalDetails(id);

      isLoading.value = false;
      
      // Emitir la posición del último card después de que el browser haya pintado
      nextTick(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (lastCardRef.value) {
              const rect = lastCardRef.value.getBoundingClientRect();
              const cardMidpoint = rect.top + rect.height / 2;
              emit('last-card-position', cardMidpoint);
            }
          });
        });
      });
    }
  });
});
</script>

<style>
/* Overlay transition */
.overlay-enter-active,
.overlay-leave-active {
  transition: opacity 0.25s ease;
}
.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}

/* Mobile: slide up from bottom */
.sheet-enter-active,
.sheet-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}
.sheet-enter-from,
.sheet-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

/* Desktop: scale + fade from center (override slide) */
@media (min-width: 768px) {
  .sheet-enter-from,
  .sheet-leave-to {
    transform: translate(-50%, -50%) scale(0.95);
    opacity: 0;
  }
  .sheet-enter-to,
  .sheet-leave-from {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
}

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
