<template>
  <div v-if="contacts.length">
    <h3 class="text-sm font-semibold text-white mb-2">Mis contactos</h3>
    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">
      <div
        v-for="contact in contacts"
        :key="contact.userId"
        class="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition"
        @click="viewContact(contact)">
        <div class="flex items-center justify-center h-8 w-8 rounded-lg bg-emerald-50 shrink-0">
          <UserIcon class="h-4 w-4 text-emerald-500" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-700 truncate">{{ contact.name }}</p>
          <p class="text-xs text-gray-400 truncate">{{ contact.email }}</p>
        </div>
        <CheckBadgeIcon class="h-4 w-4 text-emerald-400 shrink-0" />
        <button
          type="button"
          class="p-1.5 rounded-full border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition shrink-0"
          :disabled="removingId === contact.invitationId"
          :aria-label="'Eliminar contacto ' + contact.name"
          @click.stop="remove(contact)">
          <TrashIcon class="h-4 w-4" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { UserIcon, CheckBadgeIcon, TrashIcon } from '@heroicons/vue/24/outline';
import { removeContact } from '@/utils/business/invitations';

const router = useRouter();

const props = defineProps({
  contacts: { type: Array, default: () => [] },
});

const emit = defineEmits(['updated']);

const removingId = ref(null);

function viewContact(contact) {
  router.push({ name: 'ContactDetail', params: { contactId: contact.userId } });
}

async function remove(contact) {
  if (removingId.value) return;
  removingId.value = contact.invitationId;
  try {
    await removeContact(contact.invitationId);
    emit('updated');
  } catch (e) {
    console.error(e);
    alert(e.message || 'No se pudo eliminar el contacto');
  } finally {
    removingId.value = null;
  }
}
</script>
