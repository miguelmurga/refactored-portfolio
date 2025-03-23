<!-- components/CookieNotice.vue -->
<template>
  <div v-if="visible" class="fixed bottom-4 left-4 right-4 z-50">
    <NAlert type="warning" border class="flex items-center justify-between bg-yellow-50 text-yellow-900 p-4 rounded shadow">
      <span class="text-sm">
        {{ t('projects_page.session_notice') }}
      </span>
      <NButton size="small" variant="ghost" @click="dismiss">
        {{ t('projects_page.dismiss') }}
      </NButton>
    </NAlert>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from '#i18n'

const { t } = useI18n()
const visible = ref(true)

const dismiss = () => {
  visible.value = false
  if (typeof window !== 'undefined') {
    localStorage.setItem('cookieNoticeDismissed', 'true')
  }
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    const dismissed = localStorage.getItem('cookieNoticeDismissed')
    if (dismissed === 'true') {
      visible.value = false
    }
  }
})
</script>


