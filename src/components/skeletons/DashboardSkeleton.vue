<template>
  <div class="animate-pulse">
    <!-- Balance general card -->
    <div class="relative mb-12">
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div class="flex items-center gap-3">
          <div class="h-10 w-10 rounded-xl bg-gray-200 shrink-0"></div>
          <div class="flex-1">
            <div class="h-3 w-24 bg-gray-200 rounded-full"></div>
            <div class="h-7 w-40 bg-gray-200 rounded-full mt-2"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tus tarjetas -->
    <div class="h-6 w-32 bg-gray-200 rounded-full mb-4"></div>
    <div class="max-w-4xl mx-auto space-y-3">
      <div
        v-for="n in 2"
        :key="'card-' + n"
        class="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div class="flex items-start gap-3">
          <div class="h-10 w-10 rounded-xl bg-gray-200 shrink-0"></div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between">
              <div class="h-4 w-36 bg-gray-200 rounded-full"></div>
              <div class="h-7 w-7 rounded-full bg-gray-100 ml-2 shrink-0"></div>
            </div>
            <div class="h-5 w-28 bg-gray-200 rounded-full mt-2"></div>
            <div class="mt-2 w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div class="h-full rounded-full bg-gray-200" :style="{ width: n === 1 ? '65%' : '35%' }"></div>
            </div>
            <div class="flex items-center justify-between mt-2">
              <div class="h-3 w-40 bg-gray-100 rounded-full"></div>
              <div class="h-3 w-8 bg-gray-100 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tus cuentas bancarias -->
    <div class="h-6 w-48 bg-gray-200 rounded-full mb-4 mt-16"></div>
    <div class="max-w-4xl mx-auto space-y-3">
      <div class="flex items-center gap-3 bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div class="h-10 w-10 rounded-xl bg-gray-200 shrink-0"></div>
        <div class="flex-1 min-w-0">
          <div class="h-4 w-32 bg-gray-200 rounded-full"></div>
          <div class="h-3 w-24 bg-gray-100 rounded-full mt-1.5"></div>
        </div>
        <div class="text-right shrink-0">
          <div class="h-5 w-24 bg-gray-200 rounded-full"></div>
          <div class="h-3 w-10 bg-gray-100 rounded-full mt-1.5 ml-auto"></div>
        </div>
        <div class="h-7 w-7 rounded-full bg-gray-100 shrink-0"></div>
      </div>
    </div>

    <!-- Botón agregar -->
    <div class="mt-6 flex items-center gap-3 bg-gray-200 p-4 rounded-2xl">
      <div class="h-10 w-10 rounded-xl bg-gray-300/50 shrink-0"></div>
      <div class="h-4 w-52 bg-gray-300/50 rounded-full"></div>
    </div>
  </div>
</template>
