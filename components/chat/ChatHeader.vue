<template>
  <div class="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 flex items-center justify-between">
    <div class="flex items-center space-x-3">
      <div
          v-if="serviceIcon && serviceColor"
          class="w-8 h-8 rounded-full flex items-center justify-center"
          :class="serviceColor"
      >
        <UIcon :name="serviceIcon" class="text-white" />
      </div>
      <div>
        <h2 class="text-lg font-medium">{{ title }}</h2>
        <p class="text-xs text-gray-500 dark:text-gray-400">
          {{ subtitle }} <span v-if="messageCount !== undefined">• {{ $t('chat.messages', { count: messageCount }) }}</span>
        </p>
      </div>
    </div>
    <div class="flex space-x-2">
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
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  subtitle: string;
  serviceIcon?: string;
  serviceColor?: string;
  messageCount?: number;
}>();

defineEmits<{
  (e: 'delete'): void;
  (e: 'info'): void;
}>();
</script>