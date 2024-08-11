<template>
  <HelloWorld />
  <!-- <UserDirecction /> -->
  <UserPaymentsList />
</template>

<script>
import HelloWorld from './components/HelloWorld.vue'
// import UserDirecction from './components/UserDirection.vue'
import UserPaymentsList from './components/UserPaymentsList.vue'

export default {
  name: 'App',
  components: {
    HelloWorld,
    // UserDirecction,
    UserPaymentsList
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
