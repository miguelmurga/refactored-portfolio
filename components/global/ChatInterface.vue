<template>
  <div class="flex h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Sidebar -->
    <div class="w-72 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col transition-all duration-300 ease-in-out">
      <!-- Logo y título -->
      <div class="p-4 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center space-x-2">
          <UIcon name="i-heroicons-cpu-chip" class="text-primary-500 text-2xl" />
          <h1 class="text-xl font-bold text-gray-800 dark:text-white">AI Hub</h1>
        </div>
      </div>

      <!-- Selector de servicios -->
      <div class="p-4">
        <UButton
            block
            color="primary"
            variant="solid"
            class="justify-start mb-4"
            @click="showServiceSelector = true"
        >
          <template #leading>
            <UIcon name="i-heroicons-plus" />
          </template>
          {{ t('chat.new_chat') }}
        </UButton>

        <!-- Filtro de conversaciones -->
        <div class="relative mb-4">
          <UInput
              v-model="searchQuery"
              :placeholder="t('chat.search_conversations')"
              icon="i-heroicons-magnifying-glass"
              class="w-full"
          />
        </div>
      </div>

      <!-- Conversaciones recientes -->
      <div class="flex-1 overflow-y-auto p-2">
        <p class="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
          {{ t('chat.recent_conversations') }}
        </p>
        <TransitionGroup name="list" tag="div">
          <div
              v-for="chat in filteredConversations"
              :key="chat.id"
              @click="selectChat(chat.id)"
              class="p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer mb-2 transition-all duration-200"
              :class="{ 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800': selectedChat === chat.id }"
          >
            <div class="flex items-center">
              <div class="w-8 h-8 rounded-full flex items-center justify-center mr-3" :class="getServiceColor(chat.service)">
                <UIcon :name="getServiceIcon(chat.service)" class="text-white" />
              </div>
              <div class="flex-1">
                <div class="font-medium truncate">{{ chat.title }}</div>
                <div class="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {{ formatDate(chat.lastUpdated) }}
                </div>
              </div>
            </div>
          </div>
        </TransitionGroup>
      </div>

      <!-- User Settings -->
      <div class="p-4 border-t border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <UButton
              color="gray"
              variant="ghost"
              class="justify-start"
          >
            <template #leading>
              <UIcon name="i-heroicons-user-circle" />
            </template>
            {{ t('chat.user_settings') }}
          </UButton>
          <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-moon"
              @click="toggleDarkMode"
          />
        </div>
      </div>
    </div>

    <!-- Main Chat Area -->
    <div class="flex-1 flex flex-col">
      <!-- Selector de servicios modal -->
      <UModal v-model="showServiceSelector" :ui="{ width: 'sm:max-w-lg' }">
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold">{{ t('chat.select_service') }}</h3>
              <UButton
                  color="gray"
                  variant="ghost"
                  icon="i-heroicons-x-mark"
                  @click="showServiceSelector = false"
              />
            </div>
          </template>

          <div class="grid grid-cols-2 gap-4 p-2">
            <div
                v-for="service in services"
                :key="service.id"
                @click="createNewChat(service.id)"
                class="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md cursor-pointer transition-all duration-200"
                :class="{'bg-primary-50 dark:bg-primary-900/20': service.id === pendingService}"
            >
              <div class="w-12 h-12 rounded-full flex items-center justify-center mb-3 mx-auto" :class="getServiceColor(service.id)">
                <UIcon :name="service.icon" class="text-white text-xl" />
              </div>
              <h4 class="font-medium text-center mb-1">{{ service.name }}</h4>
              <p class="text-xs text-gray-500 dark:text-gray-400 text-center">
                {{ service.description }}
              </p>
            </div>
          </div>
        </UCard>
      </UModal>

      <!-- Top Bar -->
      <div class="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div
              v-if="currentChat"
              class="w-8 h-8 rounded-full flex items-center justify-center"
              :class="getServiceColor(currentChat.service)"
          >
            <UIcon :name="getServiceIcon(currentChat.service)" class="text-white" />
          </div>
          <div>
            <h2 class="text-lg font-medium">{{ currentChatTitle }}</h2>
            <p class="text-xs text-gray-500 dark:text-gray-400" v-if="currentChat">
              {{ getServiceName(currentChat.service) }} • {{ t('chat.messages', { count: currentMessages.length }) }}
            </p>
          </div>
        </div>
        <div class="flex space-x-2">
          <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-arrow-path"
              @click="refreshConversation"
              :loading="isRefreshing"
              :disabled="isTyping"
          />
          <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-trash"
              @click="confirmDelete = true"
          />
          <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-information-circle"
              @click="showInfo = true"
          />
        </div>
      </div>

      <!-- Messages Area -->
      <div class="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50 dark:bg-gray-900" ref="messagesContainer">
        <template v-if="currentMessages.length === 0">
          <div class="flex flex-col items-center justify-center h-full text-center p-6">
            <UIcon :name="getServiceIcon(currentChat?.service || 'default')" class="text-4xl text-gray-400 mb-4" />
            <h3 class="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ t('chat.start_conversation') }}
            </h3>
            <p class="text-gray-500 dark:text-gray-400 max-w-md mb-6">
              {{ getCurrentServiceDescription() }}
            </p>
            <div class="grid grid-cols-2 gap-3 max-w-md">
              <UButton
                  v-for="suggestion in chatSuggestions[currentChat?.service || 'default']"
                  :key="suggestion"
                  variant="soft"
                  color="gray"
                  @click="setInputMessage(suggestion)"
                  class="text-sm text-left justify-start"
              >
                {{ suggestion }}
              </UButton>
            </div>
          </div>
        </template>

        <transition-group name="chat">
          <div
              v-for="message in currentMessages"
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
                   :class="getServiceColor(currentChat?.service || 'default')">
                <UIcon :name="getServiceIcon(currentChat?.service || 'default')" class="text-white text-xs" />
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
                    {{ t('chat.copy') }}
                  </UButton>
                </div>
              </div>
            </div>
          </div>
        </transition-group>

        <div v-if="isTyping" class="flex justify-start">
          <div class="flex max-w-3xl p-4 rounded-xl rounded-bl-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 shadow-sm">
            <div class="w-6 h-6 rounded-full flex items-center justify-center mr-2 flex-shrink-0"
                 :class="getServiceColor(currentChat?.service || 'default')">
              <UIcon :name="getServiceIcon(currentChat?.service || 'default')" class="text-white text-xs" />
            </div>
            <div class="flex space-x-1">
              <span class="animate-bounce">•</span>
              <span class="animate-bounce" style="animation-delay: 0.2s">•</span>
              <span class="animate-bounce" style="animation-delay: 0.4s">•</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Input Area -->
      <div class="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
        <form @submit.prevent="sendMessage" class="relative">
          <UTextarea
              v-model="inputMessage"
              :placeholder="t('chat.type_message')"
              autoresize
              class="pr-20 pl-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:border-primary-300 dark:focus:border-primary-700"
              :rows="1"
              :maxRows="6"
              @keydown.enter.prevent="handleEnterKey"
          />
          <div class="absolute right-2 bottom-2 flex space-x-1">
            <UButton
                v-if="currentChat?.service === 'db-agent'"
                color="gray"
                variant="ghost"
                icon="i-heroicons-table-cells"
                aria-label="View data schema"
                @click="showSchema = true"
            />
            <UButton
                color="primary"
                variant="solid"
                icon="i-heroicons-paper-airplane"
                class="rounded-lg"
                :disabled="!inputMessage.trim() || isTyping"
                type="submit"
                aria-label="Send message"
            />
          </div>
        </form>
        <div class="flex justify-between mt-2 text-xs text-gray-500 px-1">
          <div>{{ getModelInfo() }}</div>
          <div>{{ t('chat.privacy_note') }}</div>
        </div>
      </div>

      <!-- Delete confirmation modal -->
      <UModal v-model="confirmDelete">
        <UCard>
          <template #header>
            <div class="text-lg font-semibold">{{ t('chat.confirm_delete') }}</div>
          </template>
          <p>{{ t('chat.delete_confirmation') }}</p>
          <template #footer>
            <div class="flex justify-end gap-2">
              <UButton color="gray" variant="ghost" @click="confirmDelete = false">
                {{ t('common.cancel') }}
              </UButton>
              <UButton color="red" @click="deleteConversation">
                {{ t('common.delete') }}
              </UButton>
            </div>
          </template>
        </UCard>
      </UModal>

      <!-- Información del servicio modal -->
      <UModal v-model="showInfo">
        <UCard>
          <template #header>
            <div class="flex items-center space-x-3">
              <div
                  v-if="currentChat"
                  class="w-8 h-8 rounded-full flex items-center justify-center"
                  :class="getServiceColor(currentChat.service)"
              >
                <UIcon :name="getServiceIcon(currentChat.service)" class="text-white" />
              </div>
              <h3 class="text-lg font-semibold">{{ getServiceName(currentChat?.service || 'default') }}</h3>
            </div>
          </template>
          <div class="space-y-4">
            <p>{{ getCurrentServiceDescription() }}</p>
            <div class="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
              <h4 class="font-medium mb-2">{{ t('chat.capabilities') }}</h4>
              <ul class="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-300">
                <li v-for="capability in getServiceCapabilities()" :key="capability">
                  {{ capability }}
                </li>
              </ul>
            </div>
          </div>
          <template #footer>
            <UButton block color="primary" @click="showInfo = false">
              {{ t('common.close') }}
            </UButton>
          </template>
        </UCard>
      </UModal>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useNuxtApp } from '#app'

