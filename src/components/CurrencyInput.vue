<template>
  <div class="relative rounded-md shadow-sm">
    <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
      <span class="text-gray-500 sm:text-sm">{{ currencySymbol }}</span>
    </div>
    <input
      type="text"
      :disabled="disabled"
      name="price"
      id="price"
      ref="inputRef"
      class="block w-full rounded-md border-0 py-2 pl-7 pr-20 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-600 sm:text-sm sm:leading-6"
      :placeholder="placeholder"
    />
    <div v-if="showSelect" class="absolute inset-y-0 right-0 flex items-center">
      <label for="currency" class="sr-only">Currency</label>
      <select
        :value="currency"
        @input="onInput"
        id="currency"
        name="currency"
        class="h-full rounded-md border-0 bg-transparent py-0 pl-2 pr-7 text-gray-500 focus:ring-2 focus:ring-inset focus:ring-gray-600 sm:text-sm"
      >
        <option
          v-for="opt in currencyOptions"
          :key="opt.value"
          :value="opt.value"
        >{{ opt.value }}</option>
      </select>
    </div>
  </div>
</template>

<script setup>
import { computed, watch, defineEmits } from 'vue'
import { useCurrencyInput } from 'vue-currency-input'

// eslint-disable-next-line no-undef
const props = defineProps({
  modelValue: Number,
  options: Object,
  disabled: Boolean,
  placeholder: String,
  currencyOptions: Array,
  currency: String,
  showSelect: { type: Boolean, default: true },
})

const { inputRef, setValue, setOptions } = useCurrencyInput(props.options)

// cuando cambie el valor por v-model
watch(() => props.modelValue, v => setValue(v))

const emit = defineEmits(['update:currency', 'update:modelValue'])
const onInput = e => emit('update:currency', e.target.value)

/**
 * Mapea cada código de moneda a su símbolo.
 * Ajusta o extiende según tus necesidades.
 */
const currencySymbol = computed(() => {
  const map = {
    EUR: '€',
    USD: '$',
    CLP: '$',
    COP: '$',
  }
  return map[props.currency] || props.currency
})

// **Clave**: si cambian las opciones (p.ej. currency), reinstalamos el formatter
watch(
  () => props.options,
  newOpts => {
    setOptions(newOpts)
    // Opcional: reinyectar el valor actual para que se refresque la máscara
    setValue(props.modelValue)
  },
  { deep: true }
)
</script>
