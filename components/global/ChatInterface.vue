<template>
  <div class="flex h-screen bg-gray-100 dark:bg-gray-900">
    <!-- Sidebar -->
    <div class="w-64 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col">
      <!-- New Chat Button -->
      <div class="p-4">
        <UButton
            block
            color="white"
            variant="solid"
            class="border justify-start dark:border-gray-700 dark:text-white"
            @click="startNewChat"
        >
          <template #leading>
            <UIcon name="i-heroicons-plus" />
          </template>
          {{ t('chat.new_chat') }}
        </UButton>
      </div>

      <!-- Conversations List -->
      <div class="flex-1 overflow-y-auto p-2">
        <div
            v-for="chat in conversations"
            :key="chat.id"
            @click="selectChat(chat.id)"
            class="p-3 rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer mb-1 transition-colors"
            :class="{ 'bg-gray-100 dark:bg-gray-700': selectedChat === chat.id }"
        >
          <div class="flex items-center">
            <UIcon name="i-heroicons-chat-bubble-left" class="mr-2 text-gray-500 dark:text-gray-400" />
            <div class="flex-1 truncate">{{ chat.title }}</div>
          </div>
        </div>
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
          {{ t('chat.user_settings') }}
        </UButton>
      </div>
    </div>

    <!-- Main Chat Area -->
    <div class="flex-1 flex flex-col">
      <!-- Top Bar -->
      <div class="border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
        <div class="flex items-center">
          <h2 class="text-lg font-medium">{{ currentChatTitle }}</h2>
        </div>
        <div>
          <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-adjustments-horizontal"
              aria-label="Settings"
          />
        </div>
      </div>

      <!-- Messages Area -->
      <div class="flex-1 overflow-y-auto p-4 space-y-6" ref="messagesContainer">
        <div
            v-for="message in currentMessages"
            :key="message.id"
            class="flex"
            :class="message.role === 'user' ? 'justify-end' : 'justify-start'"
        >
          <div
              class="max-w-3xl p-4 rounded-lg"
              :class="message.role === 'user'
              ? 'bg-primary-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'"
          >
            <div v-html="message.content"></div>
          </div>
        </div>
        <div v-if="isTyping" class="flex justify-start">
          <div class="max-w-3xl p-4 rounded-lg bg-gray-200 dark:bg-gray-700">
            <ULoader size="sm" />
          </div>
        </div>
      </div>

      <!-- Input Area -->
      <div class="border-t border-gray-200 dark:border-gray-700 p-4">
        <div class="relative">
          <UTextarea
              v-model="inputMessage"
              :placeholder="t('chat.type_message')"
              autoresize
              class="pr-10"
              :rows="1"
              @keydown.enter.prevent="sendMessage"
          />
          <UButton
              color="primary"
              variant="solid"
              icon="i-heroicons-paper-airplane"
              class="absolute right-2 bottom-2"
              :disabled="!inputMessage.trim()"
              @click="sendMessage"
              aria-label="Send message"
          />
        </div>
        <div class="text-xs text-gray-500 mt-2">
          {{ t('chat.model_info') }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// Estado
const inputMessage = ref('')
const isTyping = ref(false)
const selectedChat = ref<number | null>(1)
const messagesContainer = ref<HTMLElement | null>(null)

// Simulando conversaciones
const conversations = ref([
  { id: 1, title: 'Conversación sobre IA', messages: [] },
  { id: 2, title: 'Ayuda con código Vue', messages: [] },
  { id: 3, title: 'Conceptos de ciberseguridad', messages: [] }
])

// Mensajes actuales
const currentMessages = ref([
  { id: 1, role: 'assistant', content: t('chat.welcome_message') },
])

// Título de la conversación actual
const currentChatTitle = computed(() => {
  const chat = conversations.value.find(c => c.id === selectedChat.value)
  return chat ? chat.title : t('chat.new_conversation')
})

// Seleccionar chat
const selectChat = (chatId: number) => {
  selectedChat.value = chatId
  const chat = conversations.value.find(c => c.id === chatId)
  if (chat && chat.messages.length > 0) {
    currentMessages.value = chat.messages
  } else {
    currentMessages.value = [
      { id: 1, role: 'assistant', content: t('chat.welcome_message') }
    ]
  }
}

// Iniciar nuevo chat
const startNewChat = () => {
  const newId = Math.max(...conversations.value.map(c => c.id)) + 1
  conversations.value.push({
    id: newId,
    title: t('chat.new_conversation'),
    messages: []
  })
  selectedChat.value = newId
  currentMessages.value = [
    { id: 1, role: 'assistant', content: t('chat.welcome_message') }
  ]
}

// Enviar mensaje
const sendMessage = async () => {
  if (!inputMessage.value.trim()) return

  // Añadir mensaje del usuario
  const userMessageId = currentMessages.value.length + 1
  currentMessages.value.push({
    id: userMessageId,
    role: 'user',
    content: inputMessage.value
  })

  // Guardar el mensaje del usuario en la conversación actual
  if (selectedChat.value) {
    const chatIndex = conversations.value.findIndex(c => c.id === selectedChat.value)
    if (chatIndex !== -1) {
      if (conversations.value[chatIndex].messages.length === 0) {
        // Si es el primer mensaje, actualizar el título
        conversations.value[chatIndex].title = inputMessage.value.slice(0, 30) + (inputMessage.value.length > 30 ? '...' : '')
      }
      conversations.value[chatIndex].messages = [...currentMessages.value]
    }
  }

  // Limpiar input
  inputMessage.value = ''

  // Scrollear al final
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }

  // Simular respuesta
  isTyping.value = true
  setTimeout(() => {
    const assistantMessageId = currentMessages.value.length + 1
    currentMessages.value.push({
      id: assistantMessageId,
      role: 'assistant',
      content: `${t('chat.example_response')} "${userMessageId - 1}"`
    })

    // Actualizar mensajes en la conversación
    if (selectedChat.value) {
      const chatIndex = conversations.value.findIndex(c => c.id === selectedChat.value)
      if (chatIndex !== -1) {
        conversations.value[chatIndex].messages = [...currentMessages.value]
      }
    }

    isTyping.value = false

    // Scrollear al final después de responder
    nextTick(() => {
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
      }
    })
  }, 1500)
}

// Auto-scroll al final cuando se añaden nuevos mensajes
watch(currentMessages, () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
})

// Scroll inicial al final
onMounted(() => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
})
</script>