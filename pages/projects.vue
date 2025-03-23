<!-- pages/projects.vue -->
<template>
  <div class="container mx-auto px-4 py-6">
    <!-- Componente que muestra la advertencia de cookie -->
    <CookieNotice />
    <!-- Resto del contenido de la página de proyectos -->
    <h1 class="text-2xl font-bold mb-4">{{ $t('projects_page.title') }}</h1>
    <!-- ...otros componentes y contenido... -->
  </div>
</template>

<script setup lang="ts">
// Con la autoimportación configurada, no es necesario importar CookieNotice manualmente.
</script>
