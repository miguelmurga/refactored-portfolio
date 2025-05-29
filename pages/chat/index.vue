<template>
  <div class="h-screen flex flex-col md:flex-row bg-gray-50 dark:bg-gray-900">
    <!-- Sidebar (visible on desktop, hidden on mobile) -->
    <div class="hidden md:flex md:w-64 bg-gray-800 dark:bg-gray-900 text-white flex-col border-r border-gray-700">
      <!-- New conversation button -->
      <div class="p-4">
        <UButton 
          block
          color="white" 
          variant="ghost" 
          class="border border-gray-700 dark:border-gray-700 justify-between"
          @click="showServiceSelector = true"
        >
          <span>{{ $t('chat.new_chat') }}</span>
          <UIcon name="i-heroicons-plus" />
        </UButton>
      </div>

      <!-- Recent conversations -->
      <div class="flex-1 overflow-y-auto px-3 pb-3">
        <h3 class="px-3 py-2 text-xs font-medium text-gray-400 uppercase">
          {{ $t('chat.recent_conversations') }}
        </h3>
        <div v-if="isLoadingChats" class="py-4 text-center">
          <UProgress class="w-20 mx-auto" color="primary" :model-value="null" />
          <div class="text-sm text-gray-400 mt-2">{{ $t('chat.loading_conversations') }}</div>
        </div>
        <template v-else-if="chatStore.conversations.length === 0">
          <p class="text-gray-400 text-sm text-center py-4">
            {{ $t('chat.no_conversations_yet_message') }}
          </p>
        </template>
        <template v-else>
          <div
            v-for="conv in conversations"
            :key="conv.id"
            @click="navigateToConversation(conv.id)"
            class="group flex items-center gap-3 rounded-md px-3 py-2 cursor-pointer hover:bg-gray-700 transition-colors"
            :class="{'bg-gray-700': chatStore.currentConversationId === conv.id}"
          >
            <UIcon 
              :name="getServiceIcon(conv.service)" 
              class="flex-shrink-0" 
              :class="getServiceColor(conv.service).replaceAll('bg-', 'text-')"
            />
            <div class="flex-1 overflow-hidden">
              <div class="line-clamp-1 text-sm">{{ conv.title || getServiceName(conv.service) }}</div>
              <div class="text-xs text-gray-400 flex justify-between">
                <span>{{ formatDate(new Date(conv.lastUpdated)) }}</span>
                <span v-if="conv.language" class="uppercase">{{ conv.language }}</span>
              </div>
            </div>
            <UButton
              v-if="chatStore.currentConversationId === conv.id"
              color="red"
              variant="ghost"
              icon="i-heroicons-trash"
              size="xs"
              @click.stop="confirmDelete = true"
              class="opacity-0 group-hover:opacity-100"
            />
          </div>
        </template>
      </div>

      <!-- Language selector -->
      <div class="border-t border-gray-700 p-4">
        <div class="flex items-center justify-between mb-3">
          <div class="text-sm font-medium">{{ $t('language') || 'Idioma' }}</div>
        </div>
        <USelectMenu
          v-model="selectedLanguage"
          :options="languageOptions"
          option-attribute="label"
          value-attribute="value"
          size="sm"
          class="w-full text-gray-800 dark:text-white"
          @change="changeLanguage"
        />
      </div>
    </div>

    <!-- Mobile header (visible only on small devices) -->
    <div class="md:hidden flex items-center justify-between bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-3">
      <div class="flex items-center gap-2">
        <UButton
          icon="i-heroicons-bars-3"
          color="gray" 
          variant="ghost"
          @click="mobileMenuOpen = true"
        />
        <div class="font-semibold">{{ $t('common.ai_chat') }}</div>
      </div>
      <UButton
        icon="i-heroicons-plus"
        color="gray"
        variant="ghost"
        @click="showServiceSelector = true"
      />
    </div>
    
    <!-- Main chat area -->
    <div class="flex-1 flex flex-col">
      <!-- Welcome view when no chat is selected -->
      <div class="flex-1 flex flex-col items-center justify-center p-4 sm:p-6">
        <div class="max-w-2xl mx-auto text-center">
          <div class="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-700 to-gray-900 inline-block text-transparent bg-clip-text dark:from-gray-300 dark:to-gray-100">
            AI Chat with MongoDB RAG
          </div>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-10">
            <!-- Agentes especializados (RAG siempre activado) -->
            <template v-for="service in mainServices.filter(s => s.ragAlwaysOn)" :key="service.id">
              <div
                @click="createConversation(service.apiId)"
                class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 sm:p-6 hover:shadow-lg cursor-pointer transition-all hover:border-gray-400 dark:hover:border-gray-500"
              >
                <div class="w-12 h-12 rounded-full flex items-center justify-center mb-3 mx-auto" :class="service.color">
                  <UIcon :name="service.icon" class="text-white text-lg" />
                </div>
                <h3 class="text-lg font-semibold mb-2">{{ $t(`services.${service.id}.name`) || service.name }}</h3>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {{ $t(`services.${service.id}.description`) || service.description }}
                </p>
                <div class="flex flex-col gap-1">
                  <div class="flex gap-1">
                    <UBadge size="sm" color="emerald" variant="solid">{{ $t('chat.rag_always_on') }}</UBadge>
                    <UBadge size="sm" color="gray" variant="subtle">{{ service.model }}</UBadge>
                  </div>
                  <div class="text-xs text-gray-400 mt-1">{{ service.endpoint }}</div>
                </div>
              </div>
            </template>
            
            <!-- Chat General (agregado a mainServices) -->
            <template v-for="service in mainServices.filter(s => !s.ragAlwaysOn)" :key="service.id">
              <div
                @click="() => createConversation(service.apiId)"
                class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 sm:p-6 hover:shadow-lg cursor-pointer transition-all hover:border-gray-400 dark:hover:border-gray-500"
              >
                <div class="w-12 h-12 rounded-full flex items-center justify-center mb-3 mx-auto" :class="service.color">
                  <UIcon :name="service.icon" class="text-white text-lg" />
                </div>
                <h3 class="text-lg font-semibold mb-2">{{ $t(`services.${service.id}.name`) || service.name }}</h3>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {{ $t(`services.${service.id}.description`) || service.description }}
                </p>
                <div class="flex flex-col gap-1">
                  <div class="flex gap-1">
                    <UBadge size="sm" color="blue" variant="subtle">{{ $t('chat.rag_configurable') }}</UBadge>
                    <UBadge size="sm" color="gray" variant="subtle">{{ service.model }}</UBadge>
                  </div>
                  <div class="text-xs text-gray-400 mt-1">{{ service.endpoint }}</div>
                </div>
              </div>
            </template>
          </div>
          
          <div class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-lg mx-auto px-2">
            {{ $t('rag.system_description') || 'Intelligent chat system using MongoDB vector embeddings to provide accurate and contextualized responses to queries in different domains.' }}
          </div>
        </div>
      </div>
    </div>
    
    <!-- Service selector modal -->
    <UModal v-model="showServiceSelector">
      <UCard class="max-w-xl mx-auto w-full">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">{{ $t('chat.select_service') || 'Select service' }}</h3>
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark"
              @click="showServiceSelector = false"
            />
          </div>
        </template>
        
        <div class="space-y-4">
          <!-- Agentes Especializados (RAG siempre activado) -->
          <div>
            <h5 class="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">🤖 {{ $t('chat.specialized_agents') }}</h5>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <template v-for="service in mainServices.filter(s => s.ragAlwaysOn)" :key="service.id">
                <div
                  @click="() => { createConversation(service.apiId); showServiceSelector = false; }"
                  class="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md cursor-pointer transition-all"
                >
                  <div class="text-center">
                    <div class="w-12 h-12 rounded-full flex items-center justify-center mb-3 mx-auto" :class="service.color">
                      <UIcon :name="service.icon" class="text-white text-lg" />
                    </div>
                    <h4 class="font-medium mb-1">{{ $t(`services.${service.id}.name`) || service.name }}</h4>
                    <UBadge size="sm" color="emerald" variant="solid" class="mb-2">{{ $t('chat.rag_always_on') }}</UBadge>
                    <p class="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                      {{ $t(`services.${service.id}.description`) || service.description }}
                    </p>
                    <div class="text-xs text-gray-400 mt-1">→ {{ service.endpoint }}</div>
                  </div>
                </div>
              </template>
            </div>
          </div>
          
          <!-- Chat General (RAG configurable) -->
          <div class="border-t border-gray-200 dark:border-gray-700 pt-3">
            <h5 class="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">💬 {{ $t('chat.general_chat') }}</h5>
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">{{ $t('chat.general_chat_description') }}</p>
            
            <template v-for="service in mainServices.filter(s => !s.ragAlwaysOn)" :key="service.id">
              <div
                @click="() => { createConversation(service.apiId); showServiceSelector = false; }"
                class="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md cursor-pointer transition-all"
              >
                <div class="text-center">
                  <div class="w-12 h-12 rounded-full flex items-center justify-center mb-3 mx-auto" :class="service.color">
                    <UIcon :name="service.icon" class="text-white text-lg" />
                  </div>
                  <h4 class="font-medium mb-1">{{ $t(`services.${service.id}.name`) || service.name }}</h4>
                  <UBadge size="sm" color="blue" variant="subtle" class="mb-2">{{ $t('chat.rag_configurable') }}</UBadge>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    {{ $t(`services.${service.id}.description`) || service.description }}
                  </p>
                  <div class="text-xs text-gray-400 mt-1">{{ service.endpoint }}</div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </UCard>
    </UModal>
    
    <!-- Mobile slideover menu -->
    <USlideover v-model="mobileMenuOpen" side="left">
      <div class="bg-gray-800 dark:bg-gray-900 text-white flex flex-col h-full p-4">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-bold">{{ $t('common.ai_chat') || 'AI Chat' }}</h3>
          <UButton
            color="gray"
            variant="ghost"
            icon="i-heroicons-x-mark"
            @click="mobileMenuOpen = false"
          />
        </div>

        <!-- New conversation button -->
        <UButton 
          block
          color="white" 
          variant="ghost" 
          class="border border-gray-700 justify-between mb-4"
          @click="() => { showServiceSelector = true; mobileMenuOpen = false; }"
        >
          <span>{{ $t('chat.new_chat') || 'New conversation' }}</span>
          <UIcon name="i-heroicons-plus" />
        </UButton>
        
        <!-- Mobile conversations -->
        <div class="flex-1 overflow-y-auto">
          <h3 class="px-3 py-2 text-xs font-medium text-gray-400 uppercase">
            {{ $t('chat.recent_conversations') || 'Recent conversations' }}
          </h3>
          <div v-if="isLoadingChats" class="py-4 text-center">
            <UProgress class="w-20 mx-auto" color="primary" :model-value="null" />
            <div class="text-sm text-gray-400 mt-2">{{ $t('chat.loading_conversations') }}</div>
          </div>
          <template v-else-if="chatStore.conversations.length === 0">
            <p class="text-gray-400 text-sm text-center py-4">
              {{ $t('chat.no_conversations_yet_message') }}
            </p>
          </template>
          <template v-else>
            <div
              v-for="conv in conversations"
              :key="conv.id"
              @click="() => { navigateToConversation(conv.id); mobileMenuOpen = false; }"
              class="group flex items-center gap-3 rounded-md px-3 py-2 cursor-pointer hover:bg-gray-700 transition-colors"
              :class="{'bg-gray-700': chatStore.currentConversationId === conv.id}"
            >
              <UIcon 
                :name="getServiceIcon(conv.service)" 
                class="flex-shrink-0" 
                :class="getServiceColor(conv.service).replaceAll('bg-', 'text-')"
              />
              <div class="flex-1 overflow-hidden">
                <div class="line-clamp-1 text-sm">{{ conv.title || getServiceName(conv.service) }}</div>
                <div class="text-xs text-gray-400">
                  {{ formatDate(new Date(conv.lastUpdated)) }}
                </div>
              </div>
              <UButton
                v-if="chatStore.currentConversationId === conv.id"
                color="red"
                variant="ghost"
                icon="i-heroicons-trash"
                size="xs"
                @click.stop="confirmDelete = true"
              />
            </div>
          </template>
        </div>
        
        <!-- Mobile language selector -->
        <div class="border-t border-gray-700 pt-4 mt-2">
          <div class="flex items-center justify-between mb-3">
            <div class="text-sm font-medium">{{ $t('language') || 'Language' }}</div>
          </div>
          <USelectMenu
            v-model="selectedLanguage"
            :options="languageOptions"
            option-attribute="label"
            value-attribute="value"
            size="sm"
            class="w-full text-gray-800 dark:text-white"
            @change="changeLanguage"
          />
        </div>
      </div>
    </USlideover>
  </div>
