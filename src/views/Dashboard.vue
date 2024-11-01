<template>
  <div v-if="user">
    <!-- <UserDirecction /> -->
    <ListGoals />
  </div>
</template>

<script>
// import UserDirecction from '../components/UserDirection.vue'
import ListGoals from '../components/ListGoals.vue'
import { mapGetters } from 'vuex';

export default {
  name: 'App',
  components: {
    // UserDirecction,
    ListGoals
  },
  computed: {
    ...mapGetters(['user']),
  }
}
</script>

<style>

</style>
