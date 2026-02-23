<template>
  <div class="max-w-2xl mx-auto px-4 pb-20 animate-pulse">
    <!-- Header -->
    <div class="flex items-center justify-between mt-6 mb-6">
      <div>
        <div class="h-7 w-40 bg-white/20 rounded-full"></div>
        <div class="h-3 w-28 bg-white/10 rounded-full mt-2"></div>
      </div>
      <div class="h-9 w-9 bg-white/10 rounded-xl"></div>
    </div>

    <!-- Balance total cards -->
    <div class="h-4 w-48 bg-white/15 rounded-full mb-2"></div>
    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
      <div class="h-3 w-20 bg-gray-100 rounded-full mb-2"></div>
      <div class="h-6 w-32 bg-gray-200 rounded-full"></div>
    </div>

    <!-- Button -->
    <div class="h-10 w-full bg-gray-200 rounded-xl mb-6"></div>

    <!-- Date filter -->
    <div class="flex gap-3 mb-4">
      <div class="flex-1 h-10 bg-white rounded-xl border border-gray-100"></div>
      <div class="flex-1 h-10 bg-white rounded-xl border border-gray-100"></div>
    </div>

    <!-- Filtered balance -->
    <div class="h-4 w-44 bg-gray-200 rounded-full mb-2"></div>
    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
      <div class="h-3 w-20 bg-gray-100 rounded-full mb-2"></div>
      <div class="h-6 w-32 bg-gray-200 rounded-full"></div>
    </div>

    <!-- List -->
    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">
      <div class="px-4 py-2 bg-gray-50/50 first:rounded-t-2xl">
        <div class="h-3 w-40 bg-gray-200 rounded-full"></div>
      </div>
      <div
        v-for="n in 3"
        :key="n"
        class="flex items-center gap-3 px-4 py-3">
        <div class="h-8 w-8 rounded-lg bg-gray-100 shrink-0"></div>
        <div class="flex-1 min-w-0">
          <div class="h-4 w-28 bg-gray-200 rounded-full"></div>
          <div class="h-3 w-36 bg-gray-100 rounded-full mt-1.5"></div>
        </div>
        <div class="h-4 w-20 bg-gray-200 rounded-full shrink-0"></div>
      </div>
    </div>
  </div>
</template>