</template>

<script setup lang="ts">
// Pinia store
const chatStore = useChatStore();
const { t, locale } = useI18n();
const router = useRouter();
const route = useRoute();

// Local state
const showServiceSelector = ref(false);
const mobileMenuOpen = ref(false);
const selectedLanguage = ref(locale.value);
const confirmDelete = ref(false);

// Asegurarnos de que el estado de carga es visible al usuario
const isLoadingChats = computed(() => chatStore.isLoading);

// Define ALL available services - specialized endpoints have fixed RAG, only /api/chat/ is configurable
const mainServices = [
  {
    id: 'ia_generativa',
    apiId: 'ia_generativa',
    name: 'Experto en IA Generativa',
    description: 'Experto en inteligencia artificial y modelos de lenguaje con documentos especializados',
    icon: 'i-heroicons-cpu-chip',
    color: 'bg-blue-600',
    model: 'DeepSeek-Coder',
    reasoner: 'Especializado en transformers, attention, redes neuronales. RAG siempre activado con documentos de IA.',
    endpoint: '/api/llm-expert/',
    ragFixed: true,
    ragAlwaysOn: true
  },
  {
    id: 'security_expert',
    apiId: 'security_expert',
    name: 'Experto en Ciberseguridad',
    description: 'Experto en seguridad informática y hacking ético con documentos ETHPA',
    icon: 'i-heroicons-shield-check',
    color: 'bg-green-600',
    model: 'DeepSeek-Coder',
    reasoner: 'Especializado en vulnerabilidades, pentesting, seguridad. RAG siempre activado con documentos de seguridad.',
    endpoint: '/api/security-expert/',
    ragFixed: true,
    ragAlwaysOn: true
  },
  {
    id: 'chat_general',
    apiId: 'llm',
    name: 'Chat General',
    description: 'LLM general con RAG configurable para conversaciones con o sin documentos',
    icon: 'i-heroicons-chat-bubble-left-right',
    color: 'bg-gray-600',
    model: 'DeepSeek-Coder',
    reasoner: 'Modelo de lenguaje general. Único endpoint que permite configurar RAG (use_rag: true/false).',
    endpoint: '/api/ai-expert/',
    ragFixed: false, // RAG configurable
    ragAlwaysOn: false
  }
];

