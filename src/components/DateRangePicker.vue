<template>
  <div class="relative" ref="rootRef">
    <!-- Trigger -->
    <button
      type="button"
      class="w-full flex items-center justify-between gap-3 px-3 py-2.5 text-sm bg-white/10 text-white border border-white/10 rounded-xl hover:bg-white/15 transition focus:outline-none focus:ring-2 focus:ring-white/20"
      @click="toggleOpen">
      <CalendarIcon class="h-4 w-4 text-white/60 shrink-0" />
      <span class="flex-1 text-left truncate">{{ triggerLabel }}</span>
      <ChevronDownIcon class="h-4 w-4 text-white/40 shrink-0 transition-transform" :class="open ? 'rotate-180' : ''" />
    </button>

    <!-- Popover -->
    <Transition name="popover">
      <div
        v-if="open"
        class="absolute left-0 right-0 mt-2 z-30 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4">

        <!-- Header: month nav -->
        <div class="flex items-center justify-between mb-3">
          <button
            type="button"
            class="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition"
            @click="shiftMonth(-1)">
            <ChevronLeftIcon class="h-4 w-4" />
          </button>
          <p class="text-sm font-semibold text-gray-700 capitalize">
            {{ monthLabel }}
          </p>
          <button
            type="button"
            class="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition"
            @click="shiftMonth(1)">
            <ChevronRightIcon class="h-4 w-4" />
          </button>
        </div>

        <!-- Weekday header -->
        <div class="grid grid-cols-7 mb-1">
          <p
            v-for="d in weekdayLabels"
            :key="d"
            class="text-center text-[10px] font-semibold text-gray-400 uppercase">
            {{ d }}
          </p>
        </div>

        <!-- Days grid -->
        <div class="grid grid-cols-7 gap-y-1">
          <button
            v-for="(cell, idx) in dayCells"
            :key="idx"
            type="button"
            :disabled="!cell.date"
            class="relative h-9 flex items-center justify-center text-xs transition"
            :class="cellClass(cell)"
            @click="cell.date && handleDayClick(cell.date)">
            <span v-if="cell.date" class="relative z-10">{{ cell.date.getDate() }}</span>
          </button>
        </div>

        <!-- Helper text -->
        <p class="text-[11px] text-gray-400 mt-3">
          {{ pendingStart && !pendingEnd ? 'Selecciona la fecha final' : 'Toca dos fechas para definir el rango' }}
        </p>

        <!-- Footer -->
        <div class="flex gap-2 mt-3">
          <button
            type="button"
            class="flex-1 px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
            @click="cancel">
            Cancelar
          </button>
          <button
            type="button"
            :disabled="!pendingStart || !pendingEnd"
            class="flex-1 px-3 py-2 text-xs font-semibold text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition"
            @click="apply">
            Aplicar
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { CalendarIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/24/outline';

const props = defineProps({
  // { from: 'YYYY-MM-DD', to: 'YYYY-MM-DD' }
  modelValue: { type: Object, required: true },
  placeholder: { type: String, default: 'Seleccionar rango' },
});
const emit = defineEmits(['update:modelValue']);

const rootRef = ref(null);
const open = ref(false);

// Selección en curso (no aplicada hasta clickear "Aplicar")
const pendingStart = ref(null); // Date | null
const pendingEnd = ref(null);   // Date | null

// Mes visible
const visibleMonth = ref(new Date());

const weekdayLabels = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];

