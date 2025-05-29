<template>
  <div class="w-full min-h-screen bg-gradient-to-br from-yellow-50 via-rose-100 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
    <div class="w-full max-w-2xl mx-auto px-4 py-12">
      <div class="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 p-10 sm:p-12 transition-all duration-300">
        <div class="flex flex-col items-center text-center space-y-5">
          <!-- Emoji animado -->
          <div class="text-7xl animate-bounce">🚧</div>

          <!-- Título -->
          <h1 class="text-4xl font-extrabold text-gray-800 dark:text-white leading-tight">
            {{ t('work_in_progress_title') }}
          </h1>

          <!-- Descripción -->
          <p class="text-lg text-gray-600 dark:text-gray-300 leading-relaxed max-w-md">
            {{ t('work_in_progress_desc') }}
          </p>

          <!-- Fecha esperada actualizada -->
          <p class="text-sm text-rose-500 dark:text-rose-300 font-medium">
            {{ t('estimated_mid_july') }}
          </p>

          <!-- Cuenta regresiva -->
          <div class="flex flex-wrap justify-center gap-4 text-center mt-2">
            <div class="bg-white dark:bg-gray-700 shadow-md rounded-xl px-4 py-2">
              <p class="text-2xl font-bold text-indigo-600 dark:text-indigo-300">{{ countdown.days }}</p>
              <span class="text-xs text-gray-600 dark:text-gray-300">Días</span>
            </div>
            <div class="bg-white dark:bg-gray-700 shadow-md rounded-xl px-4 py-2">
              <p class="text-2xl font-bold text-indigo-600 dark:text-indigo-300">{{ countdown.hours }}</p>
              <span class="text-xs text-gray-600 dark:text-gray-300">Horas</span>
            </div>
            <div class="bg-white dark:bg-gray-700 shadow-md rounded-xl px-4 py-2">
              <p class="text-2xl font-bold text-indigo-600 dark:text-indigo-300">{{ countdown.minutes }}</p>
              <span class="text-xs text-gray-600 dark:text-gray-300">Minutos</span>
            </div>
            <div class="bg-white dark:bg-gray-700 shadow-md rounded-xl px-4 py-2">
              <p class="text-2xl font-bold text-indigo-600 dark:text-indigo-300">{{ countdown.seconds }}</p>
              <span class="text-xs text-gray-600 dark:text-gray-300">Segundos</span>
            </div>
          </div>

          <!-- Botón -->
          <RouterLink
              to="/"
              class="mt-6 inline-flex items-center px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-md transition duration-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            {{ t('go_back_home') }}
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const countdown = ref({
  days: '00',
  hours: '00',
  minutes: '00',
  seconds: '00',
})

// Cambia aquí la fecha a julio 2025
const targetDate = new Date('2025-07-15T00:00:00')

let interval: ReturnType<typeof setInterval>

const updateCountdown = () => {
  const now = new Date()
  const diff = targetDate.getTime() - now.getTime()

  if (diff <= 0) {
    countdown.value = { days: '00', hours: '00', minutes: '00', seconds: '00' }
    clearInterval(interval)
    return
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
  const minutes = Math.floor((diff / (1000 * 60)) % 60)
  const seconds = Math.floor((diff / 1000) % 60)

  countdown.value = {
    days: String(days).padStart(2, '0'),
    hours: String(hours).padStart(2, '0'),
    minutes: String(minutes).padStart(2, '0'),
    seconds: String(seconds).padStart(2, '0'),
  }
}

onMounted(() => {
  updateCountdown()
  interval = setInterval(updateCountdown, 1000)
})

onBeforeUnmount(() => {
  clearInterval(interval)
})
</script>
