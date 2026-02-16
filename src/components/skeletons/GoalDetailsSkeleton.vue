<template>
  <div class="animate-pulse">
    <!-- Header -->
    <div class="mt-6 flex items-center justify-between">
      <div class="min-w-0 flex-1">
        <div class="h-3 w-20 bg-white/10 rounded-full"></div>
        <div class="h-7 w-48 bg-white/20 rounded-full mt-2"></div>
        <div class="h-3 w-12 bg-white/10 rounded-full mt-2"></div>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <div class="h-8 w-8 bg-white/10 rounded-xl"></div>
      </div>
    </div>

    <!-- Stats bar horizontal -->
    <div class="mt-4 flex flex-nowrap gap-2 overflow-hidden pb-2">
      <div class="min-w-fit h-8 w-28 bg-white/10 rounded-xl"></div>
      <div class="min-w-fit h-8 w-24 bg-white/10 rounded-xl"></div>
      <div class="min-w-fit h-8 w-32 bg-white/10 rounded-xl"></div>
    </div>

    <!-- Stats cards -->
    <div class="mt-20 md:mt-6">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div
          v-for="n in 3"
          :key="'stat-' + n"
          class="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div class="h-3 w-24 bg-gray-200 rounded-full mb-3"></div>
          <div class="h-7 w-32 bg-gray-200 rounded-full"></div>
        </div>
      </div>
    </div>

    <!-- Charts toggle button -->
    <div class="my-6 flex justify-center lg:justify-end">
      <div class="h-8 w-36 bg-gray-200 rounded-xl"></div>
    </div>

    <!-- Nuevo movimiento -->
    <div class="my-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div class="h-4 w-36 bg-gray-200 rounded-full mb-4"></div>
      <div class="flex gap-3 flex-col sm:flex-row">
        <div class="h-10 flex-1 bg-gray-100 rounded-xl"></div>
        <div class="h-10 flex-1 bg-gray-100 rounded-xl"></div>
      </div>
      <div class="h-10 w-full bg-gray-200 rounded-xl mt-3"></div>
    </div>

    <!-- Movimientos -->
    <div class="mt-8 mb-6">
      <div class="h-5 w-28 bg-gray-200 rounded-full mb-3"></div>
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">
        <!-- Date header -->
        <div class="px-4 py-2 bg-gray-50/50 rounded-t-2xl">
          <div class="h-3 w-24 bg-gray-200 rounded-full"></div>
        </div>
        <!-- Payment rows -->
        <div
          v-for="n in 4"
          :key="'payment-' + n"
          class="flex items-center gap-3 px-4 py-3">
          <div class="h-8 w-8 rounded-lg bg-gray-100 shrink-0"></div>
          <div class="flex-1 min-w-0">
            <div class="h-4 w-24 bg-gray-200 rounded-full"></div>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <div class="h-4 w-16 bg-gray-200 rounded-full"></div>
            <div class="h-6 w-6 rounded-full bg-gray-100"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
