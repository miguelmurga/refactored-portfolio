<!-- components/global/LongConversationNotice.vue -->
<template>
  <div v-if="isClient && visible" class="fixed bottom-4 left-4 right-4 z-50">
    <div class="flex items-center justify-between bg-amber-50 text-amber-900 p-4 rounded shadow-lg border border-amber-200">
      <div class="flex items-center space-x-3">
        <UIcon name="i-heroicons-exclamation-triangle" class="text-amber-600 text-xl flex-shrink-0" />
        <span class="text-sm">
          ⚠️ Conversación extensa - Las conversaciones largas pueden volverse incoherentes o menos confiables. Más info: arxiv.org/pdf/2505.06120
        </span>
      </div>
      <UButton
        size="xs"
        color="amber"
        variant="ghost"
        @click="dismiss"
        class="ml-4 flex-shrink-0"
      >
        Aceptar
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const visible = ref(false)
const isClient = ref(false)

const dismiss = () => {
  visible.value = false
  // NO guardar en localStorage - permitir que se muestre de nuevo
}

onMounted(() => {
  isClient.value = true
  
  // Escuchar eventos globales para mostrar la notificación
  window.addEventListener('showLongConversationNotice', (event: CustomEvent) => {
    // SIEMPRE mostrar la notificación - sin persistencia del dismiss
    console.log('[LongConversationNotice] Showing notice for', event.detail?.messageCount, 'messages')
    visible.value = true
  })
})

onUnmounted(() => {
  window.removeEventListener('showLongConversationNotice', () => {})
})
</script>