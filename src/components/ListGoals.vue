<template>
  <div v-if="isLoading">
    <LoadingSpinner />
  </div>
  <div v-else>
    <div
        class="grid grid-cols-1 gap-1 mb-16">
        <div class="flex flex-col items-center text-center p-4 bg-gray-100 rounded-lg">
          <span class="text-2xl font-bold flex align-center gap-x-2">
            {{ currencySymbol(currentUserMainCurrency) }} {{ formatNumber(goalsTotalBalance, currentUserMainCurrency) }}
            <span class="inline-flex items-center rounded-md bg-white px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
              {{ currentUserMainCurrency }}
            </span>
          </span>
          <span class="text-sm text-indigo-700">Balance general</span>
        </div>
      </div>
    <h1 class="text-2xl font-semibold	mb-4">Tus tarjetas</h1>
    <div v-if="creditCardGoals.length > 0" class="max-w-4xl mx-auto">
      <ul role="list" class="">
        <li v-for="goal in creditCardGoals" :key="goal.id" class="mb-4">
          <div class="flex items-center justify-between z-2 relative px-4 py-4 bg-white shadow-lg rounded-lg hover:bg-gray-50">
            <router-link :to="`/goal/${goal.id}`" class="flex items-center flex-1">
              <CreditCardIcon class="h-6 w-6" aria-hidden="true" />
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-900">{{ goal.title }}</p>
                <p 
                  v-if="calculateDaysRemaining(goal.validUntil?.toDate()) > 0"
                  class="text-sm text-gray-500">
                  Se factura en {{calculateDaysRemaining(goal.validUntil.toDate()) }}  {{ calculateDaysRemaining(goal.validUntil.toDate()) <= 1 ? 'día' : 'días' }}
                </p>
                <p 
                  v-else-if="goal.type !== 'Tarjeta de crédito' || goal.validUntil === null"
                  class="text-sm text-gray-500">
                  Sin fecha de facturación
                </p>
                <span 
                  v-else
                  class="text-sm text-gray-500 flex items-center gap-x-2">
                  <p>
                    Se ha facturado esta tarjeta
                  </p>
                  <button
                    class="px-4 py-2 text-xs font-medium text-indigo-700 bg-indigo-50 border border-transparent rounded-lg hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    @click.stop.prevent="archiveGoal(goal.id)">
                      Archivar
                  </button>
                </span>
              </div>
              <div class="text-right ml-auto">
                <p class="text-md text-gray-800 font-semibold flex items-center gap-x-2">
                  <ArrowUpIcon class="h-4 w-4 min-h-4 min-w-4 text-red-600" />
                  <span class="flex flex-wrap justify-end gap-x-2">
                    {{currencySymbol(goal.mainCurrency)}} {{ formatNumber(goal.currentBalanceOnAccount, goal.mainCurrency ) }}
                    <span class="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">{{ goal.mainCurrency }}</span>
                  </span>
                </p>
              </div>
            </router-link>
            <button @click="handleDeleteGoal(goal.id)" class="ml-4 text-slate-300 hover:text-red-600"><TrashIcon class="h-4 w-4" aria-hidden="true" /></button>
          </div>
          <div class="w-full -mt-2 z-1 bg-gray-200 rounded-md h-4">
            <div
              class="bg-indigo-600 h-4 rounded-md max-w-full"
              :style="{ width: (goal.currentBalanceOnAccount / goal.availableAmount * 100) + '%' }"
            ></div>
          </div>
        </li>
      </ul>
    </div>
    <p v-else class="my-8 text-gray-400">Aún no tienes tarjeta agregada</p>
    <div v-if="archivedCreditCardGoals.length > 0" class="max-w-4xl mx-auto">
      <p class="my-2 text-gray-400">Tu tarjetas archivadas:</p>
      <ul role="list" class="">
        <li v-for="goal in archivedCreditCardGoals" :key="goal.id" class="mb-4">
          <div class="flex items-center justify-between z-2 relative px-4 py-4 bg-white shadow-lg rounded-lg hover:bg-gray-50">
            <router-link :to="`/goal/${goal.id}`" class="flex items-center flex-1">
              <CreditCardIcon class="h-6 w-6" aria-hidden="true" />
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-900">{{ goal.title }}</p>
              </div>
              <div class="text-right ml-auto">
                <p class="text-md text-gray-800 font-semibold flex items-center gap-x-2">
                  <ArrowUpIcon class="h-4 w-4 min-h-4 min-w-4 text-red-600" />
                  <span class="flex flex-wrap justify-end gap-x-2">
                    {{currencySymbol(goal.mainCurrency)}} {{ formatNumber(goal.currentBalanceOnAccount, goal.mainCurrency ) }}
                    <span class="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">{{ goal.mainCurrency }}</span>
                  </span>
                </p>
              </div>
            </router-link>
            <button @click="handleDeleteGoal(goal.id)" class="ml-4 text-slate-300 hover:text-red-600"><TrashIcon class="h-4 w-4" aria-hidden="true" /></button>
          </div>
        </li>
      </ul>
    </div>
    <h1 class="text-2xl font-semibold	mb-4 mt-16">Tus cuentas bancarias</h1>
    <div v-if="bankAccountGoals.length > 0" class="max-w-4xl mx-auto">
      <ul role="list" class="">
        <li v-for="goal in bankAccountGoals" :key="goal.id" class="mb-4 flex items-center justify-between px-4 py-4 bg-white shadow-lg rounded-lg hover:bg-gray-50">
          <router-link :to="`/goal/${goal.id}`" class="flex items-center flex-1">
            <CurrencyDollarIcon class="h-6 w-6" aria-hidden="true" />
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-900">{{ goal.title }}</p>
            </div>
            <div class="text-right ml-auto">
              <p class="text-md text-gray-800 font-semibold flex items-center gap-x-2">
                <ArrowDownIcon class="h-4 w-4 min-h-4 min-w-4 text-green-600" />
                <span class="flex flex-wrap justify-end gap-x-2">
                  {{currencySymbol(goal.mainCurrency)}} {{ formatNumber(goal.currentBalanceOnAccount, goal.mainCurrency ) }}
                  <span class="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">{{ goal.mainCurrency }}</span>
                </span>
              </p>
            </div>
          </router-link>
          <button @click="handleDeleteGoal(goal.id)" class="ml-4 text-slate-300 hover:text-red-600"><TrashIcon class="h-4 w-4" aria-hidden="true" /></button>
        </li>
      </ul>
    </div>
    <p v-else class="my-8 text-gray-400">Aún no tienes cuenta agregada</p>
    <div class="bg-indigo-600 hover:bg-indigo-800 text-white flex items-center justify-between px-4 py-4 rounded-lg">
      <router-link :to="`/create-goal/`" class="flex items-center flex-1">
        <PlusCircleIcon class="h-6 w-6" aria-hidden="true" />
        <div class="ml-4">
          <p class="text-sm font-medium">Agregar nueva tarjeta o cuenta bancaria</p>
        </div>
      </router-link>
    </div>

    <TransitionRoot :show="showSelectMainCurrencyModal" as="modal">
      <Dialog @close="showSelectMainCurrencyModal = false">
        <DialogOverlay class="fixed inset-0 bg-black/30" />
        <div class="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel class="bg-white p-6 rounded-lg min-w-[300px] max-w-[700px]">
            <DialogTitle>Elige tu moneda principal</DialogTitle>
            <div class="flex flex-col flex-wrap gap-2 mt-4">
              <button
                v-for="option in currencyOptions"
                :key="option.value"
                :class="[
                  'flex items-center px-4 py-2 border rounded-lg transition',
                  selectedMainCurrency === option.value
                    ? 'bg-indigo-500 text-white'
                    : 'bg-gray-200 text-gray-700',
                  'hover:bg-indigo-300 hover:text-white'
                ]"
                @click="selectCurrency(option.value)"
                :disabled="option.disabled"
              >
                <country-flag
                  :country="option.countryCode"
                  rounded
                  class=""
                />
                {{ option.text }}
              </button>
            </div>
            <div class="mt-6 flex justify-end">
              <button
                class="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                @click="saveMainCurrency"
              >
                Guardar
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </TransitionRoot>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { Dialog, DialogOverlay, DialogPanel, DialogTitle, TransitionRoot } from '@headlessui/vue'
import CountryFlag from 'vue-country-flag-next';
import { ArrowUpIcon,ArrowDownIcon, CurrencyDollarIcon, CreditCardIcon, TrashIcon, PlusCircleIcon } from '@heroicons/vue/24/outline';
import { getFirestore, collection, getDocs, getDoc, updateDoc, query, where, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import {fetchGoals} from '@/utils/business/goals.js'
import { fetchUser } from '@/utils/business/users.js';
import LoadingSpinner from '../components/LoadingSpinner.vue'
import { formatNumber } from '../utils/currencyFormatters.js';
import { convertToMainCurrency } from '../utils/currencyConverter';


const auth = getAuth();
const db = getFirestore();

const userDocRef = ref(null)

const isLoading = ref('true')
const showSelectMainCurrencyModal = ref(false)

const currentUser = ref(null);
const currentUserMainCurrency = ref('CLP');
const currencyOptions = ref([
  { value: 'CLP', text: 'Pesos Chilenos', countryCode: 'CL' },
  { value: 'COP', text: 'Pesos Colombianos', countryCode: 'CO' },
  { value: 'EUR', text: 'Euros', countryCode: 'EU' },
  { value: 'USD', text: 'Dólares', countryCode: 'US' }
]);
const selectedMainCurrency = ref('CLP');
const goals = ref([]);
const goalsTotalBalance = ref(0);

const creditCardGoals = computed(() => goals.value.filter(goal => goal.type === 'Tarjeta de crédito' && goal.isArchived !== true));
const archivedCreditCardGoals = computed(() => goals.value.filter(goal => goal.type === 'Tarjeta de crédito' && goal.isArchived === true));
const bankAccountGoals = computed(() => goals.value.filter(goal => goal.type === 'Cuenta bancaria'));


onMounted(() => {
  onAuthStateChanged(auth, async user => {
    if (!user) return
    await recalculateTotals()
    // referencia al documento de usuario
    userDocRef.value = doc(db, 'users', user.uid)
    const snap = await getDoc(userDocRef.value)
    if (!snap.exists() || !snap.data().mainCurrency) {
      // si no tiene mainCurrency, abrimos el modal
      showSelectMainCurrencyModal.value = true
    }
  })
})

const recalculateTotals = async () => {
  isLoading.value = true;
  // 1) Traer metas y usuario
  goals.value = await fetchGoals();
  currentUser.value = await fetchUser();
  currentUserMainCurrency.value = currentUser.value.mainCurrency || 'CLP';
  const userCurrency = currentUserMainCurrency.value;

  // 2) Filtrar grupos
  const creditGoals = goals.value.filter(
    g => g.type === 'Tarjeta de crédito' && !g.isArchived
  );
  const bankGoals = goals.value.filter(
    g => g.type === 'Cuenta bancaria'
  );

  // 3) Convertir balances al mainCurrency del usuario
  const creditAmounts = await Promise.all(
    creditGoals.map(g =>
      convertToMainCurrency(
        g.currentBalanceOnAccount,
        g.mainCurrency,
        userCurrency
      )
    )
  );
  const bankAmounts = await Promise.all(
    bankGoals.map(g =>
      convertToMainCurrency(
        g.currentBalanceOnAccount,
        g.mainCurrency,
        userCurrency
      )
    )
  );

  // 4) Sumar y calcular diferencia
  const creditTotal = creditAmounts.reduce((sum, v) => sum + v, 0);
  const bankTotal   = bankAmounts.reduce((sum, v) => sum + v, 0);
  goalsTotalBalance.value = bankTotal - creditTotal;
  isLoading.value = false;
};

const handleDeleteGoal = async (goalId) => {
  const user = auth.currentUser;
  if (user) {
    // Primero, elimina todos los pagos asociados a este goalId
    const paymentsQuery = query(collection(db, 'payments'), where('goalId', '==', goalId), where('userId', '==', user.uid));
    const paymentsSnapshot = await getDocs(paymentsQuery);
    
    const batch = writeBatch(db);
    
    paymentsSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    // Luego, elimina el presupuesto
    await deleteDoc(doc(db, 'goals', goalId));

    // Actualizar la lista de presupuestos después de eliminar
    goals.value = await recalculateTotals()();
  }
};

const archiveGoal = async (goalId) => {
  try {
    const goalRef = doc(db, 'goals', goalId)
    await updateDoc(goalRef, { isArchived: true })
    console.log(`Goal ${goalId} archivado correctamente`)
    // aquí podrías emitir un evento o actualizar un state local
    // Actualizar la lista de presupuestos después de eliminar
    goals.value = await recalculateTotals()();
  } catch (error) {
    console.error('Error archivando goal:', error)
  }
}

const calculateDaysRemaining = (targetDate) => {
  const today = new Date();
  const differenceInMillis = targetDate - today;
  return Math.ceil(differenceInMillis / (1000 * 60 * 60 * 24));
}

const currencySymbol = (currency) => {
  const map = {
    EUR: '€',
    USD: '$',
    CLP: '$',
    COP: '$',
  };
  return map[currency] || currency;
};

const selectCurrency = (currency) => {
  selectedMainCurrency.value = currency;
};
async function saveMainCurrency() {
  if (!userDocRef.value) return
  try {
    await updateDoc(userDocRef.value, {
      mainCurrency: selectedMainCurrency.value
    })
    showSelectMainCurrencyModal.value = false
    recalculateTotals()
  } catch (err) {
    console.error('Error guardando mainCurrency:', err)
  }
}

</script>

<style scoped>

</style>