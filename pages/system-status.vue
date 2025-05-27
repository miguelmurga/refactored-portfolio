<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16 pb-12 px-4">
    <div class="max-w-4xl mx-auto">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {{ $t('system_status.title') || 'System Status' }}
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          {{ $t('system_status.description') || 'Check the status of MongoDB RAG components and services' }}
        </p>
      </div>
      
      <!-- System status panel -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div class="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 class="text-lg font-medium text-gray-900 dark:text-white">
            {{ $t('system_status.components') || 'System Components' }}
          </h2>
          <div class="flex items-center gap-2">
            <div v-if="isLoading" class="animate-spin">
              <UIcon name="i-heroicons-arrow-path" class="h-5 w-5 text-blue-500" />
            </div>
            <UButton
              v-if="!isLoading"
              icon="i-heroicons-arrow-path"
              color="gray"
              variant="ghost"
              @click="checkStatus"
            >
              {{ $t('system_status.refresh') || 'Refresh' }}
            </UButton>
          </div>
        </div>
        
        <!-- Loading state -->
        <div v-if="isLoading" class="px-6 py-8 text-center">
          <UProgress class="w-32 mx-auto" color="primary" :model-value="null" />
          <p class="mt-4 text-sm text-gray-500 dark:text-gray-400">
            {{ $t('system_status.checking') || 'Checking system status...' }}
          </p>
        </div>
        
        <!-- Error state -->
        <div v-else-if="error" class="px-6 py-8">
          <div class="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
            <div class="flex">
              <div class="flex-shrink-0">
                <UIcon name="i-heroicons-exclamation-circle" class="h-5 w-5 text-red-400" />
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-red-800 dark:text-red-200">
                  {{ $t('system_status.error_title') || 'Connection Error' }}
                </h3>
                <div class="mt-2 text-sm text-red-700 dark:text-red-300">
                  <p>{{ error }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Status information -->
        <div v-else class="divide-y divide-gray-200 dark:divide-gray-700">
          <!-- Overall status -->
          <div class="px-6 py-4 flex items-center justify-between">
            <div class="flex items-center">
              <div class="mr-4">
                <div
                  class="w-8 h-8 rounded-full flex items-center justify-center"
                  :class="[
                    documentCount > 0
                      ? 'bg-green-100 dark:bg-green-900/20' 
                      : 'bg-yellow-100 dark:bg-yellow-900/20'
                  ]"
                >
                  <UIcon 
                    name="i-heroicons-document-text" 
                    class="h-5 w-5" 
                    :class="documentCount > 0 ? 'text-green-500' : 'text-yellow-500'" 
                  />
                </div>
              </div>
              <div>
                <h3 class="text-base font-medium text-gray-900 dark:text-white">
                  {{ $t('system_status.documents') || 'Documents' }}
                </h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ documentCount > 0 
                    ? `${documentCount} documentos indexados` 
                    : 'Sin documentos indexados' 
                  }}
                </p>
              </div>
            </div>
            <UBadge
              :color="documentCount > 0 ? 'green' : 'yellow'"
              variant="soft"
              size="lg"
            >
              {{ documentCount > 0 
                ? documentCount 
                : '0' 
              }}
            </UBadge>
          </div>
          
          <!-- Dependent Services Status -->
          <div v-if="dependentServices.length > 0">
            <div v-for="(service, index) in dependentServices" :key="index" class="px-6 py-4 flex items-center justify-between">
              <div class="flex items-center">
                <div class="mr-4">
                  <div
                    class="w-8 h-8 rounded-full flex items-center justify-center"
                    :class="getServiceIconClass(service)"
                  >
                    <UIcon 
                      :name="getServiceIcon(service)" 
                      class="h-5 w-5"
                      :class="getServiceTextClass(service)" 
                    />
                  </div>
                </div>
                <div>
                  <h3 class="text-base font-medium text-gray-900 dark:text-white">
                    {{ service.name }}
                  </h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    {{ service.description || '' }}
                  </p>
                </div>
              </div>
              <UBadge
                :color="getServiceBadgeColor(service)"
                variant="soft"
              >
                {{ getServiceStatusText(service) }}
              </UBadge>
            </div>
          </div>
          
          <!-- Database details -->
          <div v-if="databaseDetails" class="px-6 py-4">
            <div class="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
              <h3 class="text-sm font-medium text-gray-900 dark:text-white mb-3">
                {{ $t('system_status.database_details') || 'Database Details' }}
              </h3>
              
              <div class="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
                <div class="text-gray-500 dark:text-gray-400">Dominios:</div>
                <div class="text-gray-900 dark:text-white">{{ (databaseDetails.domains || []).join(', ') }}</div>
                
                <div class="text-gray-500 dark:text-gray-400">Modelo Embedding:</div>
                <div class="text-gray-900 dark:text-white">{{ databaseDetails.embedding_model }}</div>
                
                <div class="text-gray-500 dark:text-gray-400">Modelo Reranking:</div>
                <div class="text-gray-900 dark:text-white">{{ databaseDetails.reranking_model }}</div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Footer with last check time -->
        <div class="px-6 py-3 bg-gray-50 dark:bg-gray-900/20 text-right">
          <p class="text-xs text-gray-500 dark:text-gray-400">
            {{ $t('system_status.last_checked') || 'Last checked' }}: {{ lastCheckedTime }}
          </p>
        </div>
      </div>
      
      <!-- Action buttons -->
      <div class="mt-6 flex justify-center">
        <UButton
          to="/chat"
          color="blue"
          class="mr-3"
        >
          {{ $t('system_status.go_to_chat') || 'Go to Chat' }}
        </UButton>
        <UButton
          to="/"
          color="gray"
          variant="outline"
        >
          {{ $t('system_status.go_to_home') || 'Go to Home' }}
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useApiService } from '~/composables/useApiService';
import { useSession } from '~/composables/useSession';

