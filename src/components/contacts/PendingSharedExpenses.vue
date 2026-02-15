<template>
  <div v-if="expenses.length">
    <h3 class="text-sm font-semibold text-white mb-2">
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
        <div class="flex gap-2 mt-2.5">
          <button
            class="flex-1 px-3 py-2 text-xs font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition"
            @click="openAssign(expense)">
            Asignar a una tarjeta/cuenta
          </button>
          <button
            class="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 transition"
            @click="handleDismiss(expense.id)">
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
  </div>
</template>

<script setup>
import { ref } from 'vue';
import * as OutlineIcons from '@heroicons/vue/24/outline';
import { formatNumber } from '@/utils/currencyFormatters';
import { dismissSharedExpense } from '@/utils/business/sharedExpenses';
import AssignToGoalModal from './AssignToGoalModal.vue';

defineProps({
  expenses: { type: Array, default: () => [] },
});

const emit = defineEmits(['updated']);

const showAssignModal = ref(false);
const selectedExpense = ref(null);

const currencySymbol = (currency) => {
  const map = { EUR: '€', USD: '$', CLP: '$', COP: '$' };
  return map[currency] || currency;
};

const getIconComponent = (name) => OutlineIcons[name] || null;

const openAssign = (expense) => {
  selectedExpense.value = expense;
  showAssignModal.value = true;
};

const handleDismiss = async (id) => {
  try {
    await dismissSharedExpense(id);
    emit('updated');
  } catch (e) {
    console.error('Error al rechazar gasto compartido:', e);
  }
};

const onAssigned = () => {
  showAssignModal.value = false;
  emit('updated');
};
</script>
