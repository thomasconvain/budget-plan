<template>
  <div>
    <h1 class="text-2xl font-semibold	mb-4">Ingresar nuevo movimiento</h1>
    <div class="my-1 flex gap-1 flex-wrap sm:flex-nowrap">
      <CurrencyInput
        class="sm:w-1/2 w-full"
        v-model.lazy="amount"
        v-model:currency="currency"
        :options="{
          autoDecimalDigits: false,
          currency: currency,
          currencyDisplay: 'hidden',
        }"
        :currencyOptions="options"
      />
      <Listbox as="div" class="grow" v-model="category">
        <div class="relative">
          <ListboxButton class="relative w-full cursor-default rounded-md bg-white py-2 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 sm:text-sm sm:leading-6">
            <span class="flex items-center">
              <component :is="getIconComponent(category.icon)" class="w-5 h-5" />
              <span class="ml-3 block truncate">{{ category.name }}</span>
            </span>
            <span class="pointer-events-none absolute inset-y-0 right-0 ml-3 flex items-center pr-2">
              <ChevronUpDownIcon class="h-5 w-5 text-gray-400" aria-hidden="true" />
            </span>
          </ListboxButton>
          <transition leave-active-class="transition ease-in duration-100" leave-from-class="opacity-100" leave-to-class="opacity-0">
            <ListboxOptions class="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              <ListboxOption as="template" v-for="category in availableCategories" :key="category.id" :value="category" v-slot="{ active, selected }">
                <li :class="[active ? 'bg-gray-100 text-gray-500' : 'text-gray-900', 'relative cursor-default select-none py-2 pl-3 pr-9']">
                  <div class="flex items-center">
                    <component :is="getIconComponent(category.icon)" class="w-5 h-5" />
                    <span :class="[selected ? 'font-semibold' : 'font-normal', 'ml-3 block truncate']">{{ category.name }}</span>
                  </div>

                  <span v-if="selected" :class="[active ? 'text-gray-500' : 'text-gray-900', 'absolute inset-y-0 right-0 flex items-center pr-4']">
                    <CheckIcon class="h-5 w-5" aria-hidden="true" />
                  </span>
                </li>
              </ListboxOption>
            </ListboxOptions>
          </transition>
        </div>
      </Listbox>
    </div>

    <button
      class="mt-4 relative flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-gray-800 border border-transparent rounded-lg group hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
      @click="handleSavePayment">
        Ingresar
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/vue'
// eslint-disable-next-line no-unused-vars
import { CheckIcon, ChevronUpDownIcon, GlobeAmericasIcon } from '@heroicons/vue/20/solid'
import * as OutlineIcons from '@heroicons/vue/24/outline';
import { getFirestore, collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import CurrencyInput from './CurrencyInput.vue';
import { deriveKey, encrypt } from '@/services/encryption';


// eslint-disable-next-line vue/no-setup-props-destructure, no-undef
const props = defineProps({
  selectedGoalId: String,
  goalMainCurrency: String
});

const amount = ref(null);
const currency = ref(props.goalMainCurrency);
const goals = ref([]);
const availableCategories = ref([]);
// eslint-disable-next-line vue/no-ref-as-operand
const category = ref({});
const options = ref([
  { value: 'CLP', text: 'Pesos Chilenos' },
  { value: 'USD', text: 'Dolares' },
  { value: 'COP', text: 'Pesos Colombianos' },
  { value: 'EUR', text: 'Euros' },
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

const fetchCategories = async () => {
  const user = auth.currentUser;
  if (user) {
    const q = query(collection(db, 'categories'));
    const querySnapshot = await getDocs(q);
    availableCategories.value = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data
      };
    });
    category.value = availableCategories.value[0];
  }
}

const getIconComponent = (iconName) => {
  const Icon = OutlineIcons[iconName];
  if (!Icon) {
    console.warn(`Icono "${iconName}" no encontrado en @heroicons/vue/24/outline`);
    return null;
  }
  return Icon;
};

const handleSavePayment = async () => {
  const user = auth.currentUser;
  const currentDate = Timestamp.now();

  if (!user || !amount.value || !currency.value || !props.selectedGoalId) return;

  const key = deriveKey(user.uid);
  const encryptedCategory = encrypt(category.value.name, key);
  const encryptedIcon = encrypt(category.value.icon, key);
  const parsedAmount = parseFloat(amount.value);

  const isAbono = category.value.name === 'Abono a cuenta';
  const finalAmount = isAbono ? -Math.abs(parsedAmount) : parsedAmount;
  const encryptedAmount = encrypt(finalAmount.toString(), key);

  // Emitir el evento inmediatamente para actualizar la UI con toda la información necesaria
  emit('paymentSaved', finalAmount, currency.value, {
    name: category.value.name,
    icon: category.value.icon
  });
  amount.value = '';

  // Realizar la operación de base de datos en segundo plano
  try {
    await addDoc(collection(db, 'payments'), {
      userId: user.uid,
      amount: encryptedAmount,
      category: encryptedCategory,
      categoryIcon: encryptedIcon,
      goalId: props.selectedGoalId,
      date: currentDate,
      currency: currency.value,
    });
  } catch (error) {
    console.error('Error al guardar el pago:', error);
    // Aquí podrías implementar una lógica para revertir los cambios en la UI si es necesario
  }
};



onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      fetchGoals();
      fetchCategories();
      // fetchPaymentsForGoal();
    }
  });
});
</script>

