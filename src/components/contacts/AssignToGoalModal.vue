<template>
  <!-- Overlay -->
  <Transition name="overlay">
    <div v-if="visible" class="fixed inset-0 bg-black/40 z-40" @click="close"></div>
  </Transition>
  <!-- Panel -->
  <Transition name="sheet">
    <div
      v-if="visible"
      class="fixed z-50 bg-white shadow-2xl p-6 overflow-y-auto
             inset-x-0 bottom-0 rounded-t-2xl max-h-[80vh]
             md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl md:w-full md:max-w-md md:max-h-[90vh]">

      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-gray-900">Asignar a una tarjeta/cuenta</h2>
        <button
          class="p-1.5 rounded-full border border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300 transition"
          @click="close">
          <XMarkIcon class="h-4 w-4" />
        </button>
      </div>

      <!-- Expense summary -->
      <div v-if="expense" class="bg-gray-50 rounded-xl p-3 mb-4">
        <div class="flex items-center gap-2 mb-2">
          <div class="flex items-center justify-center h-6 w-6 rounded-full bg-gray-200 shrink-0">
            <UserIcon class="h-3.5 w-3.5 text-gray-500" />
          </div>
          <p class="text-sm font-medium text-gray-700">{{ expense.createdByName }}</p>
        </div>
        <p class="text-xs text-gray-400">{{ expense.category }}</p>
        <p class="text-lg font-bold text-gray-900">
          {{ currencySymbol(expense.currency) }} {{ formatNumber(expense.amount, expense.currency) }}
        </p>
      </div>

      <!-- Loading goals -->
      <div v-if="loading" class="py-8 text-center">
        <p class="text-sm text-gray-400">Cargando tus tarjetas y cuentas...</p>
      </div>

      <!-- No goals -->
      <div v-else-if="!goals.length" class="py-8 text-center">
        <p class="text-sm text-gray-400 mb-3">No tienes tarjetas o cuentas. Crea una para asignar este gasto.</p>
        <router-link
          to="/create-goal"
          class="inline-block px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition">
          Crear tarjeta/cuenta
        </router-link>
      </div>

      <!-- Goal list -->
      <div v-else class="space-y-2">
        <button
          v-for="g in goals"
          :key="g.id"
          :class="[
            'w-full flex items-center gap-3 px-3 py-3 rounded-xl border transition text-left',
            selectedGoal?.id === g.id
              ? 'border-gray-900 bg-gray-50'
              : 'border-gray-200 hover:border-gray-300'
          ]"
          @click="selectedGoal = g">
          <div class="flex items-center justify-center h-8 w-8 rounded-lg shrink-0"
               :class="g.type === 'Tarjeta de crédito' ? 'bg-indigo-50' : 'bg-emerald-50'">
            <CreditCardIcon v-if="g.type === 'Tarjeta de crédito'" class="h-4 w-4 text-indigo-500" />
            <BanknotesIcon v-else class="h-4 w-4 text-emerald-500" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-700 truncate">{{ g.title }}</p>
            <p class="text-xs text-gray-400">{{ g.type }} · {{ g.mainCurrency }}</p>
          </div>
          <CheckCircleIcon v-if="selectedGoal?.id === g.id" class="h-5 w-5 text-gray-900 shrink-0" />
        </button>

        <!-- Currency conversion note -->
        <p v-if="selectedGoal && expense && expense.currency !== selectedGoal.mainCurrency"
           class="text-xs text-amber-600 bg-amber-50 rounded-xl px-3 py-2 mt-2">
          El monto se convertirá de {{ expense.currency }} a {{ selectedGoal.mainCurrency }} al tipo de cambio del día.
        </p>

        <!-- Confirm button -->
        <button
          v-if="selectedGoal"
          :disabled="assigning"
          class="mt-3 w-full px-4 py-3 text-sm font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 disabled:opacity-50 transition active:scale-[0.98]"
          @click="handleAssign">
          {{ assigning ? 'Asignando...' : 'Confirmar asignación' }}
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch } from 'vue';
import {
  XMarkIcon,
  CreditCardIcon,
  BanknotesIcon,
  CheckCircleIcon,
  UserIcon,
} from '@heroicons/vue/24/outline';
import { fetchGoals } from '@/utils/business/goals';
import { assignSharedExpense } from '@/utils/business/sharedExpenses';
import { formatNumber } from '@/utils/currencyFormatters';

const props = defineProps({
  visible: { type: Boolean, default: false },
  expense: { type: Object, default: null },
});

const emit = defineEmits(['close', 'assigned']);

const goals = ref([]);
const selectedGoal = ref(null);
const loading = ref(true);
const assigning = ref(false);

const currencySymbol = (currency) => {
  const map = { EUR: '€', USD: '$', CLP: '$', COP: '$' };
  return map[currency] || currency;
};

const close = () => {
  selectedGoal.value = null;
  emit('close');
};

const loadGoals = async () => {
  loading.value = true;
  try {
    const all = await fetchGoals();
    // Solo mostrar goals activos (no archivados)
    goals.value = all.filter(g => !g.isArchived);
  } catch (e) {
    console.error('Error cargando goals:', e);
  } finally {
    loading.value = false;
  }
};

const handleAssign = async () => {
  if (!selectedGoal.value || !props.expense || assigning.value) return;

  assigning.value = true;
  try {
    await assignSharedExpense(props.expense.id, selectedGoal.value, props.expense);
    emit('assigned');
  } catch (e) {
    console.error('Error al asignar gasto compartido:', e);
  } finally {
    assigning.value = false;
  }
};

// Load goals when modal opens
watch(() => props.visible, (val) => {
  if (val) {
    loadGoals();
    selectedGoal.value = null;
  }
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
