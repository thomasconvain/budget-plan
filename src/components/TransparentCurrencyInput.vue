<template>
  <div class="relative rounded-md shadow-sm">
      <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <span class="text-gray-500 sm:text-sm">$</span>
      </div>
      <input type="text" :disabled="disabled" name="price" id="price" ref="inputRef" class="block w-full rounded-md border-0 py-2 pl-7 pr-20 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-600 sm:text-sm sm:leading-6" :placeholder="placeholder" />
      <div v-if="showSelect" class="absolute inset-y-0 right-0 flex items-center">
        <label for="currency" class="sr-only">Currency</label>
        <select :value="currency" @input="onInput" id="currency" name="currency" class="h-full rounded-md border-0 bg-transparent py-0 pl-2 pr-7 text-gray-500 focus:ring-2 focus:ring-inset focus:ring-gray-600 sm:text-sm">
          <option v-for="currencyOption in currencyOptions" :key="currencyOption" :value="currencyOption.value">{{ currencyOption.value }}</option>
        </select>
      </div>
    </div>
</template>

<script setup>
import { useCurrencyInput } from 'vue-currency-input'
import { watch, defineEmits } from 'vue';


// eslint-disable-next-line vue/no-setup-props-destructure, no-undef
const props = defineProps({
  modelValue: Number, // Vue 2: value
  options: Object,
  disabled: Boolean,
  placeholder: String,
  currencyOptions: Array,
  currency: String,
  showSelect: {
    type: Boolean,
    default: true
  }
});

const { inputRef, setValue } = useCurrencyInput(props.options)

watch(
      () => props.modelValue, // Vue 2: props.value
      (value) => {
        setValue(value)
      }
    )

const emit = defineEmits(['update:currency']);

const onInput = (event) => {
  emit('update:currency', event.target.value);
};

// watch(
//       () => props.options,
//       (options) => {
//         setOptions(options)
//       }
//     )
</script>