<template>
  <div class="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50 dark:bg-gray-900" ref="messagesContainer">
    <!-- Estado vacío -->
    <template v-if="sortedMessages.length === 0">
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

    <!-- Mensajes (estilo ChatGPT) -->
    <template v-else>
      <div v-for="(message, index) in sortedMessages" :key="`${message.id}-${index}`" class="mb-4 last:mb-0">
        <!-- Tiempo de mensaje para debugging -->
        <div v-if="DEBUG_MODE" class="text-xs text-gray-400 absolute left-0 -ml-16 mt-2">
          {{ formatTimestamp(message) }}
        </div>
        
        <!-- Encabezado del mensaje con avatar -->
        <div class="flex items-center mb-1">
          <!-- Avatar usuario o asistente -->
          <div 
            v-if="message.role === 'assistant'" 
            class="w-7 h-7 rounded-sm flex items-center justify-center mr-2 flex-shrink-0" 
            :class="serviceColor"
          >
            <UIcon :name="serviceIcon" class="text-white text-xs" />
          </div>
          <div 
            v-else 
            class="w-7 h-7 bg-gray-300 dark:bg-gray-600 rounded-sm flex items-center justify-center mr-2 flex-shrink-0"
          >
            <UIcon name="i-heroicons-user" class="text-white text-xs" />
          </div>
          
          <!-- Nombre del remitente -->
          <div class="text-sm font-medium text-gray-800 dark:text-gray-200">
            {{ message.role === 'user' ? 'Tú' : 'Asistente' }}
          </div>
          
          <!-- Timestamp para estilo ChatGPT (opcional) -->
          <div v-if="showTimestamps" class="ml-2 text-xs text-gray-500">
            {{ formatTimestamp(message) }}
          </div>
        </div>
        
        <!-- Contenido del mensaje -->
        <div 
          class="pl-9 pr-4 max-w-full"
        >
          <div 
            v-html="message.content" 
            class="prose prose-sm dark:prose-invert max-w-none break-words"
          ></div>
          
          <!-- Contexto y fuentes (si existen) -->
          <div v-if="message.role === 'assistant' && message.context_data && message.context_data.length > 0" 
               class="mt-3 text-xs border-t border-gray-200 dark:border-gray-700 pt-2">
            <div class="flex items-center cursor-pointer" @click="toggleSourceVisibility(message)">
              <UIcon 
                :name="isSourceVisible(message) ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
                class="mr-1 text-gray-500"
              />
              <span class="text-gray-600 dark:text-gray-400">
                {{ isSourceVisible(message) ? 'Ocultar fuentes' : 'Mostrar fuentes' }} ({{ message.context_data.length }})
              </span>
            </div>
            
            <div v-if="isSourceVisible(message)" class="mt-2 space-y-2">
              <div v-for="(source, idx) in message.context_data" :key="idx" 
                   class="p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                <div class="font-medium">{{ source.title || 'Documento' }}</div>
                <div class="text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">{{ source.text }}</div>
                <div class="mt-1 flex justify-between">
                  <span v-if="source.domain" class="text-gray-500">{{ source.domain }}</span>
                  <span class="text-blue-600 dark:text-blue-400">
                    {{ Math.round((source.rerank_score || source.score || 0) * 100) }}% relevancia
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Acciones -->
          <div v-if="message.role === 'assistant'" class="mt-2 flex justify-end">
            <UButton
              size="xs"
              color="gray"
              variant="ghost"
              icon="i-heroicons-document-duplicate"
              @click="copyToClipboard(message.content)"
            >
              {{ $t('chat.copy') }}
            </UButton>
          </div>
        </div>
      </div>
    </template>

    <!-- Indicador de escritura (estilo ChatGPT) -->
    <div v-if="isTyping" class="mb-4 last:mb-0">
      <!-- Encabezado del mensaje con avatar -->
      <div class="flex items-center mb-1">
        <!-- Avatar asistente -->
        <div 
          class="w-7 h-7 rounded-sm flex items-center justify-center mr-2 flex-shrink-0" 
          :class="serviceColor"
        >
          <UIcon :name="serviceIcon" class="text-white text-xs" />
        </div>
        
        <!-- Nombre del remitente -->
        <div class="text-sm font-medium text-gray-800 dark:text-gray-200">
          Asistente
        </div>
      </div>
      
      <!-- Indicador de escritura -->
      <div class="pl-9 pr-4">
        <div class="flex space-x-1 h-6 items-center">
          <span class="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"></span>
          <span class="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style="animation-delay: 0.2s"></span>
          <span class="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style="animation-delay: 0.4s"></span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, nextTick, computed } from 'vue';
