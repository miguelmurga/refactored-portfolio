<template>
  <div class="bg-white dark:bg-gray-800 p-6 flex-1 flex flex-col items-center justify-center text-center">
    <UIcon name="i-heroicons-chat-bubble-left-right" class="text-5xl text-gray-400 mb-4" />
    <h2 class="text-2xl font-medium text-gray-700 dark:text-gray-300 mb-2">
      {{ $t('chat.select_service_to_start') }}
    </h2>
    <p class="text-gray-500 dark:text-gray-400 max-w-md mb-6">
      {{ $t('chat.select_service_description') }}
    </p>
    <UButton
        color="primary"
        @click="$emit('new-chat')"
    >
      {{ $t('chat.select_service') }}
    </UButton>
  </div>
</template>

<script setup lang="ts">
defineEmits<{
  (e: 'new-chat'): void;
}>();
</script>