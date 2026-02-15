<template>
  <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
    <h3 class="text-sm font-semibold text-gray-900 mb-3">Invitar contacto</h3>
    <div class="flex gap-2 flex-col sm:flex-row">
      <input
        v-model="email"
        type="email"
        placeholder="Email del usuario"
        class="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent text-sm text-gray-900"
        @keydown.enter="handleSend"
      />
      <button
        :disabled="sending || !email.trim()"
        class="px-4 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 disabled:opacity-50 transition active:scale-[0.98]"
        @click="handleSend">
        {{ sending ? 'Enviando...' : 'Invitar' }}
      </button>
    </div>
    <p v-if="error" class="mt-2 text-xs text-red-500">{{ error }}</p>
    <p v-if="success" class="mt-2 text-xs text-emerald-500">{{ success }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { sendInvitation } from '@/utils/business/invitations';

const emit = defineEmits(['invitationSent']);

const email = ref('');
const sending = ref(false);
const error = ref('');
const success = ref('');

const handleSend = async () => {
  if (!email.value.trim() || sending.value) return;

  sending.value = true;
  error.value = '';
  success.value = '';

  try {
    await sendInvitation(email.value);
    success.value = 'Invitación enviada exitosamente';
    email.value = '';
    emit('invitationSent');
  } catch (e) {
    error.value = e.message || 'Error al enviar la invitación';
  } finally {
    sending.value = false;
  }
};
</script>