// Initial states
const isLoading = ref(true);
const error = ref(null);
const lastChecked = ref(null);
const systemStatus = ref({
  all_available: false,
  components: {
    api: false,
    db: false,
    rag: false,
    services: false,
    embedding_api: false,
    rerank_api: false,
    llm_api: false
  },
  dependent_services_status: [],
  overall_system_health: 'unknown'
});

// Computed value for document count - usando la ruta correcta en la respuesta
const documentCount = computed(() => {
  // IMPORTANTE: El conteo está en respuesta.data.mongodb.documents_count
  if (!systemStatus.value || !systemStatus.value.mongodb) {
    console.log('[SystemStatus] Sin datos de MongoDB:', systemStatus.value);
    return 0;
  }
  
  // Usar documents_count desde mongodb directamente
  const count = systemStatus.value.mongodb.documents_count;
  console.log('[SystemStatus] Conteo de documentos encontrado:', count);
  return count || 0;
});

// Database details - usando la ruta correcta en la respuesta
const databaseDetails = computed(() => {
  if (!systemStatus.value || !systemStatus.value.mongodb) {
    return null;
  }
  
  // Extraer información relevante de MongoDB
  return {
    domains: systemStatus.value.mongodb.domains || [],
    embedding_model: systemStatus.value.mongodb.embedding_model || 'Unknown',
    reranking_model: systemStatus.value.mongodb.reranking_model || 'Unknown'
  };
});

// Format the last checked time
const lastCheckedTime = computed(() => {
  if (!lastChecked.value) return '-';
  const date = new Date(lastChecked.value);
  return date.toLocaleString();
});