import { ChatMessage } from '~/composables/useApiService';

const props = defineProps<{
  messages: ChatMessage[];
  isTyping: boolean;
  serviceIcon: string;
  serviceColor: string;
  serviceDescription: string;
  suggestions: string[];
}>();

// ✅ FIXED: NO REORDENAR - El store ya envía en el orden correcto del backend
const sortedMessages = computed(() => {
  console.log(`[ChatMessages] ✅ RECIBIENDO ${props.messages.length} mensajes del store (SIN reordenar)`);
  console.log(`[ChatMessages] 📨 Mensajes en orden original del backend:`);
  props.messages.forEach((msg, idx) => {
    const timestamp = msg.created_at || msg._timestamp || msg._time || 'Sin timestamp';
    console.log(`[ChatMessages] ${idx+1}. Role=${msg.role}, ID=${msg.id}, Timestamp=${timestamp}, Content="${msg.content?.substring(0, 30)}..."`);
  });
  
  // ✅ RETORNAR EXACTAMENTE LO QUE ENVÍA EL STORE (backend order)
  return props.messages;
});

const emit = defineEmits<{
  (e: 'use-suggestion', suggestion: string): void;
}>();

const messagesContainer = ref<HTMLElement | null>(null);
const toast = useToast();
const { $t } = useNuxtApp();

// Modo debug para mostrar timestamps (opcional, dejar en false para producción)
const DEBUG_MODE = false;

// Mostrar timestamps en la UI (estilo ChatGPT)
const showTimestamps = ref(false);

// Visibilidad de fuentes por mensaje
const visibleSources = ref(new Set<string | number>());

// Alternar visibilidad de fuentes
function toggleSourceVisibility(message: ChatMessage) {
  const messageId = message.id.toString();
  if (visibleSources.value.has(messageId)) {
    visibleSources.value.delete(messageId);
  } else {
    visibleSources.value.add(messageId);
  }
}

// Verificar si las fuentes están visibles
function isSourceVisible(message: ChatMessage): boolean {
  return visibleSources.value.has(message.id.toString());
}

// Formatear timestamp de mensajes para debugging y visualización
function formatTimestamp(message: ChatMessage): string {
  // Prioridad de timestamps para display
  let timestamp: Date | null = null;
  
  if (message._time) {
    timestamp = new Date(message._time);
  } else if (message._timestamp) {
    timestamp = new Date(message._timestamp);
  } else if (message.created_at) {
    timestamp = new Date(message.created_at);
  }
  
  if (timestamp) {
    return timestamp.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false // Formato 24h
    });
  }
  
  // Si no hay timestamp, mostrar ID
  return `ID: ${message.id}`;
}

// Copiar al portapapeles
function copyToClipboard(text: string) {
  // Eliminar etiquetas HTML
  const plainText = text.replace(/<[^>]*>/g, '');
  navigator.clipboard.writeText(plainText);
  
  // Opcionalmente mostrar confirmación
  alert('Texto copiado al portapapeles');
}

// 🚨 ALERTA: Mostrar advertencia sobre conversaciones largas
let alertShown = false; // Evitar mostrar múltiples veces
function showLongConversationAlert(messageCount: number) {
  console.log(`[ChatMessages] 🚨 showLongConversationAlert called with ${messageCount} messages, alertShown=${alertShown}`);
  
  if (alertShown || messageCount <= 4) {
    console.log(`[ChatMessages] 🚨 Alert skipped: alertShown=${alertShown}, messageCount=${messageCount}`);
    return;
  }
  
  try {
    console.log(`[ChatMessages] 🚨 Showing toast notification...`);
    console.log(`[ChatMessages] 🚨 toast object:`, toast);
    console.log(`[ChatMessages] 🚨 $t function:`, $t);
    
    // Test simple primero
    toast.add({
      title: '⚠️ Conversación extensa',
      description: 'Las conversaciones largas pueden volverse incoherentes o menos confiables. Más info: arxiv.org/pdf/2505.06120',
      icon: 'i-heroicons-exclamation-triangle',
      color: 'amber',
      timeout: 8000
    });
    alertShown = true;
    
    // Reset después de 10 segundos para permitir mostrar de nuevo si se navega
    setTimeout(() => {
      alertShown = false;
      console.log(`[ChatMessages] 🚨 Alert reset - can show again`);
    }, 10000);
    
    console.log(`[ChatMessages] ✅ Alert shown for ${messageCount} messages`);
  } catch (error) {
    console.log(`[ChatMessages] ❌ Error showing alert:`, error);
    console.log(`[ChatMessages] ❌ Error stack:`, error.stack);
  }
}

