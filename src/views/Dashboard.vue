<template>
  <div v-if="user">
    <!-- <UserDirecction /> -->
    <ListGoals />
    <SubscriptionCheckout class="mt-12"/>
  </div>
</template>

<script>
// import UserDirecction from '../components/UserDirection.vue'
import ListGoals from '../components/ListGoals.vue'
import SubscriptionCheckout from '../components/SubscriptionCheckout.vue'
import { mapGetters } from 'vuex';

export default {
  name: 'App',
  components: {
    // UserDirecction,
    ListGoals,
    SubscriptionCheckout
  },
  computed: {
    ...mapGetters(['user']),
  }
}
</script>

<style>

</style>
