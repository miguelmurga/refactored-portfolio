<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
    <div class="max-w-md w-full space-y-8 text-center">
      <div>
        <!-- Error 404 (página no encontrada) -->
        <h1 v-if="error.statusCode === 404" class="text-4xl font-extrabold text-gray-900 dark:text-white mb-2">
          {{ $t('error.404_title') || 'Página no encontrada' }}
        </h1>
        
        <!-- Errores específicos de MongoDB RAG -->
        <template v-else-if="isRagError">
          <h1 class="text-4xl font-extrabold text-gray-900 dark:text-white mb-2">
            {{ $t('error.rag_title') || 'Error del sistema RAG' }}
          </h1>
          <div class="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg mt-4 mb-6">
            <div class="flex items-start">
              <UIcon name="i-heroicons-exclamation-triangle" class="text-amber-500 mr-3 flex-shrink-0 mt-0.5" />
              <div class="text-left text-sm text-amber-800 dark:text-amber-200">
                <p class="font-medium mb-1">{{ getRagErrorTitle }}</p>
                <p>{{ getRagErrorMessage }}</p>
              </div>
            </div>
          </div>
        </template>
        
        <!-- Error genérico para todos los demás casos -->
        <h1 v-else class="text-4xl font-extrabold text-gray-900 dark:text-white mb-2">
          {{ $t('error.generic_title') || 'Ha ocurrido un error' }}
        </h1>
        
        <!-- Mensaje descriptivo -->
        <p v-if="!isRagError" class="text-lg text-gray-600 dark:text-gray-300">
          {{ error.statusCode === 404 
            ? ($t('error.404_message') || 'La página que buscas no existe o ha sido movida.') 
            : ($t('error.generic_message') || 'Ha ocurrido un error inesperado. Por favor intenta nuevamente.') 
          }}
        </p>
        
        <!-- Error stack en modo desarrollo -->
        <div v-if="isDev && error.stack && !isRagError" class="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-left overflow-auto max-h-60 text-xs">
          <pre>{{ error.stack }}</pre>
        </div>
      </div>
      
      <!-- Acciones -->
      <div class="flex flex-col sm:flex-row justify-center gap-3 mt-8">
        <UButton
          size="lg"
          color="blue"
          variant="solid"
          @click="handleError"
        >
          {{ $t('error.go_home') || 'Volver al inicio' }}
        </UButton>
        
        <UButton
          v-if="isRagError"
          size="lg"
          color="gray"
          variant="outline"
          @click="checkSystemStatus"
        >
          {{ $t('error.check_system') || 'Verificar estado del sistema' }}
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRuntimeConfig } from '#app';

// Propiedades proporcionadas por Nuxt
const props = defineProps({
  error: Object
})

// Obtener el objeto error
const error = props.error
const config = useRuntimeConfig();
const isDev = process.env.NODE_ENV === 'development' || config.public.devMode === true;

// Determinamos si es un error específico del sistema RAG
const isRagError = computed(() => {
  if (!error) return false;
  
  // Si el error tiene un código específico de RAG
  if (error.statusCode === 503 && error.statusMessage?.includes('RAG')) return true;
  
  // O si tiene un mensaje que indica error en componentes del RAG
  const ragErrorKeywords = ['embedding', 'vector', 'mongodb', 'jina', 'cohere', 'rerank', 'rag'];
  
  return (
    error.message && 
    ragErrorKeywords.some(keyword => 
      error.message.toLowerCase().includes(keyword)
    )
  );
});

// Obtener título específico según el tipo de error RAG
const getRagErrorTitle = computed(() => {
  if (!isRagError.value) return '';
  
  if (error.message?.toLowerCase().includes('embedding') || error.message?.toLowerCase().includes('jina')) {
    return $t('error.rag_embedding_title') || 'Error en servicio de embeddings';
  }
  
  if (error.message?.toLowerCase().includes('rerank') || error.message?.toLowerCase().includes('cohere')) {
    return $t('error.rag_rerank_title') || 'Error en servicio de reranking';
  }
  
  if (error.message?.toLowerCase().includes('mongodb')) {
    return $t('error.rag_db_title') || 'Error en la base de datos';
  }
  
  return $t('error.rag_generic_title') || 'Error en el sistema RAG';
});

// Obtener mensaje específico según el tipo de error RAG
const getRagErrorMessage = computed(() => {
  if (!isRagError.value) return '';
  
  if (error.message?.toLowerCase().includes('embedding') || error.message?.toLowerCase().includes('jina')) {
    return $t('error.rag_embedding_message') || 'No se ha podido conectar con el servicio de embeddings. Verifique la API key de Jina AI o intente más tarde.';
  }
  
  if (error.message?.toLowerCase().includes('rerank') || error.message?.toLowerCase().includes('cohere')) {
    return $t('error.rag_rerank_message') || 'No se ha podido conectar con el servicio de reranking. Verifique la API key de Cohere o intente más tarde.';
  }
  
  if (error.message?.toLowerCase().includes('mongodb')) {
    return $t('error.rag_db_message') || 'Error al conectar con la base de datos MongoDB. Intente nuevamente más tarde.';
  }
  
  return $t('error.rag_generic_message') || 'Se ha producido un error en el sistema de recuperación aumentada. Intente nuevamente más tarde.';
});

// Manejar el error según el tipo
function handleError() {
  // Para errores 404, simplemente redirigir al inicio
  if (error.statusCode === 404) {
    navigateTo('/')
  } else {
    // Para otros errores, limpiar el error y recargar la página
    clearError({ redirect: '/' })
  }
}

// Verificar el estado del sistema RAG
function checkSystemStatus() {
  navigateTo('/system-status')
}
</script>