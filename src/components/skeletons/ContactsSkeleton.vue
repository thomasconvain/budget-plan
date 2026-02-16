<template>
  <div class="max-w-2xl mx-auto px-4 pb-20 animate-pulse">
    <!-- Header -->
    <div class="flex items-center justify-between mt-6 mb-6">
      <div class="h-7 w-32 bg-white/20 rounded-full"></div>
    </div>

    <!-- Formulario invitación -->
    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
      <div class="h-4 w-28 bg-gray-200 rounded-full mb-3"></div>
      <div class="flex gap-2 flex-col sm:flex-row">
        <div class="flex-1 h-10 bg-gray-100 rounded-xl"></div>
        <div class="h-10 w-24 bg-gray-200 rounded-xl"></div>
      </div>
    </div>

    <!-- Invitaciones recibidas -->
    <div class="space-y-4 mb-6">
      <div>
        <div class="h-4 w-40 bg-white/15 rounded-full mb-2"></div>
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">
          <div
            v-for="n in 2"
            :key="'received-' + n"
            class="flex items-center gap-3 px-4 py-3">
            <div class="h-8 w-8 rounded-lg bg-gray-100 shrink-0"></div>
            <div class="flex-1 min-w-0">
              <div class="h-4 w-28 bg-gray-200 rounded-full"></div>
              <div class="h-3 w-36 bg-gray-100 rounded-full mt-1.5"></div>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
              <div class="h-7 w-16 bg-gray-200 rounded-lg"></div>
              <div class="h-7 w-16 bg-gray-100 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Invitaciones enviadas -->
      <div>
        <div class="h-4 w-36 bg-white/15 rounded-full mb-2"></div>
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">
          <div class="flex items-center gap-3 px-4 py-3">
            <div class="h-8 w-8 rounded-lg bg-gray-100 shrink-0"></div>
            <div class="flex-1 min-w-0">
              <div class="h-4 w-28 bg-gray-200 rounded-full"></div>
              <div class="h-3 w-36 bg-gray-100 rounded-full mt-1.5"></div>
            </div>
            <div class="h-3 w-16 bg-gray-100 rounded-full shrink-0"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Mis contactos -->
    <div>
      <div class="h-4 w-28 bg-white/15 rounded-full mb-2"></div>
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">
        <div
          v-for="n in 2"
          :key="'contact-' + n"
          class="flex items-center gap-3 px-4 py-3">
          <div class="h-8 w-8 rounded-lg bg-gray-100 shrink-0"></div>
          <div class="flex-1 min-w-0">
            <div class="h-4 w-28 bg-gray-200 rounded-full"></div>
            <div class="h-3 w-36 bg-gray-100 rounded-full mt-1.5"></div>
          </div>
          <div class="h-4 w-4 bg-gray-100 rounded-full shrink-0"></div>
          <div class="h-7 w-7 rounded-full bg-gray-100 shrink-0"></div>
        </div>
      </div>
    </div>
  </div>
</template>
