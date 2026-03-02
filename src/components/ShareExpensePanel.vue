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
        <h2 class="text-lg font-semibold text-gray-900">Compartir gasto</h2>
        <button
          class="p-1.5 rounded-full border border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300 transition"
          @click="close">
          <XMarkIcon class="h-4 w-4" />
        </button>
      </div>

      <!-- Resumen del gasto -->
      <div class="bg-gray-50 rounded-xl p-3 mb-4">
        <p class="text-xs text-gray-400">Gasto original</p>
        <p class="text-lg font-bold text-gray-900">
          {{ currencySymbol(payment.currency) }} {{ formatNumber(Math.abs(payment.amount), payment.currency) }}
        </p>
        <p class="text-xs text-gray-500">{{ payment.category }}</p>
      </div>

      <!-- Contactos -->
      <div v-if="contacts.length" class="mb-4">
        <label class="block text-xs font-medium text-gray-400 mb-2">Compartir con</label>
        <div class="space-y-2">
          <button
            v-for="contact in contacts"
            :key="contact.userId"
            :class="[
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition text-left',
              selectedContact?.userId === contact.userId
                ? 'border-gray-900 bg-gray-50'
                : 'border-gray-200 hover:border-gray-300'
            ]"
            @click="selectedContact = contact">
            <div class="flex items-center justify-center h-7 w-7 rounded-lg bg-emerald-50 shrink-0">
              <UserIcon class="h-3.5 w-3.5 text-emerald-500" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-700 truncate">{{ contact.name }}</p>
              <p class="text-xs text-gray-400 truncate">{{ contact.email }}</p>
            </div>
            <CheckCircleIcon
              v-if="selectedContact?.userId === contact.userId"
              class="h-5 w-5 text-gray-900 shrink-0"
            />
          </button>
        </div>
      </div>
      <p v-else class="text-sm text-gray-400 mb-4">No tienes contactos aún. Invita a alguien desde la sección de Contactos.</p>

      <!-- Monto a asignar -->
      <div v-if="selectedContact" class="mb-4">
        <div class="flex items-center justify-between mb-2">
          <label class="text-xs font-medium text-gray-400">Monto que paga {{ selectedContact.name }}</label>
          <button
            class="text-xs font-medium px-2.5 py-1 rounded-lg border transition"
            :class="isHalf ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-600 hover:border-gray-300'"
            @click="setHalf">
            50 / 50
          </button>
        </div>

        <div class="relative flex items-center">
          <span class="absolute left-3 text-sm text-gray-400 pointer-events-none select-none">{{ currencySymbol(payment.currency) }}</span>
          <input
            type="number"
            v-model="customAmountInput"
            :min="0"
            :max="totalAmount"
            :step="payment.currency === 'CLP' || payment.currency === 'COP' ? 1 : 0.01"
            class="w-full pl-7 pr-16 py-2.5 text-sm border rounded-xl transition focus:outline-none"
            :class="isOverTotal ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-gray-900'"
            placeholder="0"
          />
          <span class="absolute right-3 text-xs font-semibold pointer-events-none select-none"
            :class="isOverTotal ? 'text-red-400' : 'text-gray-400'">
            {{ displayPercentage }}%
          </span>
        </div>
        <p v-if="isOverTotal" class="mt-1 text-xs text-red-400">El monto no puede superar el gasto original.</p>

        <!-- Preview -->
        <div class="mt-3 bg-gray-50 rounded-xl p-3">
          <div class="flex justify-between text-sm">
            <span class="text-gray-500">{{ selectedContact.name }} paga</span>
            <span class="font-semibold text-gray-900">
              {{ currencySymbol(payment.currency) }} {{ formatNumber(sharedAmount, payment.currency) }}
            </span>
          </div>
          <div class="flex justify-between text-sm mt-1">
            <span class="text-gray-500">Tú pagas</span>
            <span class="font-semibold text-gray-900">
              {{ currencySymbol(payment.currency) }} {{ formatNumber(totalAmount - sharedAmount, payment.currency) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Botón confirmar -->
      <button
        v-if="selectedContact"
        :disabled="sharing || isOverTotal || parsedAmount <= 0"
        class="mt-2 w-full px-4 py-3 text-sm font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 disabled:opacity-50 transition active:scale-[0.98]"
        @click="handleShare">
        {{ sharing ? 'Compartiendo...' : 'Compartir' }}
      </button>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { XMarkIcon, UserIcon, CheckCircleIcon } from '@heroicons/vue/24/outline';
import { fetchContacts } from '@/utils/business/invitations';
import { createSharedExpense } from '@/utils/business/sharedExpenses';
import { formatNumber } from '@/utils/currencyFormatters';

const props = defineProps({
  visible: { type: Boolean, default: false },
  payment: {
    type: Object,
    default: () => ({ amount: 0, currency: 'CLP', category: '', categoryIcon: '', paymentId: '', goalId: '' }),
  },
});

const emit = defineEmits(['close', 'shared']);

const contacts = ref([]);
const selectedContact = ref(null);
const customAmountInput = ref('');
const sharing = ref(false);

const currencySymbol = (currency) => {
  const map = { EUR: '€', USD: '$', CLP: '$', COP: '$' };
  return map[currency] || currency;
};

const totalAmount = computed(() => Math.abs(props.payment.amount));

const setHalf = () => {
  const half = totalAmount.value / 2;
  customAmountInput.value = String(
    props.payment.currency === 'CLP' || props.payment.currency === 'COP'
      ? Math.round(half)
      : Math.round(half * 100) / 100
  );
};

const parsedAmount = computed(() => {
  const val = parseFloat(customAmountInput.value);
  return isNaN(val) ? 0 : val;
});

const isOverTotal = computed(() => parsedAmount.value > totalAmount.value);

const sharedAmount = computed(() =>
  Math.max(0, Math.min(parsedAmount.value, totalAmount.value))
);

const splitPercentage = computed(() => {
  if (totalAmount.value === 0) return 0;
  return (sharedAmount.value / totalAmount.value) * 100;
});

const displayPercentage = computed(() => {
  const pct = splitPercentage.value;
  const rounded = Math.round(pct * 10) / 10;
  return Number.isInteger(rounded) ? rounded : rounded.toFixed(1);
});

const isHalf = computed(() => Math.abs(splitPercentage.value - 50) < 0.01);

watch(() => props.visible, (val) => {
  if (val) setHalf();
});

watch(selectedContact, (contact) => {
  if (contact) setHalf();
});

const close = () => {
  selectedContact.value = null;
  customAmountInput.value = '';
  emit('close');
};

const handleShare = async () => {
  if (!selectedContact.value || sharing.value || isOverTotal.value || parsedAmount.value <= 0) return;

  sharing.value = true;
  try {
    await createSharedExpense({
      sourcePaymentId: props.payment.paymentId,
      sourceGoalId: props.payment.goalId,
      originalAmount: props.payment.amount,
      currency: props.payment.currency,
      category: props.payment.category,
      categoryIcon: props.payment.categoryIcon,
      recipientUserId: selectedContact.value.userId,
      recipientName: selectedContact.value.name,
      splitPercentage: splitPercentage.value,
    });
    emit('shared');
    close();
  } catch (e) {
    console.error('Error al compartir gasto:', e);
  } finally {
    sharing.value = false;
  }
};

onMounted(async () => {
  contacts.value = await fetchContacts();
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
