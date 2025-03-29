<template>
  <div class="flex h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Sidebar -->
    <ChatSidebar
        :conversations="conversations"
        :selected-id="currentConversationId"
        :is-loading="isLoading"
        @select-conversation="selectConversation"
        @new-chat="showServiceSelector = true"
    />

    <!-- Main Chat Area -->
    <div class="flex-1 flex flex-col">
      <!-- Selector de servicios modal -->
      <UModal v-model="showServiceSelector">
        <ServiceSelector
            @select="handleServiceSelect"
            @close="showServiceSelector = false"
        />
      </UModal>

      <!-- Cuando no hay conversación seleccionada -->
      <ChatEmpty
          v-if="!currentConversation"
          @new-chat="showServiceSelector = true"
      />

      <!-- Cuando hay conversación seleccionada -->
      <template v-else>
        <!-- Header -->
        <ChatHeader
            :title="currentConversation.title"
            :subtitle="getServiceName(currentConversation.service)"
            :service-icon="getServiceIcon(currentConversation.service)"
            :service-color="getServiceColor(currentConversation.service)"
            :message-count="currentMessages.length"
            @delete="confirmDelete = true"
            @info="showInfo = true"
        />

        <!-- Mensajes -->
        <ChatMessages
            :messages="currentMessages"
            :is-typing="isTyping"
            :service-icon="getServiceIcon(currentConversation.service)"
            :service-color="getServiceColor(currentConversation.service)"
            :service-description="getServiceDescription(currentConversation.service)"
            :suggestions="getServiceSuggestions(currentConversation.service)"
            @use-suggestion="inputMessage = $event"
        />

        <!-- Input -->
        <ChatInput
            v-model:value="inputMessage"
            :model-info="getModelInfo(currentConversation.service)"
            :disabled="isTyping"
            :show-db-button="currentConversation.service === 'db-agent'"
            @send="sendMessage"
            @view-schema="showSchema = true"
        />
      </template>

      <!-- Modales -->

      <!-- Modal de información del servicio -->
      <UModal v-model="showInfo">
        <UCard v-if="currentConversation">
          <template #header>
            <div class="flex items-center space-x-3">
              <div
                  class="w-8 h-8 rounded-full flex items-center justify-center"
                  :class="getServiceColor(currentConversation.service)"
              >
                <UIcon :name="getServiceIcon(currentConversation.service)" class="text-white" />
              </div>
              <h3 class="text-lg font-semibold">{{ getServiceName(currentConversation.service) }}</h3>
            </div>
          </template>

          <div class="space-y-4">
            <p>{{ getServiceDescription(currentConversation.service) }}</p>
          </div>

          <template #footer>
            <UButton block color="primary" @click="showInfo = false">
              {{ $t('common.close') }}
            </UButton>
          </template>
        </UCard>
      </UModal>

      <!-- Modal de confirmación de eliminación -->
      <UModal v-model="confirmDelete">
        <UCard>
          <template #header>
            <div class="text-lg font-semibold">{{ $t('chat.confirm_delete') }}</div>
          </template>
          <p>{{ $t('chat.delete_confirmation') }}</p>
          <template #footer>
            <div class="flex justify-end gap-2">
              <UButton color="gray" variant="ghost" @click="confirmDelete = false">
                {{ $t('common.cancel') }}
              </UButton>
              <UButton color="red" @click="handleDeleteConversation">
                {{ $t('common.delete') }}
              </UButton>
            </div>
          </template>
        </UCard>
      </UModal>

      <!-- Modal de esquema de BD -->
      <UModal v-model="showSchema">
        <UCard>
          <template #header>
            <div class="text-lg font-semibold">{{ $t('chat.db_schema') }}</div>
          </template>
          <div class="max-h-96 overflow-y-auto">
            <p class="text-center text-gray-500 py-8">
              {{ $t('chat.loading_schema') }}
            </p>
          </div>
          <template #footer>
            <UButton block color="primary" @click="showSchema = false">
              {{ $t('common.close') }}
            </UButton>
          </template>
        </UCard>
      </UModal>
    </div>
  </div>
</template>

<script setup lang="ts">
// Componentes
import ChatSidebar from '~/components/chat/ChatSidebar.vue';
import ChatHeader from '~/components/chat/ChatHeader.vue';
import ChatMessages from '~/components/chat/ChatMessages.vue';
import ChatInput from '~/components/chat/ChatInput.vue';
import ChatEmpty from '~/components/chat/ChatEmpty.vue';
import ServiceSelector from '~/components/chat/ServiceSelector.vue';

// Estado local
const showServiceSelector = ref(false);
const showInfo = ref(false);
const confirmDelete = ref(false);
const showSchema = ref(false);
const inputMessage = ref('');

// Store de chat
const chatStore = useChatStore();
const {
  conversations,
  currentConversation,
  currentConversationId,
  currentMessages,
  isLoading,
  isTyping,
  loadConversations,
  selectConversation,
  startNewConversation,
  sendChatMessage,
  removeConversation
} = chatStore;

// Funciones auxiliares para obtener info de servicio
function getServiceName(serviceId: string): string {
  return getServiceById(serviceId)?.name || 'Servicio';
}

function getServiceDescription(serviceId: string): string {
  return getServiceById(serviceId)?.description || '';
}

function getServiceIcon(serviceId: string): string {
  return getServiceById(serviceId)?.icon || 'i-heroicons-chat-bubble-left-right';
}

function getServiceColor(serviceId: string): string {
  return getServiceById(serviceId)?.color || 'bg-gray-600';
}

function getServiceSuggestions(serviceId: string): string[] {
  return SUGGESTIONS[serviceId as keyof typeof SUGGESTIONS] || [];
}

function getModelInfo(serviceId: string): string {
  switch(serviceId) {
    case 'cybersecurity':
      return 'Impulsado por Azure OpenAI GPT-4';
    case 'llm':
      return 'Impulsado por Azure OpenAI GPT-4';
    case 'db-agent':
      return 'Impulsado por Azure OpenAI GPT-4 con acceso a BD';
    case 'knowledge-base':
      return 'Impulsado por Azure OpenAI GPT-4 con base de conocimientos';
    default:
      return 'Impulsado por Azure OpenAI GPT-4';
  }
}

// Handlers
async function handleServiceSelect(serviceId: string) {
  showServiceSelector.value = false;
  await startNewConversation(serviceId);
}

async function sendMessage(message: string) {
  if (!message.trim()) return;
  await sendChatMessage(message);
}

async function handleDeleteConversation() {
  if (!currentConversation.value) return;

  await removeConversation(currentConversation.value.id);
  confirmDelete.value = false;
}

// Cargar datos al montar
onMounted(async () => {
  await loadConversations();
});
</script>