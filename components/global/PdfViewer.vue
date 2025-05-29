<template>
  <div>
    <!-- Botón para abrir visor -->
    <UButton
        icon="i-heroicons-document-magnifying-glass"
        @click="isOpen = true"
    >
      {{ $t('report.viewOnline') }}
    </UButton>

    <!-- Modal pantalla completa -->
    <UModal v-model="isOpen" fullscreen>
      <UCard
          :ui="{
          base: 'h-full flex flex-col',
          rounded: '',
          divide: 'divide-y divide-gray-100 dark:divide-gray-800',
          body: { base: 'grow overflow-hidden p-0' }
        }"
      >
        <!-- Encabezado -->
        <template #header>
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
                {{ title }}
              </h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ description }}
              </p>
            </div>
            <UButton
                color="gray"
                variant="ghost"
                icon="i-heroicons-x-mark-20-solid"
                class="-my-1"
                @click="isOpen = false"
            />
          </div>
        </template>

        <!-- PDF -->
        <iframe
            :src="`${src}#toolbar=0`"
            class="w-full h-full border-none"
            loading="lazy"
        ></iframe>

        <!-- Footer con botón descarga -->
        <template #footer>
          <div class="flex justify-end p-4">
            <UButton
                icon="i-heroicons-arrow-down-tray"
                :to="src"
                download
                target="_blank"
            >
              {{ $t('report.download') }}
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  src: string
  title: string
  description: string
}>()

const isOpen = ref(false)
</script>
