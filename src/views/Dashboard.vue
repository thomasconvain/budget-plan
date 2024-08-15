<template>
  <div v-if="user">
    <!-- <UserDirecction /> -->
    <CreateGoals />
  </div>
</template>

<script>
// import UserDirecction from '../components/UserDirection.vue'
import CreateGoals from '../components/CreateGoals.vue'
import { mapGetters } from 'vuex';

export default {
  name: 'App',
  components: {
    // UserDirecction,
    CreateGoals
  },
  computed: {
    ...mapGetters(['user']),
  }
}
</script>

<style>

</style>
