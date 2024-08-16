<template>
  <div>
    <h1 class="text-2xl font-semibold	mb-4">Ingresar nuevo pago</h1>
    <div class="my-1 flex gap-1 flex-wrap sm:flex-nowrap">
      <div class="relative flex w-full">
        <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
        <input
          :value="formattedAmount"
          @input="updateAmount($event)"
          type="text"
          class="block w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder="Ingresa el monto" />
      </div>
      <input
        v-model="category"
        class="block w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        type="text"
        placeholder="Ingresa la categoría" />
        <select
          v-model="currency"
          class="block w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
          <option v-for="option in options" :key="option.value" :value="option.value">
        {{ option.text }}
      </option>
    </select>
    </div>

    <button
      class="mt-4 relative flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg group hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      @click="handleSavePayment">
        Ingresar Pago
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { getFirestore, collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { formatNumber } from '../utils/currencyFormatters.js';


// eslint-disable-next-line vue/no-setup-props-destructure, no-undef
const props = defineProps({
  selectedGoalId: String,
  goalMainCurrency: String
});

const amount = ref('');
const category = ref('');
const currency = ref(props.goalMainCurrency);
const goals = ref([]);
const options = ref([
  { value: 'CLP', text: 'Pesos Chilenos' },
  { value: 'USD', text: 'Dolares' },
  { value: 'COP', text: 'Pesos Colombianos' },
]);

const auth = getAuth();
const db = getFirestore();

// eslint-disable-next-line no-undef
const emit = defineEmits(['paymentSaved']);

const fetchGoals = async () => {
  const user = auth.currentUser;
  if (user) {
    const q = query(collection(db, 'goals'), where('userId', '==', user.uid));
    const querySnapshot = await getDocs(q);
    goals.value = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
};

const handleSavePayment = async () => {
  const user = auth.currentUser;
  const currentDate = Timestamp.now(); // Obtener la fecha actual en formato ISO
  if (user && amount.value && category.value && currency && props.selectedGoalId) {
    await addDoc(collection(db, 'payments'), {
      userId: user.uid,
      amount: parseFloat(amount.value),
      category: category.value,
      goalId: props.selectedGoalId,
      date: currentDate, // Añadir la fecha actual al payment,
      currency: currency.value,
    });

    // Emitir el evento al componente padre en lugar de llamar a fetchPaymentsForGoal
    emit('paymentSaved');

    // Limpiar los campos
    amount.value = '';
    category.value = '';
  }
};

// Computed properties para formatear los montos
const formattedAmount = computed(() => formatNumber(amount.value || 0));

const updateAmount = (event) => {
  const value = event.target.value.replace(/[^0-9]/g, ''); // Eliminar todo excepto números
    amount.value = parseInt(value, 10) || ''; // Actualizar si es un número
  event.target.value = formatNumber(amount.value); // Formatear el valor mostrado
};

onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      fetchGoals();
      // fetchPaymentsForGoal();
    }
  });
});
</script>