// Watch específico para detectar cuando se superen los 4 mensajes
watch(() => sortedMessages.value.length, (newLength, oldLength) => {
  console.log(`[ChatMessages] 👀 Message count changed: ${oldLength} -> ${newLength}`);
  if (newLength > 4 && (oldLength === undefined || oldLength <= 4)) {
    console.log(`[ChatMessages] 🎯 Threshold crossed! Showing alert for ${newLength} messages`);
    nextTick(() => {
      showLongConversationAlert(newLength);
    });
  }
}, { immediate: true });

// Scroll al final de los mensajes con mejor robustez
function scrollToBottom() {
  // Intentamos scroll inmediato
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
  
  // Y luego uno después de nextTick para asegurar que el DOM se actualizó
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
      
      // Y un último intento con un pequeño delay para asegurar que imágenes y otros recursos se cargaron
      setTimeout(() => {
        if (messagesContainer.value) {
          messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
        }
      }, 100);
    }
  });
}

// Auto-scroll cuando cambian los mensajes o el estado de escritura
watch(() => [sortedMessages.value, props.isTyping], () => {
  // 🚨 VERIFICAR ALERTA PARA CONVERSACIONES LARGAS
  if (sortedMessages.value.length > 4) {
    console.log(`[ChatMessages] 🚨 ${sortedMessages.value.length} mensajes detectados - mostrando alerta`);
    // Delay para asegurar que no se muestre múltiples veces
    setTimeout(() => {
      showLongConversationAlert(sortedMessages.value.length);
    }, 500);
  }
  // Verificar el orden de los mensajes (solo en modo debug)
  if (DEBUG_MODE && sortedMessages.value.length > 1) {
    console.log(`[ChatMessages] Verificando orden de ${sortedMessages.value.length} mensajes:`);
    sortedMessages.value.forEach((msg, idx) => {
      const timestamp = msg._time || (msg._timestamp ? new Date(msg._timestamp).getTime() : 0) || 
                       (msg.created_at ? new Date(msg.created_at).getTime() : 0);
      console.log(`  ${idx+1}. ${msg.role}: ${formatTimestamp(msg)} (${timestamp || 'sin timestamp'})`);
    });
    
    // Verificar pares USER-ASSISTANT (estilo ChatGPT)
    for (let i = 0; i < props.messages.length - 1; i += 2) {
      if (i + 1 < props.messages.length) {
        const userMsg = props.messages[i];
        const assistantMsg = props.messages[i + 1];
        if (userMsg.role !== 'user' || assistantMsg.role !== 'assistant') {
          console.warn(`[ChatMessages] Par incorrecto en UI: ${userMsg.role}-${assistantMsg.role} en posiciones ${i},${i+1}`);
        }
      }
    }
  }
  
  scrollToBottom();
}, { deep: true });

// Scroll inicial y configurar MutationObserver para detectar cambios en el contenido
onMounted(() => {
  scrollToBottom();
  
  // Registrar la hora de montaje para debugging
  console.log('[ChatMessages] Component mounted at', new Date().toISOString());
  
  // Agregar un mensaje de log para ayudar a depurar
  if (sortedMessages.value.length > 0) {
    console.log(`[ChatMessages] Mounted with ${sortedMessages.value.length} messages`);
    // Comprobar el último mensaje para ver si es el más reciente
    const lastMessage = sortedMessages.value[sortedMessages.value.length - 1];
    console.log(`[ChatMessages] Last message is role=${lastMessage.role}, content="${lastMessage.content.substring(0, 30)}..."`);
  } else {
    console.log('[ChatMessages] Mounted with empty messages array');
  }
  
  // Crear un MutationObserver para detectar cambios en el DOM y hacer scroll
  const observer = new MutationObserver((mutations) => {
    scrollToBottom();
  });
  
  // Observar cambios en el contenedor de mensajes
  if (messagesContainer.value) {
    observer.observe(messagesContainer.value, {
      childList: true,   // Observar adiciones/eliminaciones de nodos hijos
      subtree: true,     // Observar todos los descendientes
      characterData: true // Observar cambios en el contenido de texto
    });
  }
  
  // También hacemos un scroll adicional después de un pequeño delay
  // para asegurar que todos los recursos (imágenes, etc.) se han cargado
  setTimeout(() => {
    scrollToBottom();
  }, 500);
  
  // Y un último intento en caso de contenido que tarda en renderizarse
  setTimeout(() => {
    scrollToBottom();
  }, 1500);
});
</script>