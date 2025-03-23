<!-- components/SessionNotice.vue -->
<template>
  <NAlert type="info">
    {{ t('projects_page.session_notice') }}
  </NAlert>
</template>

<script setup lang="ts">
const { t } = useI18n()
</script>
