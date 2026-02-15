<template>
  <div v-if="user">
    <ListGoals />
    <SubscriptionCheckout class="mt-12"/>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';
import ListGoals from '../components/ListGoals.vue';
import SubscriptionCheckout from '../components/SubscriptionCheckout.vue';

const store = useStore();
const user = computed(() => store.getters.user);
</script>
