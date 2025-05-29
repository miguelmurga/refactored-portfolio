<template>
  <div class="container mx-auto px-4 py-10 space-y-8">
    <!-- Tarjeta 1: LLMs -->
    <UCard>
      <template #header>
        <h1 class="text-2xl font-bold">
          {{ $t('models.title') }}
        </h1>
        <p class="text-sm text-gray-500">
          {{ $t('models.subtitle') }}
        </p>
      </template>

      <PdfViewer
          src="/IA_Generativa__Particularidades_de_los_Modelos_de_Lenguaje_Grandes.pdf"
          :title="$t('models.modalTitle')"
          :description="$t('models.description')"
      />
    </UCard>

    <!-- Tarjeta 2: Hacking Ético -->
    <UCard>
      <template #header>
        <h1 class="text-2xl font-bold">
          {{ $t('report.title') }}
        </h1>
        <p class="text-sm text-gray-500">
          {{ $t('report.subtitle') }}
        </p>
      </template>

      <PdfViewer
          src="/ETHPA.pdf"
          :title="$t('report.modalTitle')"
          :description="$t('report.description')"
      />
    </UCard>
  </div>
</template>

<script setup lang="ts">
</script>


