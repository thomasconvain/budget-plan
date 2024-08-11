<template>
  <div>
    <h2>Crear nueva meta</h2>
    <input v-model="title" type="text" placeholder="Título" />
    <textarea v-model="description" placeholder="Descripción"></textarea>
    <input v-model="availableAmount" type="number" placeholder="Monto disponible" />
    <input v-model="savingGoalAmount" type="number" placeholder="Monto objetivo de ahorro" />
    <input v-model="validFrom" type="date" placeholder="Válido desde" />
    <input v-model="validUntil" type="date" placeholder="Válido hasta" />
    <button @click="handleSaveGoal">Guardar meta</button>

    <h2>Tus Goals</h2>
    <ul v-if="goals.length > 0">
      <li v-for="goal in goals" :key="goal.id">
        <router-link :to="`/goal/${goal.id}`" class="text-blue-500 underline">
          {{ goal.title }}: {{ goal.savingGoalAmount }} (desde {{ goal.validFrom }} hasta {{ goal.validUntil }})
        </router-link>
      </li>
    </ul>
    <p v-else>No tienes metas registradas.</p>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { getFirestore, collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

export default {
  setup() {
    const title = ref('');
    const description = ref('');
    const availableAmount = ref('');
    const savingGoalAmount = ref('');
    const validFrom = ref('');
    const validUntil = ref('');
    const goals = ref([]);

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

    const handleSaveGoal = async () => {
      const user = auth.currentUser;
      if (user && title.value && savingGoalAmount.value && validFrom.value && validUntil.value) {
        await addDoc(collection(db, 'goals'), {
          title: title.value,
          description: description.value,
          userId: user.uid,
          availableAmount: parseFloat(availableAmount.value),
          savingGoalAmount: parseFloat(savingGoalAmount.value),
          validFrom: validFrom.value,
          validUntil: validUntil.value,
        });

        // Actualizar la lista de goals después de agregar uno nuevo
        fetchGoals();

        // Limpiar los campos del formulario
        title.value = '';
        description.value = '';
        availableAmount.value = '';
        savingGoalAmount.value = '';
        validFrom.value = '';
        validUntil.value = '';
      }
    };

    onMounted(() => {
      onAuthStateChanged(auth, (user) => {
        if (user) {
          fetchGoals();
        }
      });
    });

    return {
      title,
      description,
      availableAmount,
      savingGoalAmount,
      validFrom,
      validUntil,
      goals,
      handleSaveGoal,
    };
  },
};
</script>
