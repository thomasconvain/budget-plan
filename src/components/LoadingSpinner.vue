<template>
  <div role="status" class="fixed inset-0 bg-gray-950 flex items-center justify-center z-50">
    <img src="@/assets/img/logo.svg" alt="BudgetPlan" class="w-40 logo-pulse" />
    <span class="sr-only">Loading...</span>
  </div>
</template>

<style scoped>
.logo-pulse {
  filter: invert(1);
  animation: pulse-subtle 2s ease-in-out infinite;
}

@keyframes pulse-subtle {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}
</style>
