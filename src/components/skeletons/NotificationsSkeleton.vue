<template>
  <div class="max-w-2xl mx-auto px-4 pb-20 animate-pulse">
    <!-- Header -->
    <div class="flex items-center justify-between mt-6 mb-6">
      <div class="h-7 w-40 bg-white/20 rounded-full"></div>
      <div class="h-8 w-28 bg-white/10 rounded-xl"></div>
    </div>

    <!-- Notification items -->
    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">
      <div
        v-for="n in 5"
        :key="n"
        class="flex items-start gap-3 px-4 py-3">
        <div class="h-8 w-8 rounded-lg bg-gray-100 shrink-0 mt-0.5"></div>
        <div class="flex-1 min-w-0">
          <div class="h-4 w-32 bg-gray-200 rounded-full"></div>
          <div class="h-3 w-48 bg-gray-100 rounded-full mt-1.5"></div>
          <div class="h-3 w-16 bg-gray-50 rounded-full mt-1.5"></div>
        </div>
      </div>
    </div>
  </div>
</template>
