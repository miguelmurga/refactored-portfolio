<!-- components/global/SectionSelector.vue -->
<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 2xl:grid-cols-4 gap-8 p-4">
    <div
        v-for="section in sections"
        :key="section.id"
        @click="navigate(section.link)"
        class="cursor-pointer"
    >
      <div class="rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:translate-y-[-5px] group relative bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
        <!-- Cabecera con gradiente e icono -->
        <div class="h-48 w-full bg-gradient-to-br flex items-center justify-center p-6"
             :style="{ backgroundImage: `linear-gradient(to bottom right, ${getSectionGradient(section.id).start}, ${getSectionGradient(section.id).end})` }">
          <div class="text-white" v-html="getSectionIcon(section.id)"></div>
        </div>

        <!-- Contenido de la tarjeta -->
        <div class="p-6">
          <h2 class="text-xl font-bold mb-3 text-gray-800 dark:text-gray-100">
            {{ t(section.titleKey) }}
          </h2>
          <p class="text-sm text-gray-600 dark:text-gray-300 mb-4 min-h-[60px]">
            {{ t(section.descriptionKey) }}
          </p>
          <div class="inline-flex items-center text-indigo-600 dark:text-indigo-400 text-sm font-medium">
            Explorar
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const router = useRouter()

// Función para obtener gradientes de colores basados en ID
const getSectionGradient = (id: number) => {
  const gradients = [
    { start: '#3B41C5', end: '#1D56AA' }, // Azul profundo (Ciberseguridad)
    { start: '#4158D0', end: '#C850C0' }, // Violeta-Rosa (LLMs)
    { start: '#0093E9', end: '#80D0C7' }, // Azul-Turquesa (Base de datos)
    { start: '#8EC5FC', end: '#E0C3FC' }, // Lavanda suave (Fotos)
    { start: '#6A11CB', end: '#2575FC' }, // Púrpura-Azul (Whisper)
    { start: '#FF3CAC', end: '#784BA0' }, // Rosa-Morado (YouTube)
    { start: '#3F2B96', end: '#A8C0FF' }, // Azul Noche (Historial)
    { start: '#0F2027', end: '#2C5364' }, // Azul oscuro (Negocios IA)
    { start: '#1A2980', end: '#26D0CE' }  // Azul-Turquesa (Aprendizaje)
  ];
  return gradients[(id - 1) % gradients.length];
}

// Función para obtener iconos SVG basados en ID
const getSectionIcon = (id: number) => {
  const icons = [
    // 1. Ciberseguridad
    `<svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>`,

    // 2. LLMs Chatbot
    `<svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
      <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
    </svg>`,

    // 3. DB Query Agent
    `<svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
      <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
    </svg>`,

    // 4. Photos Journey
    `<svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
      <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>`,

    // 5. Integrate Whisper
    `<svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
    </svg>`,

    // 6. YouTube Videos
    `<svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
      <path stroke-linecap="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
    </svg>`,

    // 7. Conversation History
    `<svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
      <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
    </svg>`,

    // 8. Generative AI Business
    `<svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
      <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
    </svg>`,

    // 9. Learn English
    `<svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>`,
  ];
  return icons[(id - 1) % icons.length];
}

// Definición de secciones
const sections = ref([
  {
    id: 1,
    titleKey: 'sections.chatbot_cyber',
    descriptionKey: 'sections.chatbot_cyber_desc',
    link: '/chatbot-cyber',
  },
  {
    id: 2,
    titleKey: 'sections.chatbot_llms',
    descriptionKey: 'sections.chatbot_llms_desc',
    link: '/chatbot-cyber',
  },
  {
    id: 3,
    titleKey: 'sections.db_query_agent',
    descriptionKey: 'sections.db_query_agent_desc',
    link: '/chatbot-cyber',
  },
  {
    id: 4,
    titleKey: 'sections.photos_journey',
    descriptionKey: 'sections.photos_journey_desc',
    link: '/WorkInProgressPage',
  },
  {
    id: 5,
    titleKey: 'sections.integrate_whisper',
    descriptionKey: 'sections.integrate_whisper_desc',
    link: '/WorkInProgressPage',
  },
  {
    id: 6,
    titleKey: 'sections.youtube_videos',
    descriptionKey: 'sections.youtube_videos_desc',
    link: '/WorkInProgressPage',
  },
  {
    id: 7,
    titleKey: 'sections.conversation_history',
    descriptionKey: 'sections.conversation_history_desc',
    link: '/chatbot-cyber',
  },
  {
    id: 8,
    titleKey: 'sections.generative_ai_business',
    descriptionKey: 'sections.generative_ai_business_desc',
    link: '/WorkInProgressPage',
  },
  {
    id: 9,
    titleKey: 'sections.learn_english',
    descriptionKey: 'sections.learn_english_desc',
    link: 'https://ciexacapulco.com/',
  }
])

const navigate = (link: string) => {
  if (link.startsWith('http')) {
    window.open(link, '_blank')
  } else {
    router.push(link)
  }
}
</script>