<template>
  <div class="pt-6">
    <h1 class="text-2xl font-semibold	mb-4">Tus metas</h1>
    <div v-if="goals.length > 0" class="max-w-4xl mx-auto bg-white shadow-lg rounded-lg">
      <ul role="list" class="divide-y divide-gray-200">
        <li v-for="goal in goals" :key="goal.id">
          <router-link :to="`/goal/${goal.id}`" class="flex items-center px-4 py-4 hover:bg-gray-50 rounded-lg">
            <!-- <img class="w-12 h-12 rounded-full" :src="user.image" :alt="user.name"> -->
            <CurrencyDollarIcon class="h-6 w-6" aria-hidden="true" />
            <div class="ml-4 flex-1">
              <p class="text-sm font-medium text-gray-900">{{ goal.title }}</p>
              <p class="text-sm text-gray-500">{{ goal.description }}</p>
            </div>
            <div class="text-right">
              <p class="text-sm text-gray-500">{{ goal.validUntil }}</p>
              <p class="text-sm text-gray-500">
              <!-- <span v-if="user.status === 'online'" class="text-green-500 flex items-center">
                <svg class="w-2.5 h-2.5 fill-current mr-1" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3"></circle></svg>
                Online
              </span> -->
              <!-- <span v-else>Last seen {{ user.lastSeen }}</span> -->
              </p>
            </div>
          </router-link>
        </li>
      </ul>
    </div>
    <p v-else>No tienes metas registradas.</p>

    <h2>Crear nueva meta</h2>
    <input v-model="title" type="text" placeholder="Título" />
    <textarea v-model="description" placeholder="Descripción"></textarea>
    <input v-model="availableAmount" type="number" placeholder="Monto disponible" />
    <input v-model="savingGoalAmount" type="number" placeholder="Monto objetivo de ahorro" />
    <input v-model="validFrom" type="date" placeholder="Válido desde" />
    <input v-model="validUntil" type="date" placeholder="Válido hasta" />
    <button @click="handleSaveGoal">Guardar meta</button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getFirestore, collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { CurrencyDollarIcon } from '@heroicons/vue/24/outline';

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
</script>