const { t } = useI18n()
const nuxtApp = useNuxtApp()

// Estado
const inputMessage = ref('')
const isTyping = ref(false)
const isRefreshing = ref(false)
const selectedChat = ref<number | null>(null)
const messagesContainer = ref<HTMLElement | null>(null)
const searchQuery = ref('')
const showServiceSelector = ref(false)
const pendingService = ref('')
const confirmDelete = ref(false)
const showInfo = ref(false)
const showSchema = ref(false)
const copiedMessage = ref(false)

// Definición de servicios
const services = [
  {
    id: 'cybersecurity',
    name: t('services.cybersecurity.name'),
    description: t('services.cybersecurity.description'),
    icon: 'i-heroicons-shield-check',
    color: 'bg-indigo-600'
  },
  {
    id: 'llm',
    name: t('services.llm.name'),
    description: t('services.llm.description'),
    icon: 'i-heroicons-cpu-chip',
    color: 'bg-emerald-600'
  },
  {
    id: 'db-agent',
    name: t('services.db_agent.name'),
    description: t('services.db_agent.description'),
    icon: 'i-heroicons-database',
    color: 'bg-amber-600'
  },
  {
    id: 'knowledge-base',
    name: t('services.knowledge_base.name'),
    description: t('services.knowledge_base.description'),
    icon: 'i-heroicons-document-text',
    color: 'bg-blue-600'
  }
]

