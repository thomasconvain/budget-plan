<template>
  <div v-if="isLoading">
    <ContactDetailSkeleton />
  </div>
  <div v-else ref="contentRef" class="max-w-2xl mx-auto px-4 pb-20">

    <!-- Header -->
    <div class="flex items-center justify-between mt-6 mb-6">
      <div class="min-w-0 flex-1">
        <h1 class="text-2xl text-white font-bold truncate">{{ contact?.name }}</h1>
        <p class="text-xs text-white/60 truncate mt-0.5">{{ contact?.email }}</p>
      </div>
      <button
        v-if="!isNativeApp"
        class="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition shrink-0"
        @click="$router.push({ name: 'Contacts' })">
        <ArrowLeftIcon class="h-4 w-4 text-white" />
      </button>
    </div>

    <!-- Balance total histórico -->
    <div class="flex items-center justify-between mb-2">
      <h2 class="text-sm font-semibold text-white/80">Balance pendiente total</h2>
      <button
        v-if="canIPay || canTheyPay"
        class="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-lg hover:bg-emerald-400/20 transition active:scale-[0.98]"
        @click="openSettlementSheet">
        <BanknotesIcon class="h-3.5 w-3.5" />
        Saldar deudas
      </button>
    </div>
    <div v-if="allTimeCurrencies.length" class="grid gap-2 mb-4" :class="allTimeCurrencies.length > 1 ? 'grid-cols-2' : 'grid-cols-1'">
      <div
        v-for="cur in allTimeCurrencies"
        :key="'all-' + cur"
        class="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <p class="text-xs font-medium text-gray-400 mb-1">{{ cur }}</p>
        <p class="text-lg font-bold" :class="balanceColor(allTimeBalanceByCurrency[cur])">
          {{ balanceLabel(allTimeBalanceByCurrency[cur], cur) }}
        </p>
        <p class="text-xs mt-0.5" :class="balanceColor(allTimeBalanceByCurrency[cur])">
          {{ balanceDirection(allTimeBalanceByCurrency[cur]) }}
        </p>
      </div>
    </div>
    <div v-else class="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
      <p class="text-sm text-gray-400 text-center">Sin balance pendiente</p>
    </div>

    <!-- Filtro de fechas -->
    <div class="flex gap-3 mb-4">
      <div class="flex-1">
        <label class="block text-xs font-medium text-white/60 mb-1">Desde</label>
        <input
          type="date"
          v-model="dateFrom"
          class="w-full px-3 py-2 text-sm bg-white/10 text-white border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/20"
        />
      </div>
      <div class="flex-1">
        <label class="block text-xs font-medium text-white/60 mb-1">Hasta</label>
        <input
          type="date"
          v-model="dateTo"
          class="w-full px-3 py-2 text-sm bg-white/10 text-white border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/20"
        />
      </div>
    </div>

    <!-- Balance en el período -->
    <h2 class="text-sm font-semibold text-white/80 mb-2">Balance en el período</h2>
    <div v-if="filteredCurrencies.length" ref="periodBalanceRef" class="grid gap-2 mb-6" :class="filteredCurrencies.length > 1 ? 'grid-cols-2' : 'grid-cols-1'">
      <div
        v-for="cur in filteredCurrencies"
        :key="'filt-' + cur"
        class="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <p class="text-xs font-medium text-gray-400 mb-1">{{ cur }}</p>
        <p class="text-lg font-bold" :class="balanceColor(filteredBalanceByCurrency[cur])">
          {{ balanceLabel(filteredBalanceByCurrency[cur], cur) }}
        </p>
        <p class="text-xs mt-0.5" :class="balanceColor(filteredBalanceByCurrency[cur])">
          {{ balanceDirection(filteredBalanceByCurrency[cur]) }}
        </p>
      </div>
    </div>
    <div v-else ref="periodBalanceRef" class="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
      <p class="text-sm text-gray-400 text-center">Sin balance pendiente en este período</p>
    </div>

    <!-- Lista cronológica -->
    <h2 class="text-sm font-semibold text-gray-700 mb-2">Movimientos</h2>
    <div v-if="Object.keys(groupedTimeline).length" class="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">
      <template v-for="(items, date) in groupedTimeline" :key="date">
        <!-- Separador de fecha -->
        <div class="px-4 py-2 bg-gray-50/50 first:rounded-t-2xl">
          <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            {{ formatDateToLargeString(date) }}
          </p>
        </div>
        <!-- Items del día -->
        <div
          v-for="item in items"
          :key="item.id"
          class="flex items-center gap-3 px-4 py-3">
          <!-- Icon -->
          <div
            class="flex items-center justify-center h-8 w-8 rounded-lg shrink-0"
            :class="itemIconBg(item)">
            <component :is="itemIcon(item)" class="h-4 w-4" :class="itemIconColor(item)" />
          </div>
          <!-- Info -->
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-700 truncate">
              {{ itemTitle(item) }}
            </p>
            <p class="text-xs text-gray-400 truncate">
              {{ itemSubtitle(item) }}
            </p>
          </div>
          <!-- Amount -->
          <div class="text-right shrink-0">
            <p class="text-sm font-semibold" :class="itemAmountColor(item)">
              {{ itemAmountPrefix(item) }}{{ currencySymbol(item.currency) }} {{ formatNumber(item.amount, item.currency) }}
            </p>
            <p v-if="item._type === 'expense'" class="text-[10px] text-gray-400">
              {{ item.status === 'cancelled' ? 'Cancelado' : item.status === 'pending' ? 'Pendiente' : 'Asignado' }}
            </p>
          </div>
        </div>
      </template>
    </div>
    <div v-else class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <p class="text-sm text-gray-400 text-center">Sin movimientos en este período</p>
    </div>

    <!-- Settlement bottom sheet -->
    <Transition name="overlay">
      <div v-if="showSettlementSheet" class="fixed inset-0 bg-black/40 z-40" @click="showSettlementSheet = false"></div>
    </Transition>
    <Transition name="sheet">
      <div
        v-if="showSettlementSheet"
        class="fixed z-50 bg-white shadow-2xl p-6 overflow-y-auto
               inset-x-0 bottom-0 rounded-t-2xl max-h-[80vh]
               md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl md:w-full md:max-w-md md:max-h-[90vh]">

        <!-- Header -->
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-900">Registrar liquidación</h2>
          <button
            class="p-1.5 rounded-full border border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300 transition"
            @click="showSettlementSheet = false">
            <XMarkIcon class="h-4 w-4" />
          </button>
        </div>

        <!-- Dirección -->
        <label class="block text-xs font-medium text-gray-500 mb-1">Dirección</label>
        <div class="flex gap-2 mb-4">
          <button
            v-if="canIPay"
            :class="[
              'flex-1 px-3 py-2.5 text-sm font-medium rounded-xl border transition',
              settlementDirection === 'i_pay'
                ? 'border-gray-900 bg-gray-50 text-gray-900'
                : 'border-gray-200 text-gray-500 hover:border-gray-300'
            ]"
            @click="changeDirection('i_pay')">
            Yo pagué
          </button>
          <button
            v-if="canTheyPay"
            :class="[
              'flex-1 px-3 py-2.5 text-sm font-medium rounded-xl border transition',
              settlementDirection === 'they_pay'
                ? 'border-gray-900 bg-gray-50 text-gray-900'
                : 'border-gray-200 text-gray-500 hover:border-gray-300'
            ]"
            @click="changeDirection('they_pay')">
            {{ contact?.name }} pagó
          </button>
        </div>

        <!-- Monto -->
        <label class="block text-xs font-medium text-gray-500 mb-1">Monto</label>
        <div class="flex gap-2 mb-1">
          <input
            type="number"
            v-model.number="settlementAmount"
            placeholder="0"
            min="0"
            :max="maxSettlementAmount"
            step="any"
            class="flex-1 px-3 py-2.5 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/10"
            :class="settlementExceedsMax ? 'border-red-300' : 'border-gray-200'"
          />
          <select
            v-model="settlementCurrency"
            class="px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/10">
            <option v-for="cur in availableSettlementCurrencies" :key="cur" :value="cur">{{ cur }}</option>
          </select>
        </div>
        <p class="text-xs mb-4" :class="settlementExceedsMax ? 'text-red-500' : 'text-gray-400'">
          {{ settlementExceedsMax ? 'El monto excede el balance pendiente' : '' }}
          Máx: {{ currencySymbol(settlementCurrency) }} {{ formatNumber(maxSettlementAmount, settlementCurrency) }}
        </p>

        <!-- Nota -->
        <label class="block text-xs font-medium text-gray-500 mb-1">Nota (opcional)</label>
        <input
          type="text"
          v-model="settlementNote"
          placeholder="Ej: Cena del viernes"
          class="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/10 mb-4"
        />

        <!-- Confirmar -->
        <button
          :disabled="!settlementAmount || settlementAmount <= 0 || settlementExceedsMax || savingSettlement"
          class="w-full px-4 py-3 text-sm font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 disabled:opacity-50 transition active:scale-[0.98]"
          @click="handleCreateSettlement">
          {{ savingSettlement ? 'Registrando...' : 'Registrar liquidación' }}
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import {
  ArrowLeftIcon,
  XMarkIcon,
  ArrowUpRightIcon,
  ArrowDownLeftIcon,
  BanknotesIcon,
} from '@heroicons/vue/24/outline';
import * as OutlineIcons from '@heroicons/vue/24/outline';
import ContactDetailSkeleton from '@/components/skeletons/ContactDetailSkeleton.vue';
import { fetchContactById } from '@/utils/business/invitations';
import { fetchSharedExpensesWith } from '@/utils/business/sharedExpenses';
import { fetchSettlementsWith, createSettlement } from '@/utils/business/settlements';
import { formatNumber } from '@/utils/currencyFormatters';
import { formatDateToLargeString } from '@/utils/dateFormatter';

