<template>
  <div v-if="user">
    <h2>Tu Dirección</h2>
    <p v-if="address">Dirección actual: {{ address }}</p>
    <input v-model="newAddress" placeholder="Ingresa tu dirección" />
    <button @click="saveAddress">Guardar Dirección</button>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';

export default {
  data() {
    return {
      newAddress: '', // Estado local para el input de dirección
    };
  },
  computed: {
    ...mapGetters(['user', 'address']),
  },
  methods: {
    ...mapActions(['saveAddress']),
    saveAddress() {
      if (this.newAddress) {
        // Llamada correcta a la acción Vuex sin recursión infinita
        this.$store.dispatch('saveAddress', this.newAddress);
        this.newAddress = ''; // Limpiar el campo de input después de guardar
      }
    },
  },
};
</script>
