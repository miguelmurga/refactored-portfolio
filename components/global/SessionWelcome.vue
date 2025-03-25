<!-- components/global/SessionWelcome.vue -->
<template>
  <div v-if="isClient" class="my-4 mx-auto max-w-3xl">
    <div v-if="!isNewSession"
         class="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-md flex items-center justify-between">
      <div class="flex items-center">
        <div class="mr-3">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p>{{ t('index.welcome_back') }}</p>
      </div>
    </div>
    <div v-else
         class="bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-4 rounded shadow-md flex items-center justify-between">
      <div class="flex items-center">
        <div class="mr-3">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p>{{ t('index.first_time') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from '#i18n'

const sessionStore = useSessionStore()
const { t } = useI18n()
const isClient = ref(false)
const isNewSession = ref(false)

onMounted(() => {
  isClient.value = true
  sessionStore.loadToken()

  if (!sessionStore.token) {
    // Si no hay token, es una sesión nueva
    isNewSession.value = true
    sessionStore.createSession()
  } else {
    console.log("Welcome back! Token found:", sessionStore.token)
  }
})
</script>