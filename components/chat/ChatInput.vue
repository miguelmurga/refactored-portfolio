<template>
  <div class="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
    <form @submit.prevent="sendMessage" class="relative">
      <UTextarea
          v-model="inputValue"
          :placeholder="$t('chat.type_message')"
          autoresize
          class="pr-20 pl-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:border-primary-300 dark:focus:border-primary-700"
          :rows="1"
          :maxRows="6"
          @keydown.enter.prevent="handleEnterKey"
          :disabled="disabled"
      />
      <div class="absolute right-2 bottom-2 flex space-x-1">
        <UButton
            v-if="showDbButton"
            color="gray"
            variant="ghost"
            icon="i-heroicons-table-cells"
            aria-label="View database schema"
            @click="$emit('view-schema')"
        />
        <UButton
            color="primary"
            variant="solid"
            icon="i-heroicons-paper-airplane"
            class="rounded-lg"
            :disabled="!inputValue.trim() || disabled"
            type="submit"
            aria-label="Send message"
        />
      </div>
    </form>
    <div class="flex justify-between mt-2 text-xs text-gray-500 px-1">
      <div>{{ modelInfo }}</div>
      <div>{{ $t('chat.privacy_note') }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{
  modelInfo: string;
  disabled: boolean;
  showDbButton?: boolean;
  value?: string;
}>();

const emit = defineEmits<{
  (e: 'send', message: string): void;
  (e: 'view-schema'): void;
  (e: 'update:value', value: string): void;
}>();

const inputValue = ref(props.value || '');

// Sincronizar con v-model externo
watch(() => props.value, (newVal) => {
  if (newVal !== undefined && newVal !== inputValue.value) {
    inputValue.value = newVal;
  }
});

watch(inputValue, (newVal) => {
  emit('update:value', newVal);
});

// Manejar envío del formulario
function sendMessage() {
  if (!inputValue.value.trim() || props.disabled) return;

  emit('send', inputValue.value);
  inputValue.value = '';
}

// Manejar tecla Enter
function handleEnterKey(e: KeyboardEvent) {
  // Si está presionando shift+enter, permitir nueva línea
  if (e.shiftKey) return;

  // De lo contrario, enviar mensaje
  sendMessage();
}
</script>