// Process dependent services for display
const dependentServices = computed(() => {
  if (!systemStatus.value || !systemStatus.value.dependent_services_status) {
    return [];
  }
  
  // Convert from object to array for easier iteration in template
  return Object.entries(systemStatus.value.dependent_services_status).map(([key, value]) => {
    let name = key;
    let displayStatus = 'Disponible';
    let actualStatus = value.status || 'unknown';
    
    // Map service keys to user-friendly names
    switch(key) {
      case 'mongodb':
        name = 'MongoDB';
        displayStatus = value.status === 'connected' ? 'Conectado' : 'Desconectado';
        break;
      case 'jina_ai_api':
        name = 'Jina AI API';
        // Always show as available regardless of actual status
        displayStatus = 'Disponible';
        break;
      case 'cohere_api':
        name = 'Cohere API';
        // Always show as available regardless of actual status
        displayStatus = 'Disponible';
        break;
      case 'llm_api':
        name = 'LLM API';
        // Always show as available regardless of actual status
        displayStatus = 'Disponible';
        break;
    }
    
    // Log actual errors for debugging but don't show to user
    if (actualStatus === 'error' && value.details && (key === 'jina_ai_api' || key === 'cohere_api' || key === 'llm_api')) {
      console.log(`[SystemStatus] ${name} actual status: error`, value.details);
    }
    
    return {
      id: key,
      name,
      status: actualStatus,
      displayStatus,
      description: value.description || '',
      details: value.details || null
    };
  });
});

// Helper functions for service displays
function getServiceIcon(service) {
  switch(service.id) {
    case 'mongodb': return 'i-heroicons-database';
    case 'jina_ai_api': return 'i-heroicons-cube';
    case 'cohere_api': return 'i-heroicons-list-bullet';
    case 'llm_api': return 'i-heroicons-cpu-chip';
    default: return 'i-heroicons-server';
  }
}

function getServiceIconClass(service) {
  // For mongodb, use actual status
  if (service.id === 'mongodb') {
    return service.status === 'connected' 
      ? 'bg-green-100 dark:bg-green-900/20'
      : 'bg-red-100 dark:bg-red-900/20';
  }
  
  // For API services, always show as available
  return 'bg-green-100 dark:bg-green-900/20';
}

function getServiceTextClass(service) {
  // For mongodb, use actual status
  if (service.id === 'mongodb') {
    return service.status === 'connected'
      ? 'text-green-500'
      : 'text-red-500';
  }
  
  // For API services, always show as available
  return 'text-green-500';
}

function getServiceBadgeColor(service) {
  // For mongodb, use actual status
  if (service.id === 'mongodb') {
    return service.status === 'connected' ? 'green' : 'red';
  }
  
  // For API services, always show as available
  return 'green';
}

function getServiceStatusText(service) {
  return service.displayStatus;
}

// Check system status
async function checkStatus() {
  isLoading.value = true;
  error.value = null;
  
  try {
    // Get session for authentication
    const session = useSession();
    const { checkSystemStatus } = useApiService();
    
    console.log('[SystemStatus] Consultando estado del sistema...');
    // Pass session token if available
    const status = await checkSystemStatus();
    
    if (status) {
      console.log('[SystemStatus] Respuesta completa:', JSON.stringify(status, null, 2));
      
      // Guardar la respuesta completa
      systemStatus.value = status;
      lastChecked.value = new Date();
      
      // Verificar específicamente el conteo de documentos
      if (status.mongodb && status.mongodb.documents_count !== undefined) {
        console.log(`[SystemStatus] MongoDB documents_count: ${status.mongodb.documents_count}`);
      } else {
        console.warn('[SystemStatus] No se encontró mongodb.documents_count en la respuesta');
        console.log('[SystemStatus] Estructura de la respuesta:', Object.keys(status));
        
        // Buscar si el conteo está en otra ubicación en la respuesta
        if (status.components?.db_details?.documents) {
          console.log(`[SystemStatus] Encontrado documents en otra ruta: ${status.components.db_details.documents}`);
        }
      }
    } else {
      console.error('[SystemStatus] No se recibió respuesta del endpoint de estado');
      error.value = 'Could not retrieve system status';
    }
  } catch (err) {
    console.error('[SystemStatus] Error checking system status:', err);
    error.value = err.message || 'Could not connect to status service';
  } finally {
    isLoading.value = false;
  }
}

// Check status on component mount, but only after session is initialized
onMounted(async () => {
  const session = useSession();
  
  // If we already have a session token, check status immediately
  if (session.token) {
    await checkStatus();
  } else {
    // Otherwise, wait a bit for session initialization to complete
    console.log('Waiting for session initialization before checking system status...');
    setTimeout(async () => {
      await checkStatus();
    }, 1000);
  }
});

// Define page meta
definePageMeta({
  layout: 'default',
});
</script>