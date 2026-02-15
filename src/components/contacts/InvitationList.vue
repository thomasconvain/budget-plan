<template>
  <div v-if="received.length || sent.length" class="space-y-4">
    <!-- Invitaciones recibidas -->
    <div v-if="received.length">
      <h3 class="text-sm font-semibold text-gray-900 mb-2">Invitaciones recibidas</h3>
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">
        <div
          v-for="inv in received"
          :key="inv.id"
          class="flex items-center gap-3 px-4 py-3">
          <div class="flex items-center justify-center h-8 w-8 rounded-lg bg-indigo-50 shrink-0">
            <UserIcon class="h-4 w-4 text-indigo-500" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-700 truncate">{{ inv.fromName }}</p>
            <p class="text-xs text-gray-400 truncate">{{ inv.fromEmail }}</p>
          </div>
          <div class="flex items-center gap-1.5 shrink-0">
            <button
              :disabled="processing === inv.id"
              class="px-3 py-1.5 text-xs font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition"
              @click="handleAccept(inv.id)">
              Aceptar
            </button>
            <button
              :disabled="processing === inv.id"
              class="px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition"
              @click="handleReject(inv.id)">
              Rechazar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Invitaciones enviadas -->
    <div v-if="sent.length">
      <h3 class="text-sm font-semibold text-gray-900 mb-2">Invitaciones enviadas</h3>
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">
        <div
          v-for="inv in sent"
          :key="inv.id"
          class="flex items-center gap-3 px-4 py-3">
          <div class="flex items-center justify-center h-8 w-8 rounded-lg bg-amber-50 shrink-0">
            <ClockIcon class="h-4 w-4 text-amber-500" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-700 truncate">{{ inv.toName }}</p>
            <p class="text-xs text-gray-400 truncate">{{ inv.toEmail }}</p>
          </div>
          <span class="text-xs text-gray-400 shrink-0">Pendiente</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { UserIcon, ClockIcon } from '@heroicons/vue/24/outline';
import { acceptInvitation, rejectInvitation } from '@/utils/business/invitations';

const props = defineProps({
  received: { type: Array, default: () => [] },
  sent: { type: Array, default: () => [] },
});

const emit = defineEmits(['updated']);
const processing = ref(null);

const handleAccept = async (id) => {
  processing.value = id;
  try {
    await acceptInvitation(id);
    emit('updated');
  } catch (e) {
    console.error('Error aceptando invitación:', e);
  } finally {
    processing.value = null;
  }
};

const handleReject = async (id) => {
  processing.value = id;
  try {
    await rejectInvitation(id);
    emit('updated');
  } catch (e) {
    console.error('Error rechazando invitación:', e);
  } finally {
    processing.value = null;
  }
};
</script>
