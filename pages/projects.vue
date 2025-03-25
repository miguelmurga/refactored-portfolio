<template>
  <div class="container mx-auto px-4 py-6">
    <CookieNotice />
    <h1 class="text-2xl font-bold mb-4">{{ $t('projects_page.title') }}</h1>
    <!-- Componente de selección de secciones -->
    <SectionSelector />
    <!-- Resto del contenido de la página -->
  </div>
</template>

<script setup lang="ts">
// Autoimport config already enabled; no es necesario importar explícitamente SectionSelector.
</script>
