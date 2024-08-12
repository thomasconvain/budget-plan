<template>
  <div>
    <h2>Registrar Pago</h2>
    <input v-model="amount" type="number" placeholder="Ingresa el monto" />
    <input v-model="category" type="text" placeholder="Ingresa la categoría" />

    <!-- <select v-model="selectedGoalId">
      <option disabled value="">Selecciona un Goal</option>
      <option v-for="goal in goals" :key="goal.id" :value="goal.id">
        {{ goal.title }}
      </option>
    </select> -->

    <button @click="handleSavePayment">Guardar Pago</button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getFirestore, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

// eslint-disable-next-line vue/no-setup-props-destructure, no-undef
const props = defineProps({
  selectedGoalId: String,
});

const amount = ref('');
const category = ref('');
const goals = ref([]);
// const payments = ref([]); 


const auth = getAuth();
const db = getFirestore();

// Definir los eventos que el componente puede emitir
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

// const fetchPayments = async () => {
//   const user = auth.currentUser;
//   if (user) {
//     const q = query(collection(db, 'payments'), where('userId', '==', user.uid));
//     const querySnapshot = await getDocs(q);
//     payments.value = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
//   }
// };

// const fetchPaymentsForGoal = async () => {
//   const user = auth.currentUser;
//   try {
//     const q = query(collection(db, 'payments'), where('goalId', '==', props.selectedGoalId), where('userId', '==', user.uid));
//     const querySnapshot = await getDocs(q);
//     payments.value = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
//   } catch (error) {
//     console.error('Error fetching payments for goal:', error);
//   }
// };

const handleSavePayment = async () => {
  const user = auth.currentUser;
  if (user && amount.value && category.value && props.selectedGoalId) {
    await addDoc(collection(db, 'payments'), {
      userId: user.uid,
      amount: parseFloat(amount.value),
      category: category.value,
      goalId: props.selectedGoalId,
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

