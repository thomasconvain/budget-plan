<template>
  <div v-if="expenses.length">
    <h3 class="text-sm font-semibold text-gray-900 mb-2">
      Gastos compartidos pendientes
      <span class="ml-1 inline-flex items-center justify-center h-5 w-5 bg-red-500 rounded-full text-[10px] font-bold text-white">
        {{ expenses.length }}
      </span>
    </h3>
    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">
      <div
        v-for="expense in expenses"
        :key="expense.id"
        class="px-4 py-3">
        <div class="flex items-center gap-3">
          <!-- Icon -->
          <div class="flex items-center justify-center h-8 w-8 rounded-lg bg-indigo-50 shrink-0">
            <component
              :is="getIconComponent(expense.categoryIcon)"
              class="h-4 w-4 text-indigo-500"
            />
          </div>
          <!-- Info -->
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-700 truncate">{{ expense.category }}</p>
            <p class="text-xs text-gray-400">De {{ expense.createdByName }}</p>
          </div>
          <!-- Amount -->
          <p class="text-sm font-semibold text-gray-900 shrink-0">
            {{ currencySymbol(expense.currency) }} {{ formatNumber(expense.amount, expense.currency) }}
          </p>
        </div>
        <!-- Actions -->
        <div class="flex gap-2 mt-2.5 sm:justify-end justify-center">
          <button
            class="flex-1 sm:flex-none px-6 py-2 text-xs font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition"
            @click="openAssign(expense)">
            Asignar
          </button>
          <button
            class="flex-1 sm:flex-none px-6 py-2 text-xs font-medium text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 transition"
            @click="openDismissConfirm(expense)">
            Rechazar
          </button>
        </div>
      </div>
    </div>

    <!-- Assign to Goal Modal -->
    <AssignToGoalModal
      :visible="showAssignModal"
      :expense="selectedExpense"
      @close="showAssignModal = false"
      @assigned="onAssigned"
    />

    <!-- Confirmación: rechazar gasto compartido -->
    <Transition name="overlay">
      <div v-if="showDismissConfirm" class="fixed inset-0 bg-black/40 z-40" @click="showDismissConfirm = false"></div>
    </Transition>
    <Transition name="sheet">
      <div
        v-if="showDismissConfirm"
        class="fixed z-50 bg-white shadow-2xl p-6
               inset-x-0 bottom-0 rounded-t-2xl
               md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl md:w-full md:max-w-sm">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-base font-semibold text-gray-900">Rechazar gasto compartido</h2>
          <button
            class="p-1.5 rounded-full border border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300 transition"
            @click="showDismissConfirm = false">
            <XMarkIcon class="h-4 w-4" />
          </button>
        </div>
        <div class="flex items-start gap-3 p-3 bg-amber-50 rounded-xl mb-5">
          <UserGroupIcon class="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <p class="text-sm text-amber-700">
            Este gasto fue compartido por <strong>{{ pendingDismissExpense?.createdByName }}</strong>.
            Al rechazarlo, también se eliminará de su cuenta.
          </p>
        </div>
        <div class="flex gap-2">
          <button
            @click="showDismissConfirm = false"
            class="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition">
            Cancelar
          </button>
          <button
            @click="confirmDismiss"
            class="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-500 rounded-xl hover:bg-red-600 transition active:scale-[0.98]">
            Rechazar para ambos
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import * as OutlineIcons from '@heroicons/vue/24/outline';
import { XMarkIcon, UserGroupIcon } from '@heroicons/vue/24/outline';
import { formatNumber } from '@/utils/currencyFormatters';
import { dismissSharedExpense } from '@/utils/business/sharedExpenses';
import AssignToGoalModal from './AssignToGoalModal.vue';

defineProps({
  expenses: { type: Array, default: () => [] },
});

const emit = defineEmits(['updated']);

const showAssignModal = ref(false);
const selectedExpense = ref(null);
const showDismissConfirm = ref(false);
const pendingDismissExpense = ref(null);

const currencySymbol = (currency) => {
  const map = { EUR: '€', USD: '$', CLP: '$', COP: '$' };
  return map[currency] || currency;
};

const getIconComponent = (name) => OutlineIcons[name] || null;

const openAssign = (expense) => {
  selectedExpense.value = expense;
  showAssignModal.value = true;
};

const openDismissConfirm = (expense) => {
  pendingDismissExpense.value = expense;
  showDismissConfirm.value = true;
};

const confirmDismiss = async () => {
  showDismissConfirm.value = false;
  if (!pendingDismissExpense.value) return;
  try {
    await dismissSharedExpense(pendingDismissExpense.value.id);
    emit('updated');
  } catch (e) {
    console.error('Error al rechazar gasto compartido:', e);
  } finally {
    pendingDismissExpense.value = null;
  }
};

const onAssigned = () => {
  showAssignModal.value = false;
  emit('updated');
};
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
