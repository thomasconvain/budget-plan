<template>
  <div v-if="isLoading">
    <LoadingSpinner />
  </div>
  <div v-else>
    <div class="relative mb-12">
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div class="flex items-center gap-3">
          <div class="flex items-center justify-center h-10 w-10 rounded-xl bg-gray-900 shrink-0">
            <CurrencyDollarIcon class="h-5 w-5 text-white" aria-hidden="true" />
          </div>
          <div class="flex-1">
            <p class="text-xs text-gray-400 font-medium">Balance general</p>
            <p class="text-2xl font-bold text-gray-900 mt-0.5">
              {{ currencySymbol(currentUserMainCurrency) }} {{ formatNumber(goalsTotalBalance, currentUserMainCurrency) }}
              <span class="text-xs font-medium text-gray-400 ml-1">{{ currentUserMainCurrency }}</span>
            </p>
          </div>
        </div>
      </div>
    </div>

    <PendingSharedExpenses
      v-if="pendingExpenses.length"
      class="mb-8"
      :expenses="pendingExpenses"
      @updated="refreshExpenses"
    />

    <h1 class="text-2xl font-semibold mb-4">Tus tarjetas</h1>
    <div v-if="creditCardGoals.length > 0" class="max-w-4xl mx-auto space-y-3">
      <div
        v-for="goal in creditCardGoals"
        :key="goal.id"
        class="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 active:scale-[0.98] transition-transform cursor-pointer"
        @click="$router.push(`/goal/${goal.id}`)">
        <div class="flex items-start gap-3">
          <div class="flex items-center justify-center h-10 w-10 rounded-xl bg-gray-900 shrink-0">
            <CreditCardIcon class="h-5 w-5 text-white" aria-hidden="true" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between">
              <p class="text-sm font-semibold text-gray-900 truncate">{{ goal.title }}</p>
              <button @click.stop="handleDeleteGoal(goal.id)" class="p-1.5 rounded-full border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-300 hover:bg-red-50 transition ml-2 shrink-0">
                <TrashIcon class="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
            <p class="text-lg font-bold text-gray-900 mt-0.5">
              {{ currencySymbol(goal.mainCurrency) }} {{ formatNumber(goal.currentBalanceOnAccount, goal.mainCurrency) }}
              <span class="text-xs font-normal text-gray-400">/ {{ currencySymbol(goal.mainCurrency) }} {{ formatNumber(goal.availableAmount, goal.mainCurrency) }}</span>
            </p>
            <!-- Progress bar -->
            <div class="mt-2 w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-500"
                :class="(goal.currentBalanceOnAccount / goal.availableAmount) > 0.85 ? 'bg-red-500' : (goal.currentBalanceOnAccount / goal.availableAmount) > 0.6 ? 'bg-amber-500' : 'bg-gray-900'"
                :style="{ width: Math.min(goal.currentBalanceOnAccount / goal.availableAmount * 100, 100) + '%' }"
              ></div>
            </div>
            <div class="flex items-center justify-between mt-2">
              <p class="text-xs text-gray-400">
                <template v-if="goal.billingDay">
                  Factura día {{ goal.billingDay }}
                  <template v-if="goal.validUntil && calculateDaysRemaining(goal.validUntil.toDate()) > 0">
                    · {{ calculateDaysRemaining(goal.validUntil.toDate()) }}d restantes
                  </template>
                </template>
                <template v-else-if="goal.validUntil && calculateDaysRemaining(goal.validUntil?.toDate()) > 0">
                  Factura en {{ calculateDaysRemaining(goal.validUntil.toDate()) }} {{ calculateDaysRemaining(goal.validUntil.toDate()) <= 1 ? 'día' : 'días' }}
                </template>
                <template v-else>Sin fecha de facturación</template>
              </p>
              <p class="text-xs font-medium"
                 :class="(goal.currentBalanceOnAccount / goal.availableAmount) > 0.85 ? 'text-red-500' : 'text-gray-400'">
                {{ Math.round(goal.currentBalanceOnAccount / goal.availableAmount * 100) }}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    <p v-else class="my-8 text-gray-400">Aún no tienes tarjeta agregada</p>

    <!-- Archived credit cards -->
    <div v-if="archivedGoals.length > 0" class="max-w-4xl mx-auto mt-6">
      <p class="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Facturaciones anteriores</p>
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">
        <div
          v-for="goal in archivedGoals"
          :key="goal.id"
          class="flex items-center gap-3 px-4 py-3 first:rounded-t-2xl last:rounded-b-2xl hover:bg-gray-50 transition cursor-pointer"
          @click="$router.push(`/goal/${goal.id}`)">
          <div class="flex items-center justify-center h-8 w-8 rounded-lg bg-gray-100 shrink-0">
            <CreditCardIcon class="h-4 w-4 text-gray-400" aria-hidden="true" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-700 truncate">{{ goal.title }}</p>
            <p v-if="goal.validUntil" class="text-xs text-gray-400 capitalize">{{ goal.validUntil.toDate().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }) }}</p>
          </div>
          <div class="text-right shrink-0">
            <p class="text-sm font-semibold text-gray-700">
              {{ currencySymbol(goal.mainCurrency) }} {{ formatNumber(goal.currentBalanceOnAccount, goal.mainCurrency) }}
            </p>
          </div>
          <button @click.stop="handleDeleteGoal(goal.id)" class="p-1 rounded-full border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-300 hover:bg-red-50 transition shrink-0">
            <TrashIcon class="h-3 w-3" aria-hidden="true" />
          </button>
        </div>
      </div>
      <div v-if="hasMoreArchivedGoals" class="flex items-center gap-3 mt-3">
        <div class="flex-1 h-px bg-gray-200"></div>
        <button
          @click="loadArchivedGoals()"
          :disabled="loadingMoreArchived"
          class="px-4 py-1.5 text-xs font-medium text-gray-400 hover:text-gray-600 border border-gray-200 hover:border-gray-300 rounded-full transition disabled:opacity-50">
          {{ loadingMoreArchived ? 'Cargando...' : 'Ver anteriores' }}
        </button>
        <div class="flex-1 h-px bg-gray-200"></div>
      </div>
    </div>

    <h1 class="text-2xl font-semibold mb-4 mt-16">Tus cuentas bancarias</h1>
    <div v-if="bankAccountGoals.length > 0" class="max-w-4xl mx-auto space-y-3">
      <div
        v-for="goal in bankAccountGoals"
        :key="goal.id"
        class="flex items-center gap-3 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 active:scale-[0.98] transition-transform cursor-pointer"
        @click="$router.push(`/goal/${goal.id}`)">
        <div class="flex items-center justify-center h-10 w-10 rounded-xl bg-emerald-50 shrink-0">
          <CurrencyDollarIcon class="h-5 w-5 text-emerald-600" aria-hidden="true" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold text-gray-900 truncate">{{ goal.title }}</p>
          <p class="text-xs text-gray-400 mt-0.5">Cuenta bancaria</p>
        </div>
        <div class="text-right shrink-0">
          <p class="text-lg font-bold text-gray-900">
            {{ currencySymbol(goal.mainCurrency) }} {{ formatNumber(goal.currentBalanceOnAccount, goal.mainCurrency) }}
          </p>
          <p class="text-xs text-gray-400">{{ goal.mainCurrency }}</p>
        </div>
        <button @click.stop="handleDeleteGoal(goal.id)" class="p-1.5 rounded-full border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-300 hover:bg-red-50 transition shrink-0">
          <TrashIcon class="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
    <p v-else class="my-8 text-gray-400">Aún no tienes cuenta agregada</p>

    <router-link
      to="/create-goal"
      class="mt-6 flex items-center gap-3 bg-gray-900 hover:bg-gray-800 text-white p-4 rounded-2xl transition active:scale-[0.98]">
      <div class="flex items-center justify-center h-10 w-10 rounded-xl bg-white/10 shrink-0">
        <PlusCircleIcon class="h-5 w-5" aria-hidden="true" />
      </div>
      <p class="text-sm font-medium">Agregar nueva tarjeta o cuenta</p>
    </router-link>

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
                    ? 'bg-gray-500 text-white'
                    : 'bg-gray-200 text-gray-700',
                  'hover:bg-gray-300 hover:text-white'
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
                class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                @click="saveMainCurrency"
              >
                Guardar
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </TransitionRoot>

    <!-- Modal de migración: pedir día de facturación a tarjetas existentes -->
    <TransitionRoot :show="showMigrationModal" as="modal">
      <Dialog @close="() => {}">
        <DialogOverlay class="fixed inset-0 bg-black/30" />
        <div class="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel class="bg-white p-6 rounded-lg min-w-[300px] max-w-[500px]">
            <DialogTitle class="text-lg font-semibold">Configura tu tarjeta</DialogTitle>
            <p class="text-sm text-gray-500 mt-2">
              Tu tarjeta <strong>{{ migrationGoal?.title }}</strong> necesita un día de facturación para renovarse automáticamente cada mes.
            </p>
            <div class="mt-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">Día de facturación</label>
              <select
                v-model.number="migrationBillingDay"
                class="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm">
                <option v-for="day in 31" :key="day" :value="day">{{ day }}</option>
              </select>
            </div>
            <div class="mt-6 flex justify-end">
              <button
                class="px-4 py-2 bg-gray-800 text-white text-sm rounded-lg hover:bg-gray-700"
                @click="saveMigration">
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
import { CurrencyDollarIcon, CreditCardIcon, TrashIcon, PlusCircleIcon } from '@heroicons/vue/24/outline';
import { getFirestore, Timestamp, collection, getDocs, getDoc, updateDoc, query, where, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import {fetchGoals, fetchArchivedGoals} from '@/utils/business/goals.js'
import { fetchUser } from '@/utils/business/users.js';
import LoadingSpinner from '../components/LoadingSpinner.vue'
import PendingSharedExpenses from '@/components/contacts/PendingSharedExpenses.vue';
import { fetchPendingSharedExpenses } from '@/utils/business/sharedExpenses';
import { formatNumber } from '../utils/currencyFormatters.js';
import { convertToMainCurrency } from '../utils/currencyConverter';
import { calculateBillingPeriod } from '@/utils/billingPeriod';


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
const pendingExpenses = ref([]);

const refreshExpenses = async () => {
  pendingExpenses.value = await fetchPendingSharedExpenses();
};

const creditCardGoals = computed(() => goals.value.filter(goal => goal.type === 'Tarjeta de crédito' && goal.isArchived !== true));
const bankAccountGoals = computed(() => goals.value.filter(goal => goal.type === 'Cuenta bancaria'));

// Paginación real de tarjetas archivadas desde Firestore
const archivedGoals = ref([]);
const archivedLastDoc = ref(null);
const hasMoreArchivedGoals = ref(false);
const loadingMoreArchived = ref(false);

const loadArchivedGoals = async (reset = false) => {
  if (reset) {
    archivedGoals.value = [];
    archivedLastDoc.value = null;
  }
  loadingMoreArchived.value = true;
  const result = await fetchArchivedGoals(3, archivedLastDoc.value);
  archivedGoals.value = [...archivedGoals.value, ...result.goals];
  archivedLastDoc.value = result.lastDoc;
  hasMoreArchivedGoals.value = result.hasMore;
  loadingMoreArchived.value = false;
};

// Migración: tarjetas sin billingDay
const showMigrationModal = ref(false);
const migrationGoal = ref(null);
const migrationBillingDay = ref(15);
const goalsToMigrate = ref([]);

const checkMigration = () => {
  goalsToMigrate.value = creditCardGoals.value.filter(g => !g.billingDay);
  if (goalsToMigrate.value.length > 0) {
    migrationGoal.value = goalsToMigrate.value[0];
    migrationBillingDay.value = 15;
    showMigrationModal.value = true;
  }
};

const saveMigration = async () => {
  if (!migrationGoal.value) return;

  const { validFrom, validUntil } = calculateBillingPeriod(migrationBillingDay.value);

  await updateDoc(doc(db, 'goals', migrationGoal.value.id), {
    billingDay: migrationBillingDay.value,
    isRecurring: true,
    isArchived: false,
    validFrom: Timestamp.fromDate(validFrom),
    validUntil: Timestamp.fromDate(validUntil),
  });

  // Quitar de la lista de pendientes
  goalsToMigrate.value.shift();

  if (goalsToMigrate.value.length > 0) {
    // Migrar la siguiente tarjeta
    migrationGoal.value = goalsToMigrate.value[0];
    migrationBillingDay.value = 15;
  } else {
    showMigrationModal.value = false;
    migrationGoal.value = null;
    await recalculateTotals();
  }
};

onMounted(() => {
  onAuthStateChanged(auth, async user => {
    if (!user) return
    await Promise.all([recalculateTotals(), refreshExpenses()])
    // referencia al documento de usuario
    userDocRef.value = doc(db, 'users', user.uid)
    const snap = await getDoc(userDocRef.value)
    if (!snap.exists() || !snap.data().mainCurrency) {
      showSelectMainCurrencyModal.value = true
    }
    // Verificar si hay tarjetas que necesitan migración
    checkMigration()
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

  // Cargar las primeras 3 tarjetas archivadas
  await loadArchivedGoals(true);

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