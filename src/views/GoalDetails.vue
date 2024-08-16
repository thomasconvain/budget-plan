<template>
  <div v-if="isLoading">
    <p>Cargando información del goal...</p>
  </div>
  <div v-else>
    <h2>Detalles del Goal: {{ goal.title }}</h2>
    <p>{{ goal.description }}</p>
    <p>Monto Disponible: {{ goal.availableAmount }}</p>
    <p>Monto Objetivo: {{ goal.savingGoalAmount }}</p>
    <p>Válido Desde: {{ goal.validFrom }}</p>
    <p>Válido Hasta: {{ goal.validUntil }}</p>

    <UserPaymentsList
      :selectedGoalId="route.params.goalId" 
      @paymentSaved="onPaymentSaved" />


    <h3>Pagos Asociados</h3>
    <table v-if="payments.length > 0">
      <thead>
        <tr>
          <th>Monto</th>
          <th>Categoría</th>
          <th>Fecha</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="payment in payments" :key="payment.id">
          <td>{{ payment.amount }}</td>
          <td>{{ payment.category }}</td>
          <td>{{ formatDate(payment.date) }}</td>
        </tr>
      </tbody>
    </table>
    <p v-else>No hay pagos asociados a este goal.</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useRoute } from 'vue-router';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import UserPaymentsList from '../components/UserPaymentsList.vue';
import {formatDate} from '../utils/dateFormatter.js'

const goal = ref(null);
const payments = ref([]);
const isLoading = ref(true); // Estado de carga
const route = useRoute();
const db = getFirestore();
const auth = getAuth();

const fetchGoalDetails = async (goalId) => {
  try {
    const goalDocRef = doc(db, 'goals', goalId);
    const goalDoc = await getDoc(goalDocRef);
    if (goalDoc.exists()) {
      goal.value = { id: goalDoc.id, ...goalDoc.data() };
    } else {
      throw new Error('Goal not found');
    }
  } catch (error) {
    console.error('Error fetching goal details:', error);
  }
};

const onPaymentSaved = () => {
  fetchPaymentsForGoal();
};

const fetchPaymentsForGoal = async () => {
  const user = auth.currentUser;
  try {
    const q = query(collection(db, 'payments'), where('goalId', '==', route.params.goalId), where('userId', '==', user.uid));
    const querySnapshot = await getDocs(q);
    payments.value = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching payments for goal:', error);
  }
};

onMounted(async () => {
  const goalId = route.params.goalId;
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        await fetchGoalDetails(goalId);
        await fetchPaymentsForGoal(goalId);
      } catch (error) {
        console.error('Error during onMounted:', error);
      } finally {
        isLoading.value = false; // Desactivar estado de carga cuando todo esté cargado
      }
    } else {
      console.error('User is not authenticated');
    }
  });
});
</script>

