<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold">{{ $t('chat.select_service') }}</h3>
        <UButton
            color="gray"
            variant="ghost"
            icon="i-heroicons-x-mark"
            @click="$emit('close')"
        />
      </div>
    </template>

    <div class="grid grid-cols-2 gap-4 p-2">
      <div
          v-for="service in services"
          :key="service.id"
          @click="$emit('select', service.id)"
          class="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md cursor-pointer transition-all duration-200"
      >
        <div class="w-12 h-12 rounded-full flex items-center justify-center mb-3 mx-auto" :class="service.color">
          <UIcon :name="service.icon" class="text-white text-xl" />
        </div>
        <h4 class="font-medium text-center mb-1">{{ service.name }}</h4>
        <p class="text-xs text-gray-500 dark:text-gray-400 text-center">
          {{ service.description }}
        </p>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { AI_SERVICES } from '~/config/services';

defineProps({
  services: {
    type: Array,
    default: () => AI_SERVICES
  }
});

defineEmits<{
  (e: 'select', serviceId: string): void;
  (e: 'close'): void;
}>();
</script>