<template>
  <div>
    <!-- <h2>Registrar Pago</h2>
    <input v-model="amount" type="number" placeholder="Ingresa el monto" />
    <input v-model="category" type="text" placeholder="Ingresa la categoría" />

    <select v-model="selectedGoalId">
      <option disabled value="">Selecciona un Goal</option>
      <option v-for="goal in goals" :key="goal.id" :value="goal.id">
        {{ goal.title }}
      </option>
    </select>

    <button @click="handleSavePayment">Guardar Pago</button>

    <h2>Todos tus Pagos</h2>
    <table v-if="payments.length > 0">
      <thead>
        <tr>
          <th>Monto</th>
          <th>Categoría</th>
          <th>Goal</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="payment in payments" :key="payment.id">
          <td>{{ payment.amount }}</td>
          <td>{{ payment.category }}</td>
          <td>{{ getGoalTitle(payment.goalId) }}</td>
        </tr>
      </tbody>
    </table>
    <p v-else>No tienes pagos registrados.</p> -->
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { getFirestore, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

export default {
  setup() {
    const payments = ref([]);
    const amount = ref('');
    const category = ref('');
    const goals = ref([]);
    const selectedGoalId = ref('');

    const auth = getAuth();
    const db = getFirestore();

    const fetchGoals = async () => {
      const user = auth.currentUser;
      if (user) {
        const q = query(collection(db, 'goals'), where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        goals.value = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }
    };

    const fetchPayments = async () => {
      const user = auth.currentUser;
      if (user) {
        const q = query(collection(db, 'payments'), where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        payments.value = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }
    };

    const handleSavePayment = async () => {
      const user = auth.currentUser;
      if (user && amount.value && category.value && selectedGoalId.value) {
        await addDoc(collection(db, 'payments'), {
          userId: user.uid,
          amount: parseFloat(amount.value),
          category: category.value,
          goalId: selectedGoalId.value,
        });

        // Actualizar la lista de pagos después de agregar uno nuevo
        fetchPayments();

        // Limpiar los campos
        amount.value = '';
        category.value = '';
        selectedGoalId.value = '';
      }
    };

    const getGoalTitle = (goalId) => {
      const goal = goals.value.find(g => g.id === goalId);
      return goal ? goal.title : 'Sin objetivo';
    };

    onMounted(() => {
      onAuthStateChanged(auth, (user) => {
        if (user) {
          fetchGoals();
          fetchPayments();
        }
      });
    });

    return {
      payments,
      amount,
      category,
      goals,
      selectedGoalId,
      handleSavePayment,
      getGoalTitle,
    };
  },
};
</script>
