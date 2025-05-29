<template>
  <div
      class="min-h-screen flex flex-col justify-center items-center"
      :class="isDark ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'"
  >
    <div
        class="w-full max-w-md p-8 rounded-2xl shadow-2xl flex flex-col items-center space-y-6 transition-all"
        :class="isDark ? 'bg-gray-800' : 'bg-white'"
    >
      <img
          src="/img/miguel.jpg"
          alt="Miguel Murga"
          class="rounded-full h-32 w-32 shadow-lg ring-4 mb-4"
          :class="isDark ? 'ring-blue-500' : 'ring-gray-400'"
      />

      <h1
          class="text-3xl font-extrabold text-center"
          :class="isDark ? 'text-blue-400' : 'text-blue-600'"
      >
        Miguel Murga
      </h1>
      <p class="text-lg text-center text-gray-600 dark:text-gray-300">
        {{ $t('intro.role1') }} | {{ $t('intro.role2') }} | {{ $t('intro.role3') }}
      </p>

      <!-- Botón principal LinkedIn -->
      <a
          href="https://www.linkedin.com/in/miguel-murga-171b5220a"
          target="_blank"
          rel="noopener"
          class="mt-4 flex items-center px-6 py-3 rounded-xl shadow-md font-semibold text-lg transition-all gap-2
          hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400
          "
          :class="isDark
          ? 'bg-blue-600 hover:bg-blue-700 text-white'
          : 'bg-blue-500 hover:bg-blue-600 text-white'"
      >
        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path
              d="M20.447 20.452H17.21v-5.569c0-1.327-.026-3.037-1.851-3.037-1.853 0-2.136 1.446-2.136 2.94v5.666h-3.238V9h3.108v1.561h.045c.434-.82 1.494-1.687 3.076-1.687 3.29 0 3.894 2.164 3.894 4.977v6.601zM5.337 7.433c-1.038 0-1.88-.843-1.88-1.881s.842-1.882 1.88-1.882c1.039 0 1.882.844 1.882 1.882 0 1.038-.843 1.881-1.882 1.881zm1.622 13.019H3.715V9h3.244v11.452zM22.225 0H1.771C.792 0 0 .771 0 1.723v20.549C0 23.23.792 24 1.771 24h20.451C23.2 24 24 23.229 24 22.271V1.723C24 .771 23.2 0 22.222 0h.003z"/>
        </svg>
        LinkedIn
      </a>

      <span class="text-sm text-gray-400 mt-2">
        {{ $t('linkedin.note') }}
      </span>
    </div>
  </div>
  <footer class="mt-10 text-center py-4">
    <p class="text-sm">
      &copy; {{ new Date().getFullYear() }} Miguel Murga Guevara. {{ $t('aboutMe.copyright') }}.
    </p>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const colorMode = useColorMode();
const isDark = computed(() => colorMode.value === "dark");

const { t } = useI18n({
  useScope: 'global',
  messages: {
    en: {
      'intro.role1': 'Software Engineer',
      'intro.role2': 'Generative AI Developer',
      'intro.role3': 'Ethical Hacking Enthusiast',
      'linkedin.note': 'Let\'s connect! Visit my LinkedIn profile.',
    },
    es: {
      'intro.role1': 'Ingeniero de Software',
      'intro.role2': 'Desarrollador de IA Generativa',
      'intro.role3': 'Entusiasta de Hacking Ético',
      'linkedin.note': '¡Conectemos! Visita mi perfil de LinkedIn.',
    },
    pt: {
      'intro.role1': 'Engenheiro de Software',
      'intro.role2': 'Desenvolvedor de IA Generativa',
      'intro.role3': 'Entusiasta de Hacking Ético',
      'linkedin.note': 'Vamos nos conectar! Visite meu perfil no LinkedIn.',
    }
  }
});
</script>