// Language options
const languageOptions = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' },
  { value: 'pt', label: 'Português' }
];

// Conversations sorted by date
const conversations = computed(() => {
  return [...chatStore.conversations].sort((a, b) => 
    new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
});

// ✅ INSTRUCCIÓN 5: Navigate to specific conversation with message cleanup
function navigateToConversation(id: number) {
  console.log(`[ChatIndex] Navigating to conversation ${id}`);
  
  // ✅ INSTRUCCIÓN 5: ANTES de navegar, limpiar los mensajes mostrados en UI
  chatStore.clearDisplayedMessages();
  
  // ✅ INSTRUCCIÓN 10: Establecer conversación actual ANTES de navegar
  chatStore.setCurrentConversationId(id);
  
  router.push(`/chat/${id}`);
}

// Create new conversation with detailed debugging
async function createConversation(serviceId: string, useRag?: boolean) {
  const service = mainServices.find(s => s.apiId === serviceId);
  
  console.log(`[ChatIndex] 🔍 CREANDO CONVERSACIÓN:`);
  console.log(`[ChatIndex] → serviceId: ${serviceId}`);
  console.log(`[ChatIndex] → service found:`, service);
  console.log(`[ChatIndex] → endpoint: ${service?.endpoint}`);
  console.log(`[ChatIndex] → RAG fixed: ${service?.ragFixed}`);
  console.log(`[ChatIndex] → useRag param: ${useRag}`);
  
  // Solo asignar use_rag para chat general, los endpoints especializados no lo necesitan
  const finalUseRag = service?.ragAlwaysOn ? undefined : (useRag !== undefined ? useRag : false);
  console.log(`[ChatIndex] → RAG final: ${finalUseRag} (undefined = endpoint no configura RAG)`);
  
  // Deshabilitar UI durante la creación
  isLoadingChats.value = true;
  
  try {
    const result = await chatStore.startNewConversation(serviceId, selectedLanguage.value, { use_rag: finalUseRag });
    
    if (result) {
      console.log(`[ChatIndex] ✅ Conversation created successfully with ID ${result}, navigating...`);
      
      // DEBUGGING CRÍTICO: Verificar que la conversación se creó con el servicio correcto
      console.log(`[ChatIndex] 🔍 VERIFICANDO CONVERSACIÓN CREADA:`);
      const newConversation = chatStore.conversations.find(c => c.id === result);
      if (newConversation) {
        console.log(`[ChatIndex] → Conversación encontrada: ID=${newConversation.id}, service=${newConversation.service}`);
        console.log(`[ChatIndex] → ragConfig:`, newConversation.ragConfig);
      } else {
        console.error(`[ChatIndex] ❌ No se encontró la conversación recién creada con ID ${result}`);
      }
      navigateToConversation(result);
      
      // Asegurar que los datos se persisten
      chatStore.saveConversationsToCache();
    } else {
      console.error('[ChatIndex] ❌ Failed to create conversation');
    }
  } catch (error) {
    console.error('[ChatIndex] ❌ Error creating conversation:', error);
  } finally {
    isLoadingChats.value = false;
    // Cerrar el selector de servicio
    showServiceSelector.value = false;
  }
}

// Format dates
function formatDate(date: Date) {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  
  if (diff < minute) {
    return 'Ahora';
  } else if (diff < hour) {
    const minutes = Math.floor(diff / minute);
    return `hace ${minutes}m`;
  } else if (diff < day) {
    const hours = Math.floor(diff / hour);
    return `hace ${hours}h`;
  } else {
    return date.toLocaleDateString();
  }
}

// Change language
function changeLanguage() {
  locale.value = selectedLanguage.value;
}

// Helpers for service information
function getServiceIcon(serviceId: string) {
  // Usar iconos que sí existan en Nuxt UI para evitar errores
  if (serviceId === 'security_expert') {
    return 'i-heroicons-shield-exclamation';
  } else if (serviceId === 'ia_generativa') {
    return 'i-heroicons-command-line';
  } else if (serviceId === 'rag_conversation') {
    return 'i-heroicons-document-text';
  }
  
  // Fallback a un icono genérico que existe
  return 'i-heroicons-chat-bubble-left-right';
}

function getServiceColor(serviceId: string) {
  const service = mainServices.find(s => s.apiId === serviceId);
  return service?.color || 'bg-gray-600';
}

function getServiceName(serviceId: string) {
  if (!serviceId) return '';
  
  const service = mainServices.find(s => s.apiId === serviceId);
  return service?.name || serviceId;
}

// Cargar datos al montar el componente
onMounted(async () => {
  console.log('[ChatIndex] Component mounted, checking if conversations already loaded');
  
  // ✅ INSTRUCCIÓN 4: Verificar si ya están cargadas
  if (chatStore.conversationsLoaded === true) {
    console.log('[SKIP] Conversations already loaded, skipping');
    
    // Si no hay conversaciones, mostrar el selector de servicio automáticamente
    if (chatStore.conversations.length === 0) {
      console.log('[ChatIndex] No conversations found, showing service selector');
      showServiceSelector.value = true;
    }
    return;
  }
  
  console.log('[ChatIndex] Loading conversations for first time');
  try {
    await chatStore.loadConversations(false); // No forzar recarga
    console.log(`[ChatIndex] Loaded ${chatStore.conversations.length} conversations`);
    
    // Si no hay conversaciones, mostrar el selector de servicio automáticamente
    if (chatStore.conversations.length === 0) {
      console.log('[ChatIndex] No conversations found, showing service selector');
      showServiceSelector.value = true;
    }
  } catch (error) {
    console.error('[ChatIndex] Error loading conversations:', error);
    // Si hay un error, también mostrar el selector de servicio
    showServiceSelector.value = true;
  }
});

// También cargar al activar (cuando el usuario vuelve a esta página)
onActivated(async () => {
  console.log('[ChatIndex] Component activated, checking conversations');
  
  // ✅ INSTRUCCIÓN 4: Verificar si ya están cargadas
  if (chatStore.conversationsLoaded === true) {
    console.log('[SKIP] Conversations already loaded, skipping activation reload');
    
    // Si no hay conversaciones, mostrar el selector de servicio automáticamente
    if (chatStore.conversations.length === 0) {
      console.log('[ChatIndex] No conversations found on activation, showing service selector');
      showServiceSelector.value = true;
    }
    return;
  }
  
  // Si no hay conversaciones cargadas, intentar cargarlas
  if (chatStore.conversations.length === 0) {
    try {
      await chatStore.loadConversations(false); // No forzar recarga
      
      // Si sigue sin haber conversaciones, mostrar el selector
      if (chatStore.conversations.length === 0) {
        showServiceSelector.value = true;
      }
    } catch (error) {
      console.error('[ChatIndex] Error loading conversations on activation:', error);
      showServiceSelector.value = true;
    }
  }
});

// Usamos definePageMeta para configurar transiciones y cache
definePageMeta({
  keepalive: true,
  pageTransition: {
    name: 'page',
    mode: 'out-in'
  }
});
</script>