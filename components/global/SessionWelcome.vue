<!-- components/SessionWelcome.vue -->
<template>
  <div>
    <NAlert v-if="tokenExists" type="success">
      {{ t('index.welcome_back') }}
    </NAlert>
    <NAlert v-else type="info">
      {{ t('index.first_time') }}
    </NAlert>
  </div>
</template>

<script setup lang="ts">
const sessionStore = useSessionStore()
const { t } = useI18n()

onMounted(() => {
  sessionStore.loadToken()
  if (!sessionStore.token) {
    sessionStore.createSession()
  } else {
    console.log("Welcome back! Token found:", sessionStore.token)
  }
})

const tokenExists = computed(() => !!sessionStore.token)
</script>
