<template>
  <div class="max-w-2xl mx-auto px-4 py-6">
    <h1 class="text-2xl text-white font-bold mb-2">Migración: allocations FIFO</h1>
    <p class="text-sm text-white/60 mb-6">
      Recalcula <code class="text-white/80">settledAmount</code> por gasto y
      <code class="text-white/80">allocations</code> por liquidación, aplicando
      FIFO en orden cronológico para todos tus pares de contactos.
      Idempotente: se puede correr varias veces.
    </p>

    <button
      :disabled="running"
      class="w-full px-4 py-3 text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-500 disabled:opacity-50 transition active:scale-[0.98] mb-4"
      @click="run">
      {{ running ? 'Ejecutando…' : 'Ejecutar migración' }}
    </button>

    <div v-if="logs.length" class="bg-black/40 border border-white/10 rounded-xl p-4 max-h-[60vh] overflow-y-auto font-mono text-xs text-white/80 whitespace-pre-wrap">
      <div v-for="(line, i) in logs" :key="i">{{ line }}</div>
    </div>

    <div v-if="error" class="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-300">
      {{ error }}
    </div>

    <div v-if="result" class="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-sm text-emerald-300">
      OK. Pares: {{ result.pairs }} · Gastos: {{ result.expenses }} ({{ result.settled }} con saldo) · Liquidaciones: {{ result.settlements }}
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { backfillSettlementAllocations } from '@/utils/business/migrations/backfillSettlementAllocations';

const running = ref(false);
const logs = ref([]);
const error = ref('');
const result = ref(null);

const run = async () => {
  if (running.value) return;
  running.value = true;
  logs.value = [];
  error.value = '';
  result.value = null;
  try {
    result.value = await backfillSettlementAllocations((msg) => {
      logs.value.push(msg);
    });
  } catch (e) {
    console.error(e);
    error.value = e.message || String(e);
  } finally {
    running.value = false;
  }
};
</script>
