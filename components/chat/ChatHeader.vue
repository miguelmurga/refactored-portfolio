<template>
  <div class="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 flex items-center justify-between">
    <div class="flex items-center space-x-3">
      <div
          class="w-8 h-8 rounded-full flex items-center justify-center"
          :class="serviceColor"
      >
        <UIcon :name="serviceIcon" class="text-white" />
      </div>
      <div>
        <h2 class="text-lg font-medium">{{ title }}</h2>
        <p class="text-xs text-gray-500 dark:text-gray-400">
          {{ serviceName }} <span v-if="messageCount !== undefined">• {{ $t('chat.messages', { count: messageCount }) }}</span>
        </p>
      </div>
    </div>
    <div class="flex space-x-2 items-center">
      <!-- Session status indicator -->
      <div 
        class="text-xs px-2 py-1 rounded-full flex items-center" 
        :class="sessionValid ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'"
      >
        <div 
          class="w-2 h-2 rounded-full mr-1" 
          :class="sessionValid ? 'bg-green-500' : 'bg-red-500'"
        ></div>
        {{ sessionValid ? $t('session.connected') : $t('session.disconnected') }}
      </div>
      
      <UButton
          color="gray"
          variant="ghost"
          icon="i-heroicons-trash"
          @click="$emit('delete')"
      />
      <UButton
          color="gray"
          variant="ghost"
          icon="i-heroicons-information-circle"
          @click="$emit('info')"
      />
      <UButton
          v-if="!sessionValid"
          color="blue"
          variant="soft"
          icon="i-heroicons-arrow-path"
          @click="refreshSession"
      >
        {{ $t('session.reconnect') }}
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getServiceById } from '~/config/services';
import { useI18n } from 'vue-i18n'; 
import { useSession } from '~/composables/useSession';
import { useApiService } from '~/composables/useApiService';

const { t } = useI18n();
const session = useSession();
const api = useApiService();

const props = defineProps<{
  title: string;
  serviceId: string;
  messageCount?: number;
}>();

const emit = defineEmits<{
  (e: 'delete'): void;
  (e: 'info'): void;
  (e: 'refresh'): void;
}>();

// Monitor session validity
const sessionValid = ref(!!session.token);

// Check session when component mounts
onMounted(async () => {
  try {
    // Check if token exists and is valid
    if (session.token) {
      sessionValid.value = await api.checkSession();
    } else {
      sessionValid.value = false;
    }
  } catch (error) {
    console.error('[ChatHeader] Error checking session:', error);
    sessionValid.value = false;
  }
});

// Function to refresh session
async function refreshSession() {
  try {
    await api.initSession();
    sessionValid.value = !!session.token;
    if (sessionValid.value) {
      // Emit event to refresh conversations
      emit('refresh');
    }
  } catch (error) {
    console.error('[ChatHeader] Error refreshing session:', error);
    sessionValid.value = false;
  }
}

// Map Django service IDs to UI service IDs
const serviceMapping: Record<string, string> = {
  'security_expert': 'cybersecurity',
  'ia_generativa': 'llm',
  'db_agent': 'db-agent',
  'rag_conversation': 'knowledge-base'
};

// Get the UI service ID
const mappedServiceId = computed(() => {
  return serviceMapping[props.serviceId] || props.serviceId;
});

// Get service color and icon
const serviceColor = computed(() => {
  const service = getServiceById(mappedServiceId.value);
  return service?.color || 'bg-gray-600';
});

const serviceIcon = computed(() => {
  const service = getServiceById(mappedServiceId.value);
  return service?.icon || 'i-heroicons-chat-bubble-left-right';
});

// Get translated service name
const serviceName = computed(() => {
  // First try to get it from the translations
  const translationKey = `services.${mappedServiceId.value}.name`;
  const translated = t(translationKey);
  
  // If it doesn't start with services., it means it was found
  if (!translated.startsWith('services.')) {
    return translated;
  }
  
  // Fallback to service from config
  const service = getServiceById(mappedServiceId.value);
  return service?.name || props.serviceId;
});
</script>