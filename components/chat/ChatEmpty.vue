<template>
  <div class="bg-white dark:bg-gray-800 p-6 flex-1 flex flex-col items-center justify-center text-center">
    <UIcon name="i-heroicons-chat-bubble-left-right" class="text-5xl text-gray-400 mb-4" />
    <h2 class="text-2xl font-medium text-gray-700 dark:text-gray-300 mb-2">
      {{ $t('chat.select_service_to_start') }}
    </h2>
    <p class="text-gray-500 dark:text-gray-400 max-w-md mb-6">
      {{ $t('chat.select_service_description') }}
    </p>
    
    <!-- Servicios disponibles -->
    <div class="grid grid-cols-2 gap-4 max-w-2xl mb-8">
      <div
        v-for="service in AI_SERVICES"
        :key="service.id"
        @click="$emit('select-service', service.id)"
        class="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md cursor-pointer transition-all duration-200"
      >
        <div class="w-12 h-12 rounded-full flex items-center justify-center mb-3 mx-auto" :class="service.color">
          <UIcon :name="service.icon" class="text-white text-xl" />
        </div>
        <h4 class="font-medium text-center mb-1">{{ $t(`services.${service.id}.name`) }}</h4>
        <p class="text-xs text-gray-500 dark:text-gray-400 text-center">
          {{ $t(`services.${service.id}.description`) }}
        </p>
      </div>
    </div>
    
    <UButton
      color="primary"
      @click="$emit('new-chat')"
    >
      {{ $t('chat.select_service') }}
    </UButton>
  </div>
</template>

<script setup lang="ts">
import { AI_SERVICES } from '~/config/services';

defineEmits<{
  (e: 'new-chat'): void;
  (e: 'select-service', serviceId: string): void;
}>();
</script>