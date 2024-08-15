<template>
  <div v-if="!user">
    <HelloWorld />
  </div>
</template>

<script>
import HelloWorld from '../components/HelloWorld.vue'
import { mapGetters } from 'vuex';

export default {
  name: 'App',
  components: {
    HelloWorld,
  },
  computed: {
    ...mapGetters(['user']),
  }
}
</script>

<style>

</style>