const parseInputDate = (str) => {
  if (!str) return null;
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const toInputDate = (d) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const formatDisplay = (d) => {
  if (!d) return '';
  return new Intl.DateTimeFormat('es', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d);
};

const sameDay = (a, b) => a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const stripTime = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const inRange = (d, start, end) => {
  if (!start || !end) return false;
  const t = stripTime(d).getTime();
  return t >= stripTime(start).getTime() && t <= stripTime(end).getTime();
};

const triggerLabel = computed(() => {
  const from = parseInputDate(props.modelValue?.from);
  const to = parseInputDate(props.modelValue?.to);
  if (!from || !to) return props.placeholder;
  if (sameDay(from, to)) return formatDisplay(from);
  return `${formatDisplay(from)} — ${formatDisplay(to)}`;
});

const monthLabel = computed(() => {
  return new Intl.DateTimeFormat('es', { month: 'long', year: 'numeric' }).format(visibleMonth.value);
});

// Devuelve un array de 42 cells (6 semanas × 7 días) con la grid del mes visible.
// Cells fuera del mes visible quedan como { date: null }.
const dayCells = computed(() => {
  const year = visibleMonth.value.getFullYear();
  const month = visibleMonth.value.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  // Lunes = 0, ..., Domingo = 6
  const offset = (firstOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < offset; i++) cells.push({ date: null });
  for (let day = 1; day <= daysInMonth; day++) cells.push({ date: new Date(year, month, day) });
  while (cells.length < 42) cells.push({ date: null });
  return cells;
});

const cellClass = (cell) => {
  if (!cell.date) return 'cursor-default';
  const d = cell.date;
  const isStart = sameDay(d, pendingStart.value);
  const isEnd = sameDay(d, pendingEnd.value);
  const isInRange = inRange(d, pendingStart.value, pendingEnd.value);
  const isToday = sameDay(d, new Date());

  const classes = ['rounded-lg', 'cursor-pointer'];

  if (isStart || isEnd) {
    classes.push('bg-gray-900 text-white font-semibold');
  } else if (isInRange) {
    classes.push('bg-gray-100 text-gray-700');
  } else if (isToday) {
    classes.push('text-gray-900 font-semibold ring-1 ring-gray-300');
  } else {
    classes.push('text-gray-600 hover:bg-gray-50');
  }

  return classes.join(' ');
};

const toggleOpen = () => {
  if (open.value) {
    cancel();
  } else {
    syncFromModel();
    open.value = true;
  }
};

const syncFromModel = () => {
  pendingStart.value = parseInputDate(props.modelValue?.from);
  pendingEnd.value = parseInputDate(props.modelValue?.to);
  // Posiciona el mes visible en la fecha de inicio (o hoy si no hay).
  visibleMonth.value = pendingStart.value
    ? new Date(pendingStart.value.getFullYear(), pendingStart.value.getMonth(), 1)
    : new Date();
};

const handleDayClick = (date) => {
  // Si no hay start, o ya hay un rango completo → empezar nuevo rango.
  if (!pendingStart.value || (pendingStart.value && pendingEnd.value)) {
    pendingStart.value = stripTime(date);
    pendingEnd.value = null;
    return;
  }
  // Si hay start pero no end:
  if (stripTime(date).getTime() < stripTime(pendingStart.value).getTime()) {
    // Click anterior al start → reiniciar como nuevo start
    pendingStart.value = stripTime(date);
    pendingEnd.value = null;
  } else {
    pendingEnd.value = stripTime(date);
  }
};

const shiftMonth = (delta) => {
  const d = visibleMonth.value;
  visibleMonth.value = new Date(d.getFullYear(), d.getMonth() + delta, 1);
};

const apply = () => {
  if (!pendingStart.value || !pendingEnd.value) return;
  emit('update:modelValue', {
    from: toInputDate(pendingStart.value),
    to: toInputDate(pendingEnd.value),
  });
  open.value = false;
};

const cancel = () => {
  open.value = false;
};

// Cierre al click fuera
const handleOutsideClick = (event) => {
  if (!open.value) return;
  if (rootRef.value && !rootRef.value.contains(event.target)) cancel();
};
onMounted(() => document.addEventListener('mousedown', handleOutsideClick));
onBeforeUnmount(() => document.removeEventListener('mousedown', handleOutsideClick));

// Re-sincronizar si el modelo cambia desde fuera mientras está cerrado
watch(() => props.modelValue, () => {
  if (!open.value) syncFromModel();
}, { deep: true });
</script>

<style scoped>
.popover-enter-active, .popover-leave-active {
  transition: opacity 120ms ease, transform 120ms ease;
  transform-origin: top;
}
.popover-enter-from, .popover-leave-to {
  opacity: 0;
  transform: scaleY(0.95) translateY(-4px);
}
</style>
