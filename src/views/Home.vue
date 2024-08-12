<template>
  <div v-if="!user">
    <HelloWorld />
  </div>
  <div v-if="user">
    <NavBar />
     <!-- <UserDirecction /> -->
    <UserPaymentsList />
    <CreateGoals />
  </div>
</template>

<script>
import HelloWorld from '../components/HelloWorld.vue'
import NavBar from '../components/NavBar.vue'
// import UserDirecction from '../components/UserDirection.vue'
import UserPaymentsList from '../components/UserPaymentsList.vue'
import CreateGoals from '../components/CreateGoals.vue'
import { mapGetters } from 'vuex';

export default {
  name: 'App',
  components: {
    HelloWorld,
    NavBar,
    // UserDirecction,
    UserPaymentsList,
    CreateGoals
  },
  computed: {
    ...mapGetters(['user']),
  }
}
</script>

<style>

</style>