const route = useRoute();
const router = useRouter();
const isNativeApp = Capacitor.isNativePlatform();
const auth = getAuth();
const emit = defineEmits(['last-card-position']);

const props = defineProps({
  contactId: { type: String, required: true },
});

// State
const isLoading = ref(true);
const contentRef = ref(null);
const periodBalanceRef = ref(null);
const contact = ref(null);
const allExpenses = ref([]);
const allSettlements = ref([]);
let currentUserId = null;

// Date filter — default: 1st of current month to today
const toInputDate = (d) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};
const firstOfMonth = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
};
const dateFrom = ref(toInputDate(firstOfMonth()));
const dateTo = ref(toInputDate(new Date()));

// Settlement form
const showSettlementSheet = ref(false);
const settlementDirection = ref('i_pay');
const settlementAmount = ref(null);
const settlementCurrency = ref('');
const settlementNote = ref('');
const savingSettlement = ref(false);

// Settlement constraints based on balance
// i_pay = yo pago → solo aplica si debo (balance < 0)
// they_pay = contacto paga → solo aplica si me deben (balance > 0)
const canIPay = computed(() => {
  const bal = allTimeBalanceByCurrency.value;
  return Object.keys(bal).some((cur) => bal[cur] < 0);
});
const canTheyPay = computed(() => {
  const bal = allTimeBalanceByCurrency.value;
  return Object.keys(bal).some((cur) => bal[cur] > 0);
});

