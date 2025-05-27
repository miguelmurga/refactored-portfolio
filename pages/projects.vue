<template>
  <div class="container mx-auto px-4 py-6">
    <CookieNotice />
    <h1 class="text-2xl font-bold mb-4">{{ $t('projects_page.title') }}</h1>
    
    <!-- Descripción de la página de proyectos -->
    <p class="text-gray-600 dark:text-gray-300 mb-6 max-w-3xl">
      {{ $t('projects_page.description') || 'Explora mis proyectos. Cada tarjeta te lleva a un proyecto o servicio diferente.' }}
    </p>
    
    <!-- SectionSelector muestra la cuadrícula de tarjetas de proyectos -->
    <div class="mt-4">
      <SectionSelector />
    </div>
  </div>
</template>

<script setup lang="ts">
// SectionSelector es una cuadrícula de tarjetas de proyectos, no un componente de navegación
</script>
