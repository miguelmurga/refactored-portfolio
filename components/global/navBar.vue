<template>
  <nav
      :class="[
      isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900',
      'shadow-lg py-4 px-6'
    ]"
  >
    <div class="container mx-auto flex items-center justify-between">
      <!-- Logo -->
      <NuxtLink to="/" class="flex items-center space-x-2">
        <img
            src="/img/logo.png"
            alt="logo"
            class="w-12 h-12 rounded-xl"
        />
        <span class="text-xl font-bold">MyApp</span>
      </NuxtLink>

      <!-- Theme Toggle -->
      <ThemeToggle />

      <!-- Desktop Links -->
      <div class="hidden lg:flex items-center space-x-6">
        <NuxtLink
            to="/aboutUs"
            :class="[
            $route.path === '/aboutUs' ? 'text-blue-500' : '',
            'hover:text-blue-500'
          ]"
        >
          {{ $t('aboutUs') }}
        </NuxtLink>
        <NuxtLink
            to="/profile"
            :class="[
            $route.path === '/profile' ? 'text-blue-500' : '',
            'hover:text-blue-500'
          ]"
        >
          {{ $t('profile') }}
        </NuxtLink>
        <!-- Language Selector -->
        <select v-model="$i18n.locale" class="bg-transparent border-none">
          <option value="en">EN</option>
          <option value="es">ES</option>
        </select>
      </div>

      <!-- Mobile Menu Button -->
      <button @click="isOpen = true" class="lg:hidden">
        <Icon name="heroicons-outline:bars-3" class="w-6 h-6" />
      </button>
    </div>

    <!-- Mobile Menu -->
    <USlideover v-model="isOpen" :overlay="false">
      <div
          :class="[
          isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900',
          'p-4 flex flex-col h-full'
        ]"
      >
        <div class="flex justify-between items-center">
          <button @click="isOpen = false">
            <Icon name="heroicons-outline:x" class="w-6 h-6" />
          </button>
          <ThemeToggle />
          <select v-model="$i18n.locale" class="bg-transparent border-none">
            <option value="en">EN</option>
            <option value="es">ES</option>
          </select>
        </div>
        <div class="mt-4">
          <NuxtLink
              to="/"
              class="block py-2 px-4 text-sm"
              :class="{ 'text-blue-500': $route.path === '/' }"
              @click="isOpen = false"
          >
            {{ $t('home') }}
          </NuxtLink>
          <NuxtLink
              to="/aboutUs"
              class="block py-2 px-4 text-sm"
              :class="{ 'text-blue-500': $route.path === '/aboutUs' }"
              @click="isOpen = false"
          >
            {{ $t('aboutUs') }}
          </NuxtLink>
          <NuxtLink
              to="/profile"
              class="block py-2 px-4 text-sm"
              :class="{ 'text-blue-500': $route.path === '/profile' }"
              @click="isOpen = false"
          >
            {{ $t('profile') }}
          </NuxtLink>
        </div>
      </div>
    </USlideover>
  </nav>
</template>

<script setup lang="ts">
import ThemeToggle from '@/components/global/ThemeToggle.vue';
const isOpen = ref(false);
const colorMode = useColorMode();
const isDark = computed(() => colorMode.value === 'dark');
</script>
