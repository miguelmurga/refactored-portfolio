<template>
  <div class="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50 dark:bg-gray-900" ref="messagesContainer">
    <!-- Estado vacío -->
    <template v-if="messages.length === 0">
      <div class="flex flex-col items-center justify-center h-full text-center p-6">
        <UIcon :name="serviceIcon" class="text-4xl text-gray-400 mb-4" />
        <h3 class="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">
          {{ $t('chat.start_conversation') }}
        </h3>
        <p class="text-gray-500 dark:text-gray-400 max-w-md mb-6">
          {{ serviceDescription }}
        </p>
        <div class="grid grid-cols-2 gap-3 max-w-md">
          <UButton
              v-for="suggestion in suggestions"
              :key="suggestion"
              variant="soft"
              color="gray"
              @click="$emit('use-suggestion', suggestion)"
              class="text-sm text-left justify-start"
          >
            {{ suggestion }}
          </UButton>
        </div>
      </div>
    </template>

    <!-- Mensajes -->
    <template v-else>
      <div
          v-for="message in messages"
          :key="message.id"
          class="flex"
          :class="message.role === 'user' ? 'justify-end' : 'justify-start'"
      >
        <div
            class="flex max-w-3xl rounded-xl px-4 py-3 shadow-sm"
            :class="message.role === 'user'
          ? 'bg-primary-500 text-white rounded-br-none'
          : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-none border border-gray-200 dark:border-gray-700'"
        >
          <div v-if="message.role === 'assistant'" class="w-6 h-6 rounded-full flex items-center justify-center mr-2 mt-1 flex-shrink-0"
               :class="serviceColor">
            <UIcon :name="serviceIcon" class="text-white text-xs" />
          </div>
          <div>
            <div v-html="message.content" class="prose prose-sm dark:prose-invert max-w-none"></div>
            <div v-if="message.role === 'assistant'" class="mt-1 text-right">
              <UButton
                  size="xs"
                  color="gray"
                  variant="link"
                  icon="i-heroicons-document-duplicate"
                  @click="copyToClipboard(message.content)"
              >
                {{ $t('chat.copy') }}
              </UButton>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Indicador de escritura -->
    <div v-if="isTyping" class="flex justify-start">
      <div class="flex max-w-3xl p-4 rounded-xl rounded-bl-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 shadow-sm">
        <div class="w-6 h-6 rounded-full flex items-center justify-center mr-2 flex-shrink-0"
             :class="serviceColor">
          <UIcon :name="serviceIcon" class="text-white text-xs" />
        </div>
        <div class="flex space-x-1">
          <span class="animate-bounce">•</span>
          <span class="animate-bounce" style="animation-delay: 0.2s">•</span>
          <span class="animate-bounce" style="animation-delay: 0.4s">•</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue';
import { ChatMessage } from '~/composables/useApiService';

const props = defineProps<{
  messages: ChatMessage[];
  isTyping: boolean;
  serviceIcon: string;
  serviceColor: string;
  serviceDescription: string;
  suggestions: string[];
}>();

const emit = defineEmits<{
  (e: 'use-suggestion', suggestion: string): void;
}>();

const messagesContainer = ref<HTMLElement | null>(null);

// Copiar al portapapeles
function copyToClipboard(text: string) {
  // Eliminar etiquetas HTML
  const plainText = text.replace(/<[^>]*>/g, '');
  navigator.clipboard.writeText(plainText);
}

// Scroll al final de los mensajes
function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
}

// Auto-scroll cuando cambian los mensajes o el estado de escritura
watch(() => [props.messages, props.isTyping], () => {
  scrollToBottom();
}, { deep: true });

// Scroll inicial
onMounted(() => {
  scrollToBottom();
});
</script>