// Sugerencias de chat para cada servicio
const chatSuggestions = {
  'cybersecurity': [
    t('suggestions.cybersecurity.s1'),
    t('suggestions.cybersecurity.s2'),
    t('suggestions.cybersecurity.s3'),
    t('suggestions.cybersecurity.s4')
  ],
  'llm': [
    t('suggestions.llm.s1'),
    t('suggestions.llm.s2'),
    t('suggestions.llm.s3'),
    t('suggestions.llm.s4')
  ],
  'db-agent': [
    t('suggestions.db_agent.s1'),
    t('suggestions.db_agent.s2'),
    t('suggestions.db_agent.s3'),
    t('suggestions.db_agent.s4')
  ],
  'knowledge-base': [
    t('suggestions.knowledge_base.s1'),
    t('suggestions.knowledge_base.s2'),
    t('suggestions.knowledge_base.s3'),
    t('suggestions.knowledge_base.s4')
  ],
  'default': [
    t('suggestions.default.s1'),
    t('suggestions.default.s2'),
    t('suggestions.default.s3'),
    t('suggestions.default.s4')
  ]
}

// Simulando conversaciones
const conversations = ref([
  {
    id: 1,
    title: 'Vulnerabilidades en aplicaciones web',
    service: 'cybersecurity',
    messages: [],
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2 horas atrás
  },
  {
    id: 2,
    title: 'Diferencias entre GPT-4 y LLaMA',
    service: 'llm',
    messages: [],
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 24) // 1 día atrás
  },
  {
    id: 3,
    title: 'Consulta de ventas del último trimestre',
    service: 'db-agent',
    messages: [],
    lastUpdated: new Date(Date.now() - 1000 * 60 * 30) // 30 minutos atrás
  }
])

