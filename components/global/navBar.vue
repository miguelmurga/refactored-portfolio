<template>
  <nav
      :class="[isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900', 'shadow-lg py-4 px-6 rounded-lg']"
      class="mx-4 mt-4"
  >
    <div class="container mx-auto flex items-center justify-between">
      <!-- Logo -->
      <NuxtLink to="/" class="flex items-center space-x-2">
        <img
            src="/img/logo.png"
            alt="logo"
            class="w-12 h-12 shadow-md"
        />
        <span class="text-xl font-bold">{{ $t('portfolio') }}</span>
      </NuxtLink>

      <!-- Desktop Links -->
      <div class="hidden lg:flex items-center space-x-6">
        <NuxtLink
            to="/aboutMe"
            :class="[ $route.path === '/aboutMe' ? 'text-blue-500 flex items-center space-x-2 bg-blue-100 px-3 py-1 rounded-full shadow-sm' : 'flex items-center space-x-2', 'hover:text-blue-500 hover:bg-blue-100 px-3 py-1 rounded-xl']"
        >
          <Icon name="heroicons-outline:user" class="w-5 h-5" />
          <span>{{ $t('aboutMe') }}</span>
        </NuxtLink>
        <NuxtLink
            to="/projects"
            :class="[ $route.path === '/projects' ? 'text-blue-500 flex items-center space-x-2 bg-blue-100 px-3 py-1 rounded-full shadow-sm' : 'flex items-center space-x-2', 'hover:text-blue-500 hover:bg-blue-100 px-3 py-1 rounded-xl']"
        >
          <Icon name="heroicons-outline:briefcase" class="w-5 h-5" />
          <span>{{ $t('projects') }}</span>
        </NuxtLink>
        <NuxtLink
            to="/contactMe"
            :class="[ $route.path === '/contactMe' ? 'text-blue-500 flex items-center space-x-2 bg-blue-100 px-3 py-1 rounded-full shadow-sm' : 'flex items-center space-x-2', 'hover:text-blue-500 hover:bg-blue-100 px-3 py-1 rounded-xl']"
        >
          <Icon name="heroicons-outline:mail" class="w-5 h-5" />
          <span>{{ $t('contactMe') }}</span>
        </NuxtLink>
        <!-- Language Selector -->
        <div class="flex items-center">
          <Icon name="material-symbols:translate" class="w-5 h-5" />
          <select
              v-model="$i18n.locale"
              class="bg-transparent border-none rounded-full shadow-sm px-3 py-1"
          >
            <option value="en">EN</option>
            <option value="es">ES</option>
          </select>
        </div>
        <ThemeToggle />
      </div>

      <!-- Mobile Menu Button -->
      <button
          @click="isOpen = true"
          class="lg:hidden p-2 shadow-sm hover:bg-blue-200"
      >
        <Icon name="heroicons-outline:bars-3" class="w-6 h-6" />
      </button>
    </div>

    <!-- Mobile Menu -->
    <USlideover v-model="isOpen" :overlay="false">
      <div
          :class="[isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900', 'p-4 flex flex-col h-full shadow-md']"
          class="mx-4 mt-4"
      >
        <div class="flex justify-between items-center">
          <button
              @click="isOpen = false"
              class="shadow-md hover:bg-blue-200"
          >
            <Icon name="heroicons-outline:x" class="w-6 h-6" />
          </button>
          <div class="flex items-center">
            <Icon name="material-symbols:translate" class="w-5 h-5" />
            <select
                v-model="$i18n.locale"
                class="bg-transparent border-none rounded-full shadow-sm px-3 py-1"
            >
              <option value="en">EN</option>
              <option value="es">ES</option>
            </select>
          </div>
          <ThemeToggle />
        </div>
        <div class="mt-4 space-y-2">
          <NuxtLink
              to="/"
              class=" py-2 px-4 flex items-center space-x-2 rounded-full hover:bg-blue-100"
              :class="{ 'text-blue-500': $route.path === '/' }"
              @click="isOpen = false"
          >
            <Icon name="heroicons-outline:home" class="w-5 h-5" />
            <span>{{ $t('home') }}</span>
          </NuxtLink>
          <NuxtLink
              to="/aboutMe"
              class=" py-2 px-4 flex items-center space-x-2 rounded-full hover:bg-blue-100"
              :class="{ 'text-blue-500': $route.path === '/aboutMe' }"
              @click="isOpen = false"
          >
            <Icon name="heroicons-outline:user" class="w-5 h-5" />
            <span>{{ $t('aboutMe') }}</span>
          </NuxtLink>
          <NuxtLink
              to="/projects"
              class=" py-2 px-4 flex items-center space-x-2 rounded-full hover:bg-blue-100"
              :class="{ 'text-blue-500': $route.path === '/projects' }"
              @click="isOpen = false"
          >
            <Icon name="heroicons-outline:briefcase" class="w-5 h-5" />
            <span>{{ $t('projects') }}</span>
          </NuxtLink>
          <NuxtLink
              to="/contactMe"
              class=" py-2 px-4 flex items-center space-x-2 rounded-full hover:bg-blue-100"
              :class="{ 'text-blue-500': $route.path === '/contactMe' }"
              @click="isOpen = false"
          >
            <Icon name="heroicons-outline:mail" class="w-5 h-5" />
            <span>{{ $t('contactMe') }}</span>
          </NuxtLink>
        </div>
      </div>
    </USlideover>
  </nav>
</template>

<script setup lang="ts">
const isOpen = ref(false);
const colorMode = useColorMode();
const isDark = computed(() => colorMode.value === 'dark');
</script>
