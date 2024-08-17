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
      <Listbox as="div" v-model="category">
        <div class="relative">
          <ListboxButton class="relative w-full cursor-default rounded-md bg-white py-2 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm sm:leading-6">
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
                <li :class="[active ? 'bg-indigo-100 text-indigo-500' : 'text-gray-900', 'relative cursor-default select-none py-2 pl-3 pr-9']">
                  <div class="flex items-center">
                    <component :is="getIconComponent(category.icon)" class="w-5 h-5" />
                    <span :class="[selected ? 'font-semibold' : 'font-normal', 'ml-3 block truncate']">{{ category.name }}</span>
                  </div>

                  <span v-if="selected" :class="[active ? 'text-indigo-500' : 'text-gray-900', 'absolute inset-y-0 right-0 flex items-center pr-4']">
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
      class="mt-4 relative flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg group hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      @click="handleSavePayment">
        Ingresar Pago {{ currency }}
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
]);
const iconMap = {
  GlobeAmericasIcon: OutlineIcons.GlobeAmericasIcon,
  HomeIcon : OutlineIcons.HomeIcon,
  MapPinIcon : OutlineIcons.MapPinIcon,
  FilmIcon : OutlineIcons.FilmIcon,
  BuildingStorefrontIcon : OutlineIcons.BuildingStorefrontIcon,
  ShoppingCartIcon : OutlineIcons.ShoppingCartIcon,
  ShoppingBagIcon : OutlineIcons.ShoppingBagIcon,
  BanknotesIcon : OutlineIcons.BanknotesIcon

  // Agrega aquí todos los íconos que necesites
};

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
  return iconMap[iconName] || null;
};

const handleSavePayment = async () => {
  const user = auth.currentUser;
  const currentDate = Timestamp.now(); // Obtener la fecha actual en formato ISO
  if (user && amount.value && category.value && currency && props.selectedGoalId) {
    await addDoc(collection(db, 'payments'), {
      userId: user.uid,
      amount: parseFloat(amount.value),
      category: category.value.name,
      goalId: props.selectedGoalId,
      date: currentDate, // Añadir la fecha actual al payment,
      currency: currency.value,
    });

    // Emitir el evento al componente padre en lugar de llamar a fetchPaymentsForGoal
    emit('paymentSaved');

    // Limpiar los campos
    amount.value = '';
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

