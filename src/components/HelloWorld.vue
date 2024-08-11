<template>
  <div>
    <p v-if="user">Bienvenido {{ user.displayName }}</p>
    <button v-if="!user" @click="signIn">Iniciar sesión con Google</button>
    <button v-if="user" @click="logout">Cerrar sesión</button>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';

export default {
  computed: {
    ...mapGetters(['user']),
  },
  methods: {
    ...mapActions(['signIn', 'logout']),
  },
};
</script>