// Conversaciones filtradas
const filteredConversations = computed(() => {
  if (!searchQuery.value) return conversations.value.sort((a, b) =>
      b.lastUpdated.getTime() - a.lastUpdated.getTime());

  const query = searchQuery.value.toLowerCase();
  return conversations.value
      .filter(conv => conv.title.toLowerCase().includes(query))
      .sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime());
})

// Mensajes actuales
const currentMessages = ref([])

// Chat actual
const currentChat = computed(() => {
  return conversations.value.find(c => c.id === selectedChat.value) || null
})

// Título de la conversación actual
const currentChatTitle = computed(() => {
  return currentChat.value ? currentChat.value.title : t('chat.select_service_to_start')
})

// Helpers
const getServiceColor = (serviceId) => {
  const service = services.find(s => s.id === serviceId);
  return service ? service.color : 'bg-gray-600';
}

const getServiceIcon = (serviceId) => {
  const service = services.find(s => s.id === serviceId);
  return service ? service.icon : 'i-heroicons-chat-bubble-left-right';
}

const getServiceName = (serviceId) => {
  const service = services.find(s => s.id === serviceId);
  return service ? service.name : t('chat.ai_assistant');
}

const getCurrentServiceDescription = () => {
  if (!currentChat.value) return t('chat.select_service_description');
  const service = services.find(s => s.id === currentChat.value.service);
  return service ? service.description : '';
}

const getServiceCapabilities = () => {
  if (!currentChat.value) return [];

  switch(currentChat.value.service) {
    case 'cybersecurity':
      return [
        t('capabilities.cybersecurity.c1'),
        t('capabilities.cybersecurity.c2'),
        t('capabilities.cybersecurity.c3'),
        t('capabilities.cybersecurity.c4')
      ];
    case 'llm':
      return [
        t('capabilities.llm.c1'),
        t('capabilities.llm.c2'),
        t('capabilities.llm.c3'),
        t('capabilities.llm.c4')
      ];
    case 'db-agent':
      return [
        t('capabilities.db_agent.c1'),
        t('capabilities.db_agent.c2'),
        t('capabilities.db_agent.c3'),
        t('capabilities.db_agent.c4')
      ];
    case 'knowledge-base':
      return [
        t('capabilities.knowledge_base.c1'),
        t('capabilities.knowledge_base.c2'),
        t('capabilities.knowledge_base.c3'),
        t('capabilities.knowledge_base.c4')
      ];
    default:
      return [];
  }
}

const getModelInfo = () => {
  if (!currentChat.value) return '';

  switch(currentChat.value.service) {
    case 'cybersecurity':
      return t('chat.powered_by_gpt4');
    case 'llm':
      return t('chat.powered_by_gpt4');
    case 'db-agent':
      return t('chat.powered_by_gpt4_with_db');
    case 'knowledge-base':
      return t('chat.powered_by_gpt4_with_kb');
    default:
      return t('chat.powered_by_gpt4');
  }
}

