<!-- components/global/CookieNotice.vue -->
<template>
  <div v-if="isClient && visible" class="fixed bottom-4 left-4 right-4 z-50">
    <div class="flex items-center justify-between bg-yellow-50 text-yellow-900 p-4 rounded shadow">
      <span class="text-sm">
        {{ t('projects_page.session_notice') }}
      </span>
      <button
          class="bg-yellow-100 text-yellow-900 px-3 py-1 rounded text-sm hover:bg-yellow-200"
          @click="dismiss"
      >
        {{ t('projects_page.dismiss') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const visible = ref(true)
const isClient = ref(false)

const dismiss = () => {
  visible.value = false
  localStorage.setItem('cookieNoticeDismissed', 'true')
}

onMounted(() => {
  isClient.value = true
  const dismissed = localStorage.getItem('cookieNoticeDismissed')
  if (dismissed === 'true') {
    visible.value = false
  }
  
  // Escuchar eventos globales para mostrar el cookie notice
  window.addEventListener('showCookieNotice', () => {
    if (dismissed !== 'true') {
      visible.value = true
    }
  })
})

onUnmounted(() => {
  // Limpiar event listener
  window.removeEventListener('showCookieNotice', () => {})
})
</script>