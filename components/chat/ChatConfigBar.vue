<template>
  <div class="bg-gray-50 dark:bg-gray-900/60 p-2 py-1 border-b border-gray-200 dark:border-gray-800">
    <div class="flex items-center justify-between gap-2">
      <!-- Left side with toggles/settings -->
      <div class="flex items-center gap-4">
        <!-- RAG status pill -->
        <div 
          class="cursor-pointer px-2 py-0.5 rounded-full text-xs flex items-center gap-1 transition-colors" 
          :class="{
            'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400': config.use_rag,
            'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400': !config.use_rag
          }"
          @click="toggleRAG"
        >
          <UIcon 
            :name="config.use_rag ? 'i-heroicons-check-circle' : 'i-heroicons-minus-circle'" 
            class="w-3.5 h-3.5 opacity-80" 
          />
          <span>RAG</span>
        </div>
        
        <!-- Reasoning status pill -->
        <div 
          class="cursor-pointer px-2 py-0.5 rounded-full text-xs flex items-center gap-1 transition-colors" 
          :class="{
            'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400': config.use_reasoner,
            'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400': !config.use_reasoner
          }"
          @click="toggleReasoner"
        >
          <UIcon 
            :name="config.use_reasoner ? 'i-heroicons-check-circle' : 'i-heroicons-minus-circle'" 
            class="w-3.5 h-3.5 opacity-80" 
          />
          <span>{{ $t('rag.reasoner') }}</span>
        </div>

        <!-- Domain Pill - Always available when RAG is enabled -->
        <div v-if="config.use_rag" class="relative px-2 py-0.5 rounded-full text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 flex items-center gap-1 cursor-pointer" @click="toggleDomainSelector">
          <UIcon name="i-heroicons-folder" class="w-3.5 h-3.5 opacity-80" />
          <span>{{ getDomainLabel(config.domain) }}</span>
          <UIcon name="i-heroicons-chevron-down" class="w-3 h-3 opacity-80" />
        </div>

        <!-- Domain dropdown - Always available -->
        <div v-if="showDomainSelector" ref="selectorRef" class="fixed top-auto left-auto bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700 w-48" 
             style="z-index: 9999; position: absolute; top: 100%; left: 0; margin-top: 4px;">
          <div class="p-1">
            <div 
              v-for="option in domainOptions" 
              :key="option.value"
              class="px-3 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm flex items-center"
              :class="{'bg-blue-50 dark:bg-blue-900/20': config.domain === option.value}"
              @click="selectDomain(option.value)"
            >
              <UIcon 
                :name="config.domain === option.value ? 'i-heroicons-check' : ''" 
                class="w-4 h-4 mr-2" 
              />
              {{ option.label }}
            </div>
          </div>
        </div>
      </div>
      
      <!-- Right side with advanced settings button -->
      <div>
        <UButton 
          size="xs" 
          color="gray" 
          variant="ghost" 
          @click="$emit('show-advanced')"
          class="flex items-center gap-1"
        >
          <UIcon name="i-heroicons-adjustments-horizontal" class="w-3.5 h-3.5" />
          <span class="hidden sm:inline text-xs">{{ $t('rag.advanced') }}</span>
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { onClickOutside } from '@vueuse/core';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps<{
  config: {
    use_rag: boolean;
    use_reasoner: boolean;
    domain: string;
    language: string;
    rag_min_score: number;
    rag_min_rerank_score: number;
    rag_top_k: number;
    llm_temperature: number;
  }
}>();

const emit = defineEmits(['update:config', 'show-advanced']);

// UI state
const showDomainSelector = ref(false);
const selectorRef = ref(null);

// Close domain selector when clicking outside
onClickOutside(selectorRef, () => {
  showDomainSelector.value = false;
});

// Language selector
const selectedLanguage = computed({
  get: () => props.config.language,
  set: (value) => {
    emit('update:config', { ...props.config, language: value });
  }
});

// Options for dropdowns
const languageOptions = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' },
  { value: 'pt', label: 'Português' }
];

const domainOptions = [
  { value: 'todos', label: t('rag.all_domains') },
  { value: 'ciberseguridad', label: t('rag.cybersecurity') },
  { value: 'ia_generativa', label: t('rag.generative_ai') }
];

// Get domain label from value
function getDomainLabel(value: string): string {
  const option = domainOptions.find(opt => opt.value === value);
  return option ? option.label : value;
}

// Select domain and close selector
function selectDomain(value: string) {
  emit('update:config', { ...props.config, domain: value });
  showDomainSelector.value = false;
}

// Toggle domain selector with proper state management
function toggleDomainSelector() {
  showDomainSelector.value = !showDomainSelector.value;
}

// Toggle functions - all services are modular
function toggleRAG() {
  emit('update:config', { ...props.config, use_rag: !props.config.use_rag });
}

function toggleReasoner() {
  emit('update:config', { ...props.config, use_reasoner: !props.config.use_reasoner });
}
</script>