const availableSettlementCurrencies = computed(() => {
  const bal = allTimeBalanceByCurrency.value;
  if (settlementDirection.value === 'i_pay') {
    return Object.keys(bal).filter((cur) => bal[cur] < 0);
  }
  return Object.keys(bal).filter((cur) => bal[cur] > 0);
});

const maxSettlementAmount = computed(() => {
  const bal = allTimeBalanceByCurrency.value;
  const cur = settlementCurrency.value;
  if (!cur || bal[cur] == null) return 0;
  return Math.abs(bal[cur]);
});

const settlementExceedsMax = computed(() => {
  if (!settlementAmount.value || settlementAmount.value <= 0) return false;
  return settlementAmount.value > maxSettlementAmount.value;
});

const openSettlementSheet = () => {
  // Auto-select direction based on what's available
  if (canTheyPay.value) {
    settlementDirection.value = 'they_pay';
  } else if (canIPay.value) {
    settlementDirection.value = 'i_pay';
  }
  // Auto-select first available currency
  const currencies = availableSettlementCurrencies.value;
  settlementCurrency.value = currencies.length ? currencies[0] : '';
  settlementAmount.value = null;
  settlementNote.value = '';
  showSettlementSheet.value = true;
};

// Helpers
const currencySymbol = (currency) => {
  const map = { EUR: '€', USD: '$', CLP: '$', COP: '$' };
  return map[currency] || currency;
};

