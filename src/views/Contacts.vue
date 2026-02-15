<template>
  <div v-if="isLoading" class="flex justify-center py-12">
    <LoadingSpinner />
  </div>
  <div v-else ref="contentRef" class="max-w-2xl mx-auto px-4 pb-20">
    <div class="flex items-center justify-between mt-6 mb-6">
      <h1 class="text-2xl font-bold text-white">Contactos</h1>
      <button
        v-if="!isNativeApp"
        class="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition"
        @click="$router.push({ name: 'Dashboard' })">
        <ArrowLeftIcon class="h-4 w-4 text-white" />
      </button>
    </div>

    <!-- Formulario de invitación -->
    <InvitationForm class="mb-6" @invitationSent="refreshInvitations" />

    <!-- Invitaciones pendientes -->
    <InvitationList
      class="mb-6"
      :received="receivedInvitations"
      :sent="sentInvitations"
      @updated="refreshAll"
    />

    <!-- Contactos aceptados -->
    <ContactList :contacts="contacts" @updated="refreshAll" />

    <p v-if="!contacts.length && !receivedInvitations.length && !sentInvitations.length"
       class="text-sm text-white/60 text-center mt-8">
      Invita a tus contactos para compartir gastos
    </p>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import InvitationForm from '@/components/contacts/InvitationForm.vue';
import InvitationList from '@/components/contacts/InvitationList.vue';
import ContactList from '@/components/contacts/ContactList.vue';
import {
  fetchReceivedInvitations,
  fetchSentInvitations,
  fetchContacts,
} from '@/utils/business/invitations';
import { ArrowLeftIcon } from '@heroicons/vue/24/outline';
import { Capacitor } from '@capacitor/core';

const isNativeApp = Capacitor.isNativePlatform();
const emit = defineEmits(['last-card-position']);

const auth = getAuth();
const isLoading = ref(true);
const contentRef = ref(null);
const receivedInvitations = ref([]);
const sentInvitations = ref([]);
const contacts = ref([]);

const refreshInvitations = async () => {
  const [received, sent] = await Promise.all([
    fetchReceivedInvitations(),
    fetchSentInvitations(),
  ]);
  receivedInvitations.value = received;
  sentInvitations.value = sent;
};

const refreshContacts = async () => {
  contacts.value = await fetchContacts();
};

const refreshAll = async () => {
  await Promise.all([
    refreshInvitations(),
    refreshContacts(),
  ]);
};

const emitBackgroundHeight = () => {
  nextTick(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!contentRef.value) return;
        const cards = contentRef.value.querySelectorAll('.rounded-2xl');
        const lastCard = cards[cards.length - 1];
        if (lastCard) {
          const rect = lastCard.getBoundingClientRect();
          emit('last-card-position', rect.top + rect.height / 2);
        }
      });
    });
  });
};

onMounted(() => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      await refreshAll();
      isLoading.value = false;
      emitBackgroundHeight();
    }
  });
});
</script>
