<template>
  <div class="system-status-indicator px-2 py-1 rounded-lg text-xs" :class="statusClass">
    <div class="flex items-center">
      <div class="w-2 h-2 rounded-full mr-1" :class="indicatorClass"></div>
      <span>{{ documentsText }}</span>
      <button v-if="showRefresh" @click="refreshStatus" class="ml-2 text-xs px-1 py-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700">
        <span class="i-heroicons-arrow-path w-3 h-3"></span>
      </button>
    </div>
    <div v-if="expanded" class="mt-2 text-xs">
      <div v-if="systemStatus" class="grid grid-cols-2 gap-x-4 gap-y-1 mb-2">
        <div class="font-medium">Estado sistema:</div>
        <div :class="healthStatusClass">{{ overallHealthStatus }}</div>
        
        <div class="font-medium">Documentos:</div>
        <div :class="{'text-green-600 dark:text-green-400': documentsCount > 0, 'text-red-600 dark:text-red-400': documentsCount === 0}">
          {{ documentsCount || 0 }}
        </div>
      </div>
      
      <div v-if="dbDetails" class="text-[10px] mt-1 px-1 py-1 bg-gray-100 dark:bg-gray-800 rounded">
        <div><span class="font-medium">Dominios:</span> {{ dbDetails.domains?.join(', ') }}</div>
        <div><span class="font-medium">Embedding:</span> {{ dbDetails.embedding_model }}</div>
        <div><span class="font-medium">Reranking:</span> {{ dbDetails.reranking_model }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useApiService } from '~/composables/useApiService'
import { useSession } from '~/composables/useSession'

const props = defineProps({
  expanded: {
    type: Boolean,
    default: false
  }
})

// Estado
const systemStatus = ref<any>(null)
const isLoading = ref(false)
const lastError = ref<string | null>(null)
const lastChecked = ref<Date | null>(null)

// Obtener la API
const { checkSystemStatus } = useApiService()

// Obtenemos el conteo de documentos
const documentsCount = computed(() => {
  if (!systemStatus.value || !systemStatus.value.components || !systemStatus.value.components.db_details) {
    return 0
  }
  
  return systemStatus.value.components.db_details.documents || 0
})

// Estado de salud general del sistema
const overallHealthStatus = computed(() => {
  if (!systemStatus.value) return 'Desconocido'
  
  // Usar el nuevo campo overall_system_health si está disponible
  if (systemStatus.value.overall_system_health) {
    return systemStatus.value.overall_system_health
  }
  
  // Si no tenemos ese campo, usar el estado basado en documentos
  return documentsCount.value > 0 ? 'Operativo' : 'Sin documentos'
})

// Clase para el estado de salud
const healthStatusClass = computed(() => {
  if (!systemStatus.value) return 'text-gray-500'
  
  if (systemStatus.value.overall_system_health === 'healthy' || documentsCount.value > 0) {
    return 'text-green-600 dark:text-green-400'
  } else if (systemStatus.value.overall_system_health === 'degraded') {
    return 'text-yellow-600 dark:text-yellow-400'
  } else {
    return 'text-red-600 dark:text-red-400'
  }
})

// Clases de CSS basadas en la cantidad de documentos
const statusClass = computed(() => {
  if (isLoading.value) return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
  
  if (documentsCount.value > 0) {
    return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
  } else if (documentsCount.value === 0 && systemStatus.value) {
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
  } else {
    return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
  }
})

const indicatorClass = computed(() => {
  if (isLoading.value) return 'bg-gray-500 animate-pulse'
  
  if (documentsCount.value > 0) {
    return 'bg-green-500'
  } else if (documentsCount.value === 0 && systemStatus.value) {
    return 'bg-yellow-500'
  } else {
    return 'bg-gray-500'
  }
})

// Texto que muestra la cantidad de documentos
const documentsText = computed(() => {
  if (isLoading.value) return 'Verificando...'
  
  if (documentsCount.value > 0) {
    return `${documentsCount.value} docs`
  } else if (documentsCount.value === 0 && systemStatus.value) {
    return 'Sin documentos'
  } else {
    return 'Verificando...'
  }
})

const showRefresh = computed(() => {
  return documentsCount.value === 0 || lastChecked.value === null || 
         (lastChecked.value && new Date().getTime() - lastChecked.value.getTime() > 60000) // 1 minuto
})

const dbDetails = computed(() => {
  if (!systemStatus.value?.components?.db_details) return null
  return systemStatus.value.components.db_details
})

// Métodos
function componentStatus(status: boolean | undefined) {
  if (status === undefined) return 'Desconocido'
  return status ? 'OK' : 'Error'
}

function componentClass(status: boolean | undefined) {
  if (status === undefined) return 'text-gray-500'
  return status ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
}

async function refreshStatus() {
  if (isLoading.value) return
  
  isLoading.value = true
  lastError.value = null
  
  try {
    console.log('[SystemStatus] Consultando estado del sistema...')
    const status = await checkSystemStatus()
    
    if (status) {
      console.log('[SystemStatus] Respuesta completa del sistema:', JSON.stringify(status, null, 2))
      
      // Guardar la respuesta completa
      systemStatus.value = status
      lastChecked.value = new Date()
      
      // Verificar específicamente el conteo de documentos en la estructura correcta
      if (status.mongodb && status.mongodb.documents_count !== undefined) {
        console.log(`[SystemStatus] MongoDB documents_count: ${status.mongodb.documents_count}`)
      } else {
        console.warn('[SystemStatus] No se encontró mongodb.documents_count en la respuesta')
        console.log('[SystemStatus] Estructura de la respuesta:', Object.keys(status))
      }
    } else {
      console.error('[SystemStatus] No se recibió respuesta del endpoint de estado')
      lastError.value = 'No se recibió respuesta'
    }
  } catch (error) {
    console.error('[SystemStatus] Error obteniendo estado:', error)
    lastError.value = 'Error de conexión'
  } finally {
    isLoading.value = false
  }
}

// Obtener el store de sesión para verificar que haya un token válido
const session = useSession()

// Solo refrescar cuando la sesión está completamente inicializada
const canRefresh = computed(() => session.isSessionInitialized)

// Ver cambios en el indicador isSessionInitialized
watch(() => session.isSessionInitialized, (isInitialized) => {
  if (isInitialized) {
    console.log('[SystemStatus] ✅ Sesión completamente inicializada, ahora podemos consultar el estado')
    refreshStatus()
  } else {
    console.log('[SystemStatus] ❌ Sesión no inicializada, esperando...')
  }
})

// Inicializar
onMounted(() => {
  // Solo refrescar si la sesión ya está completamente inicializada
  if (session.isSessionInitialized) {
    console.log('[SystemStatus] ✅ Sesión ya inicializada al montar, consultando estado')
    refreshStatus()
  } else {
    console.log('[SystemStatus] ❌ Esperando a que se complete la inicialización de sesión antes de consultar estado')
  }
  
  // Actualizar cada 5 minutos solo si la sesión está inicializada
  const interval = setInterval(() => {
    if (canRefresh.value) {
      refreshStatus()
    }
  }, 5 * 60 * 1000)
  
  // Limpiar el intervalo cuando se desmonta el componente
  onBeforeUnmount(() => {
    clearInterval(interval)
  })
})
</script>

<style scoped>
.system-status-indicator {
  min-width: 120px;
  cursor: default;
}
</style>