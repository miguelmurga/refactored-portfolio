<!-- components/global/SectionSelector.vue -->
<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
    <div
        v-for="section in sections"
        :key="section.id"
        @click="navigate(section.link)"
        class="cursor-pointer"
    >
      <div class="rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-transform duration-300 transform hover:scale-105 group relative">
        <!-- Imagen de fondo con colores como fallback -->
        <div
            class="h-40 w-full bg-cover bg-center"
            :style="{ backgroundColor: getSectionColor(section.id) }"
        >
          <div class="h-full w-full flex items-center justify-center text-white font-bold text-xl">
            {{ section.id }}
          </div>
        </div>

        <!-- Contenido de la tarjeta -->
        <div class="p-4 bg-white dark:bg-gray-800">
          <h2 class="text-lg font-bold mb-2 text-center">
            {{ t(section.titleKey) }}
          </h2>
          <p class="text-sm text-gray-600 dark:text-gray-300 text-center group-hover:opacity-100 opacity-0 transition-opacity duration-300">
            {{ t(section.descriptionKey) }}
          </p>
        </div>

        <!-- Overlay en hover -->
        <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition duration-300"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const router = useRouter()

// Función para obtener un color basado en la ID
const getSectionColor = (id: number) => {
  const colors = [
    '#4C51BF', // Indigo
    '#2D3748', // Gray
    '#805AD5', // Purple
    '#3182CE', // Blue
    '#38B2AC', // Teal
    '#48BB78', // Green
    '#ED8936', // Orange
    '#E53E3E', // Red
    '#D53F8C'  // Pink
  ];
  return colors[(id - 1) % colors.length];
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
    link: '/chatbot-llms',
  },
  {
    id: 3,
    titleKey: 'sections.db_query_agent',
    descriptionKey: 'sections.db_query_agent_desc',
    link: '/db-query-agent',
  },
  {
    id: 4,
    titleKey: 'sections.photos_journey',
    descriptionKey: 'sections.photos_journey_desc',
    link: '/photos-journey',
  },
  {
    id: 5,
    titleKey: 'sections.integrate_whisper',
    descriptionKey: 'sections.integrate_whisper_desc',
    link: '/integrate-whisper',
  },
  {
    id: 6,
    titleKey: 'sections.youtube_videos',
    descriptionKey: 'sections.youtube_videos_desc',
    link: '/youtube-videos',
  },
  {
    id: 7,
    titleKey: 'sections.conversation_history',
    descriptionKey: 'sections.conversation_history_desc',
    link: '/conversation-history',
  },
  {
    id: 8,
    titleKey: 'sections.generative_ai_business',
    descriptionKey: 'sections.generative_ai_business_desc',
    link: '/generative-ai-business',
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