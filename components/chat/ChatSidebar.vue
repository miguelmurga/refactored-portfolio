<template>
  <div class="w-72 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col h-full">
    <!-- Logo y título -->
    <div class="p-4 border-b border-gray-200 dark:border-gray-700">
      <div class="flex items-center space-x-2">
        <UIcon name="i-heroicons-cpu-chip" class="text-primary-500 text-2xl" />
        <h1 class="text-xl font-bold text-gray-800 dark:text-white">AI Hub</h1>
      </div>
    </div>

    <!-- Nuevo chat -->
    <div class="p-4">
      <UButton
          block
          color="primary"
          variant="solid"
          class="justify-start mb-2"
          @click="$emit('new-chat')"
      >
        <template #leading>
          <UIcon name="i-heroicons-plus" />
        </template>
        {{ $t('chat.new_chat') }}
      </UButton>
    </div>

    <!-- Búsqueda -->
    <div class="px-4 pb-2">
      <UInput
          v-model="searchQuery"
          :placeholder="$t('chat.search_conversations')"
          icon="i-heroicons-magnifying-glass"
          class="w-full"
          size="sm"
      />
    </div>

    <!-- Lista de conversaciones -->
    <div class="flex-1 overflow-y-auto p-2">
      <p v-if="isLoading" class="text-center text-gray-500 py-4">
        <UProgress class="w-16 mx-auto" color="primary" :model-value="null" />
      </p>

      <p v-else-if="filteredConversations.length === 0" class="text-center text-gray-500 dark:text-gray-400 py-4 text-sm">
        {{ searchQuery ? $t('chat.no_results') : $t('chat.no_conversations') }}
      </p>

      <template v-else>
        <div
            v-for="chat in filteredConversations"
            :key="chat.id"
            @click="$emit('select-conversation', chat.id)"
            class="p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer mb-2 transition-all duration-200"
            :class="{ 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800': selectedId === chat.id }"
        >
          <div class="flex items-center">
            <div class="w-8 h-8 rounded-full flex items-center justify-center mr-3" :class="getServiceColor(chat.service)">
              <UIcon :name="getServiceIcon(chat.service)" class="text-white" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-medium truncate">
                {{ getConversationTitle(chat) }}
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400">
                {{ formatDate(new Date(chat.lastUpdated)) }}
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- User Settings -->
    <div class="p-4 border-t border-gray-200 dark:border-gray-700">
      <UButton
          block
          color="gray"
          variant="ghost"
          class="justify-start"
      >
        <template #leading>
          <UIcon name="i-heroicons-user-circle" />
        </template>
        {{ $t('chat.user_settings') }}
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { getServiceById, AI_SERVICES } from '~/config/services';
import { Conversation } from '~/composables/useApiService';
const { t } = useI18n();

const props = defineProps<{
  conversations: Conversation[];
  selectedId: number | null;
  isLoading: boolean;
}>();

const emit = defineEmits<{
  (e: 'select-conversation', id: number): void;
  (e: 'new-chat'): void;
}>();

const searchQuery = ref('');

// Filtrar conversaciones por búsqueda
const filteredConversations = computed(() => {
  if (!searchQuery.value) {
    return [...props.conversations].sort((a, b) =>
        new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
  }

  const query = searchQuery.value.toLowerCase();
  return props.conversations
      .filter(conv => conv.title.toLowerCase().includes(query))
      .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
});

// Obtener color de servicio
function getServiceColor(serviceId: string): string {
  const service = getServiceById(serviceId);
  return service?.color || 'bg-gray-600';
}

// Obtener icono de servicio
function getServiceIcon(serviceId: string): string {
  const service = getServiceById(serviceId);
  return service?.icon || 'i-heroicons-chat-bubble-left-right';
}

// Obtener título significativo para la conversación
function getConversationTitle(chat: Conversation): string {
  // Si tiene título, usarlo
  if (chat.title && chat.title.trim() !== '') {
    return chat.title;
  }
  
  // Si no tiene título, pero tiene mensajes, mostrar el primer mensaje del usuario
  if (chat.messages && chat.messages.length > 0) {
    // Buscar el primer mensaje del usuario
    const userMessage = chat.messages.find(m => m.role === 'user' && m.content?.trim() !== '');
    if (userMessage && userMessage.content) {
      // Limitar a 25 caracteres
      const content = userMessage.content.trim();
      return content.length > 25 ? content.substring(0, 25) + '...' : content;
    }
  }
  
  // Si no hay título ni mensajes, mostrar el nombre del servicio
  const serviceName = getServiceById(chat.service)?.name || chat.service;
  return `${t('chat.new_conversation')} - ${serviceName}`;
}

// Formatear fecha
function formatDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) {
    return t('time.just_now');
  } else if (diff < hour) {
    const minutes = Math.floor(diff / minute);
    return t('time.minutes_ago', { minutes });
  } else if (diff < day) {
    const hours = Math.floor(diff / hour);
    return t('time.hours_ago', { hours });
  } else {
    return date.toLocaleDateString();
  }
}
</script>