const getIconComponent = (name) => OutlineIcons[name] || null;

// Balance computation
const computeBalanceByCurrency = (expenses, settlements) => {
  const map = {};
  for (const e of expenses) {
    if (e.status === 'cancelled') continue;
    const cur = e.currency;
    if (!map[cur]) map[cur] = 0;
    if (e.createdByUserId === currentUserId) {
      map[cur] += Number(e.amount);
    } else {
      map[cur] -= Number(e.amount);
    }
  }
  for (const s of settlements) {
    const cur = s.currency;
    if (!map[cur]) map[cur] = 0;
    if (s.fromUserId === currentUserId) {
      // Yo pagué → reduce lo que debo (balance sube hacia 0)
      map[cur] += Number(s.amount);
    } else {
      // Contacto pagó → reduce lo que me debe (balance baja hacia 0)
      map[cur] -= Number(s.amount);
    }
  }
  return map;
};

// All-time balance
const allTimeBalanceByCurrency = computed(() => {
  return computeBalanceByCurrency(allExpenses.value, allSettlements.value);
});

const allTimeCurrencies = computed(() => {
  return Object.keys(allTimeBalanceByCurrency.value).filter(
    (cur) => allTimeBalanceByCurrency.value[cur] !== 0
  );
});

// Filtered items
const toLocalDateStr = (d) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const parseDateInput = (str) => {
  const [y, m, d] = str.split('-').map(Number);
  return { y, m, d };
};

const filterByDateRange = (items) => {
  const f = parseDateInput(dateFrom.value);
  const t = parseDateInput(dateTo.value);
  const from = new Date(f.y, f.m - 1, f.d, 0, 0, 0, 0);
  const to = new Date(t.y, t.m - 1, t.d, 23, 59, 59, 999);
  return items.filter((item) => {
    const d = item.createdAt?.toDate ? item.createdAt.toDate() : new Date(item.createdAt);
    return d >= from && d <= to;
  });
};

const filteredExpenses = computed(() => filterByDateRange(allExpenses.value));
const filteredSettlements = computed(() => filterByDateRange(allSettlements.value));

const filteredBalanceByCurrency = computed(() => {
  const map = {};
  for (const e of filteredExpenses.value) {
    if (e.status === 'cancelled') continue;
    const cur = e.currency;
    if (!map[cur]) map[cur] = 0;
    if (e.createdByUserId === currentUserId) {
      map[cur] += Number(e.amount);
    } else {
      map[cur] -= Number(e.amount);
    }
  }
  for (const s of filteredSettlements.value) {
    const cur = s.currency;
    if (!map[cur]) map[cur] = 0;
    if (s.fromUserId === currentUserId) {
      map[cur] += Number(s.amount);
    } else {
      map[cur] -= Number(s.amount);
    }
  }
  return map;
});

const filteredCurrencies = computed(() => {
  return Object.keys(filteredBalanceByCurrency.value).filter(
    (cur) => filteredBalanceByCurrency.value[cur] !== 0
  );
});

// Combined timeline
const groupedTimeline = computed(() => {
  const expenses = filteredExpenses.value.map((e) => ({ ...e, _type: 'expense' }));
  const settlements = filteredSettlements.value.map((s) => ({ ...s, _type: 'settlement' }));
  const all = [...expenses, ...settlements];

  const grouped = all.reduce((acc, item) => {
    const d = item.createdAt?.toDate ? item.createdAt.toDate() : new Date(item.createdAt);
    const dateStr = toLocalDateStr(d);
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(item);
    return acc;
  }, {});

  const sorted = {};
  Object.keys(grouped)
    .sort((a, b) => new Date(b) - new Date(a))
    .forEach((key) => {
      sorted[key] = grouped[key].sort((a, b) => {
        const da = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const db = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return db - da;
      });
    });
  return sorted;
});

// Display helpers
const balanceColor = (val) => {
  if (val > 0) return 'text-emerald-600';
  if (val < 0) return 'text-red-500';
  return 'text-gray-400';
};

const balanceLabel = (val, cur) => {
  const absVal = Math.abs(val);
  return `${currencySymbol(cur)} ${formatNumber(absVal, cur)}`;
};

