<template>
  <div>
    <h2>Registrar Pago</h2>
    <input v-model="amount" type="number" placeholder="Ingresa el monto" />
    <input v-model="category" type="text" placeholder="Ingresa la categoría" />
    <button @click="handleSavePayment">Guardar Pago</button>

    <h2>Tus Pagos</h2>
    <table v-if="payments.length > 0 && user">
      <thead>
        <tr>
          <th>Monto</th>
          <th>Categoría</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="payment in payments" :key="payment.id">
          <td>{{ payment.amount }}</td>
          <td>{{ payment.category }}</td>
        </tr>
      </tbody>
    </table>
    <p v-else>No tienes pagos registrados.</p>
  </div>
</template>

<script>
import { getFirestore, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { mapGetters } from 'vuex';

export default {
  data() {
    return {
      payments: [],
      amount: '',
      category: '',
    };
  },
  computed: {
    ...mapGetters(['user']),
  },
  methods: {
    async fetchPayments(user) {
      const db = getFirestore();
      if (user) {
        const q = query(collection(db, 'payments'), where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        const paymentsData = [];
        querySnapshot.forEach((doc) => {
          paymentsData.push({ id: doc.id, ...doc.data() });
        });
        this.payments = paymentsData;
      }
    },
    async handleSavePayment() {
      if (this.amount && this.category) {
        const auth = getAuth();
        const db = getFirestore();
        const user = auth.currentUser;
        if (user) {
          await addDoc(collection(db, 'payments'), {
            userId: user.uid,
            amount: parseFloat(this.amount),
            category: this.category,
          });

          // Actualizar la lista de pagos después de agregar uno nuevo
          await this.fetchPayments(user);

          // Limpiar los campos
          this.amount = '';
          this.category = '';
        }
      }
    },
  },
  mounted() {
    const auth = getAuth();
    onAuthStateChanged(auth, (user) => {
      if (user) {
        this.fetchPayments(user);
      }
    });
  },
};
</script>