const formatDate = (date) => {
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

// Seleccionar chat
const selectChat = (chatId: number) => {
  selectedChat.value = chatId;
  const chat = conversations.value.find(c => c.id === chatId);

  if (chat) {
    if (chat.messages.length > 0) {
      currentMessages.value = chat.messages;
    } else {
      // Simular carga de mensajes desde backend
      isTyping.value = true;
      setTimeout(() => {
        currentMessages.value = [
          {
            id: 1,
            role: 'assistant',
            content: getWelcomeMessage(chat.service)
          }
        ];

        // Guardar en la conversación
        chat.messages = [...currentMessages.value];
        isTyping.value = false;

        // Scroll to bottom
        scrollToBottom();
      }, 600);
    }
  }
}

// Iniciar nuevo chat basado en servicio
const createNewChat = (serviceId: string) => {
  pendingService.value = serviceId;

  // Ocultar selector
  showServiceSelector.value = false;

  // Crear nueva conversación
  const newId = conversations.value.length ? Math.max(...conversations.value.map(c => c.id)) + 1 : 1;
  const newChat = {
    id: newId,
    title: getServiceName(serviceId),
    service: serviceId,
    messages: [],
    lastUpdated: new Date()
  };

  conversations.value.push(newChat);
  selectedChat.value = newId;

  // Mostrar mensaje de bienvenida
  isTyping.value = true;
  currentMessages.value = [];

  setTimeout(() => {
    currentMessages.value = [
      {
        id: 1,
        role: 'assistant',
        content: getWelcomeMessage(serviceId)
      }
    ];

    // Guardar en la conversación
    newChat.messages = [...currentMessages.value];
    isTyping.value = false;
    pendingService.value = '';

    // Scroll to bottom
    scrollToBottom();
  }, 800);
}

// Obtener mensaje de bienvenida según el servicio
const getWelcomeMessage = (serviceId: string) => {
  switch(serviceId) {
    case 'cybersecurity':
      return t('welcome.cybersecurity');
    case 'llm':
      return t('welcome.llm');
    case 'db-agent':
      return t('welcome.db_agent');
    case 'knowledge-base':
      return t('welcome.knowledge_base');
    default:
      return t('chat.welcome_message');
  }
}

// Enviar mensaje
const sendMessage = async () => {
  if (!inputMessage.value.trim() || isTyping.value) return;
  if (!currentChat.value) {
    showServiceSelector.value = true;
    return;
  }

  // Añadir mensaje del usuario
  const userMessageId = currentMessages.value.length + 1;
  currentMessages.value.push({
    id: userMessageId,
    role: 'user',
    content: inputMessage.value
  });

  // Si es el primer mensaje del usuario, actualizar el título
  if (currentMessages.value.length === 2) { // El primero es el de bienvenida
    // Actualizar el título de la conversación actual
    const chatIndex = conversations.value.findIndex(c => c.id === selectedChat.value);
    if (chatIndex !== -1) {
      conversations.value[chatIndex].title = inputMessage.value.slice(0, 30) + (inputMessage.value.length > 30 ? '...' : '');
    }
  }

  // Actualizar timestamp
  if (currentChat.value) {
    currentChat.value.lastUpdated = new Date();
  }

  // Guardar el mensaje del usuario en la conversación actual
  if (selectedChat.value) {
    const chatIndex = conversations.value.findIndex(c => c.id === selectedChat.value);
    if (chatIndex !== -1) {
      conversations.value[chatIndex].messages = [...currentMessages.value];
    }
  }

  // Limpiar input
  inputMessage.value = '';

  // Scrollear al final
  scrollToBottom();

  // Aquí es donde enviarías la solicitud al backend de Django
  // Por ahora, simularemos la respuesta
  isTyping.value = true;

  // Esta parte sería sustituida por una llamada a la API de Django
  // const response = await fetch('/api/chat', {
  //   method: 'POST',
  //   body: JSON.stringify({
  //     message: userMessage,
  //     service: currentChat.value.service,
  //     conversationId: selectedChat.value
  //   }),
  //   headers: {
  //     'Content-Type': 'application/json'
  //   }
  // });
  // const data = await response.json();

  // Simular respuesta con un retraso
  setTimeout(() => {
    const assistantMessageId = currentMessages.value.length + 1;
    let responseContent = '';

    // Respuestas simuladas según el servicio
    switch(currentChat.value.service) {
      case 'cybersecurity':
        responseContent = `<p>${t('responses.cybersecurity')}</p>`;
        break;
      case 'llm':
        responseContent = `<p>${t('responses.llm')}</p>`;
        break;
      case 'db-agent':
        responseContent = `<p>${t('responses.db_agent')}</p><pre><code>SELECT * FROM sales WHERE quarter = 'Q3' ORDER BY amount DESC LIMIT 10;</code></pre>`;
        break;
      case 'knowledge-base':
        responseContent = `<p>${t('responses.knowledge_base')}</p>`;
        break;
      default:
        responseContent = `<p>${t('chat.example_response')}</p>`;
    }

    currentMessages.value.push({
      id: assistantMessageId,
      role: 'assistant',
      content: responseContent
    });

    // Actualizar mensajes en la conversación
    if (selectedChat.value) {
      const chatIndex = conversations.value.findIndex(c => c.id === selectedChat.value);
      if (chatIndex !== -1) {
        conversations.value[chatIndex].messages = [...currentMessages.value];
      }
    }

    isTyping.value = false;

    // Scrollear al final después de responder
    scrollToBottom();
  }, 1500);
}

// Copiar al portapapeles
const copyToClipboard = (text) => {
  // Eliminar etiquetas HTML
  const plainText = text.replace(/<[^>]*>/g, '');
  navigator.clipboard.writeText(plainText).then(() => {
    // Mostrar feedback
    copiedMessage.value = true;
    setTimeout(() => {
      copiedMessage.value = false;
    }, 2000);
  });
}

// Refrescar conversación
const refreshConversation = () => {
  if (!currentChat.value || isRefreshing.value) return;

  isRefreshing.value = true;

  // Aquí harías una llamada a la API para obtener la conversación actualizada
  // Por ahora, simularemos un refresco
  setTimeout(() => {
    isRefreshing.value = false;
  }, 800);
}

// Eliminar conversación
const deleteConversation = () => {
  if (!currentChat.value) return;

  const index = conversations.value.findIndex(c => c.id === selectedChat.value);
  if (index !== -1) {
    conversations.value.splice(index, 1);
    currentMessages.value = [];
    selectedChat.value = null;
  }

  confirmDelete.value = false;
}

// Toggle modo oscuro
const toggleDarkMode = () => {
  // Implementar lógica de cambio de tema
  // Esto dependería de cómo manejas el tema en tu aplicación Nuxt
}

// Establecer mensaje en el input
const setInputMessage = (text) => {
  inputMessage.value = text;
  // Focus en el textarea
  nextTick(() => {
    const textarea = document.querySelector('textarea');
    if (textarea) textarea.focus();
  });
}

// Manejar tecla Enter
const handleEnterKey = (e) => {
  // Si está presionando shift+enter, permitir nueva línea
  if (e.shiftKey) return;

  // De lo contrario, enviar mensaje
  sendMessage();
}

// Scroll al final
const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
}

// Auto-scroll al final cuando se añaden nuevos mensajes
watch(currentMessages, () => {
  scrollToBottom();
});

// Scroll inicial al final
onMounted(() => {
  scrollToBottom();
});
</script>

<style scoped>
/* Transición para las conversaciones */
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

/* Transición para los mensajes de chat */
.chat-enter-active,
.chat-leave-active {
  transition: all 0.3s ease;
}
.chat-enter-from,
.chat-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>