<template>
  <div class="relative flex w-full">
    <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
  <input
    class="block w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
    :placeholder="placeholder"
    ref="inputRef"
    type="text"
  />
  </div>
</template>

<script setup>
import { useCurrencyInput } from 'vue-currency-input'
import { watch } from 'vue';


// eslint-disable-next-line vue/no-setup-props-destructure, no-undef
const props = defineProps({
  modelValue: Number, // Vue 2: value
  options: Object,
  placeholder: String
});

const { inputRef, setValue } = useCurrencyInput(props.options)

watch(
      () => props.modelValue, // Vue 2: props.value
      (value) => {
        setValue(value)
      }
    )

// watch(
//       () => props.options,
//       (options) => {
//         setOptions(options)
//       }
//     )
</script>