const balanceDirection = (val) => {
  if (val > 0) return 'Te deben';
  if (val < 0) return 'Debes';
  return 'Sin balance';
};

// Timeline item helpers
const itemIconBg = (item) => {
  if (item._type === 'settlement') return 'bg-blue-50';
  if (item.status === 'cancelled') return 'bg-gray-100';
  if (item.createdByUserId === currentUserId) return 'bg-red-50';
  return 'bg-emerald-50';
};

const itemIcon = (item) => {
  if (item._type === 'settlement') return BanknotesIcon;
  if (item.categoryIcon) return getIconComponent(item.categoryIcon) || ArrowUpRightIcon;
  if (item.createdByUserId === currentUserId) return ArrowUpRightIcon;
  return ArrowDownLeftIcon;
};

const itemIconColor = (item) => {
  if (item._type === 'settlement') return 'text-blue-500';
  if (item.status === 'cancelled') return 'text-gray-400';
  if (item.createdByUserId === currentUserId) return 'text-red-500';
  return 'text-emerald-500';
};

const itemTitle = (item) => {
  if (item._type === 'settlement') return 'Liquidación';
  return item.category || 'Gasto compartido';
};

const itemSubtitle = (item) => {
  if (item._type === 'settlement') {
    if (item.note) return item.note;
    return item.fromUserId === currentUserId ? `Pagaste a ${contact.value?.name}` : `${contact.value?.name} te pagó`;
  }
  if (item.createdByUserId === currentUserId) {
    return `${contact.value?.name} te debe`;
  }
  return `Debes a ${contact.value?.name}`;
};

const itemAmountColor = (item) => {
  if (item._type === 'settlement') return 'text-blue-600';
  if (item.status === 'cancelled') return 'text-gray-400 line-through';
  if (item.createdByUserId === currentUserId) return 'text-emerald-600';
  return 'text-red-500';
};

const itemAmountPrefix = (item) => {
  if (item._type === 'settlement') {
    return item.fromUserId === currentUserId ? '-' : '+';
  }
  if (item.createdByUserId === currentUserId) return '+';
  return '-';
};

// Settlement creation
const changeDirection = (dir) => {
  settlementDirection.value = dir;
  const currencies = availableSettlementCurrencies.value;
  if (!currencies.includes(settlementCurrency.value)) {
    settlementCurrency.value = currencies.length ? currencies[0] : '';
  }
  settlementAmount.value = null;
};

const handleCreateSettlement = async () => {
  if (!settlementAmount.value || settlementAmount.value <= 0 || settlementExceedsMax.value || savingSettlement.value) return;
  savingSettlement.value = true;
  try {
    await createSettlement({
      contactUserId: props.contactId,
      amount: settlementAmount.value,
      currency: settlementCurrency.value,
      note: settlementNote.value,
      direction: settlementDirection.value,
    });
    // Refresh settlements
    allSettlements.value = await fetchSettlementsWith(props.contactId);
    showSettlementSheet.value = false;
    settlementAmount.value = null;
    settlementNote.value = '';
    settlementDirection.value = 'i_pay';
  } catch (e) {
    console.error('Error registrando liquidación:', e);
  } finally {
    savingSettlement.value = false;
  }
};

// Background height emission
const emitBackgroundHeight = () => {
  nextTick(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = periodBalanceRef.value;
        if (!el) return;
        // For a grid container, use the first card inside; otherwise use the element itself
        const card = el.querySelector?.('.rounded-2xl') || el;
        const rect = card.getBoundingClientRect();
        emit('last-card-position', rect.top + rect.height / 2);
      });
    });
  });
};

// Data loading
onMounted(() => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUserId = user.uid;
      const [contactData, expenses, settlements] = await Promise.all([
        fetchContactById(props.contactId),
        fetchSharedExpensesWith(props.contactId),
        fetchSettlementsWith(props.contactId),
      ]);
      contact.value = contactData;
      allExpenses.value = expenses;
      allSettlements.value = settlements;
      isLoading.value = false;
      emitBackgroundHeight();
    }
  });
});
</script>

<style scoped>
.overlay-enter-active,
.overlay-leave-active {
  transition: opacity 0.25s ease;
}
.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}
.sheet-enter-active,
.sheet-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}
.sheet-enter-from,
.sheet-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
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
</style>
