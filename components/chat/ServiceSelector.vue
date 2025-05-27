<template>
  <div class="bg-gray-100 dark:bg-gray-800 p-4 rounded-md mb-4 shadow-sm">
    <div class="flex flex-col gap-2">
      <span class="text-xs font-semibold mb-1 text-blue-600 dark:text-blue-400">Seleccionar Agente</span>
      
      <div class="grid grid-cols-3 gap-2 mb-2">
        <!-- Agente Unificado -->
        <div 
          class="flex flex-col items-center p-3 rounded-lg cursor-pointer transition-colors shadow-sm"
          :class="service === 'unified_agent' ? 'bg-emerald-600 text-white' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'"
          @click="selectService('unified_agent')"
        >
          <div class="w-8 h-8 rounded-full flex items-center justify-center bg-emerald-700 mb-2">
            <UIcon name="i-heroicons-document-magnifying-glass" class="text-white" />
          </div>
          <span class="text-xs font-medium text-center">Agente RAG<br>Unificado</span>
        </div>
        
        <!-- Experto en IA -->
        <div 
          class="flex flex-col items-center p-3 rounded-lg cursor-pointer transition-colors shadow-sm"
          :class="service === 'ai_expert' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'"
          @click="selectService('ai_expert')"
        >
          <div class="w-8 h-8 rounded-full flex items-center justify-center bg-blue-600 mb-2">
            <UIcon name="i-heroicons-cpu-chip" class="text-white" />
          </div>
          <span class="text-xs font-medium text-center">Experto en<br>IA Generativa</span>
        </div>
        
        <!-- Experto en Seguridad -->
        <div 
          class="flex flex-col items-center p-3 rounded-lg cursor-pointer transition-colors shadow-sm"
          :class="service === 'security_expert' ? 'bg-green-600 text-white' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'"
          @click="selectService('security_expert')"
        >
          <div class="w-8 h-8 rounded-full flex items-center justify-center bg-green-700 mb-2">
            <UIcon name="i-heroicons-shield-check" class="text-white" />
          </div>
          <span class="text-xs font-medium text-center">Experto en<br>Ciberseguridad</span>
        </div>
      </div>
      
      <div class="bg-white dark:bg-gray-700 p-2 rounded text-xs text-gray-600 dark:text-gray-300 mt-2 border border-gray-200 dark:border-gray-600">
        <div class="flex items-start gap-1">
          <UIcon name="i-heroicons-information-circle" class="flex-shrink-0 text-blue-500 mt-0.5" />
          <div>
            <p class="mb-1">
              <span class="font-semibold">Cambiar agente</span> permite especializar tus consultas:
            </p>
            <ul class="list-disc list-inside ml-1 space-y-1">
              <li class="text-[10px]"><span class="text-emerald-600 font-medium">Agente Unificado:</span> Accede a todos los documentos</li>
              <li class="text-[10px]"><span class="text-blue-600 font-medium">Experto en IA:</span> Especializado en IA generativa</li>
              <li class="text-[10px]"><span class="text-green-600 font-medium">Experto en Seguridad:</span> Especializado en ciberseguridad</li>
            </ul>
            <div class="mt-1 text-[10px] bg-blue-50 dark:bg-blue-900/20 p-1 rounded">
              Nota: Puedes cambiar de agente en cualquier momento sin perder tu conversación actual.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{
  service: string;
}>();

const emit = defineEmits(['update:service']);

function selectService(serviceId: string) {
  emit('update:service', serviceId);
}
</script>