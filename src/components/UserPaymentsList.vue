<template>
  <div>
    <h1 class="text-2xl font-semibold	mb-4">Ingresar nuevo pago</h1>
    <div class="my-1 flex gap-1 flex-wrap sm:flex-nowrap">
      <select
        v-model="currency"
        class="block w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
        <option v-for="option in options" :key="option.value" :value="option.value">
          {{ option.text }}
        </option>
      </select>
      <CurrencyInput
        v-if="currency == 'CLP'"
        v-model="amount"
        :options="{ currency: 'CLP'
         }"
      />
      <CurrencyInput
        v-if="currency == 'COP'"
        v-model="amount"
        :options="{ currency: 'COP'
         }"
      />
      <CurrencyInput
        v-if="currency == 'USD'"
        v-model="amount"
        :options="{ currency: 'USD'
         }"
      />
      <input
        v-model="category"
        class="block w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        type="text"
        placeholder="Ingresa la categoría" />
    </div>

    <button
      class="mt-4 relative flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg group hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      @click="handleSavePayment">
        Ingresar Pago {{ currency }}
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getFirestore, collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import CurrencyInput from './CurrencyInput.vue';


// eslint-disable-next-line vue/no-setup-props-destructure, no-undef
const props = defineProps({
  selectedGoalId: String,
  goalMainCurrency: String
});

const amount = ref(null);
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



onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      fetchGoals();
      // fetchPaymentsForGoal();
    }
  });
});
</script>

