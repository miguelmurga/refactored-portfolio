<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
    <div
        v-for="section in sections"
        :key="section.id"
        @click="navigate(section.link)"
        class="cursor-pointer"
    >
      <NCard class="group relative overflow-hidden transition-transform duration-300 transform hover:scale-105 hover:shadow-xl">
        <!-- Imagen de fondo -->
        <div class="h-40 w-full bg-cover bg-center" :style="{ backgroundImage: 'url(' + section.image + ')' }"></div>
        <!-- Contenido de la tarjeta -->
        <div class="p-4">
          <h2 class="text-lg font-bold mb-2 text-center">
            {{ t(section.titleKey) }}
          </h2>
          <p class="text-sm text-gray-600 text-center group-hover:opacity-100 opacity-0 transition-opacity duration-300">
            {{ t(section.descriptionKey) }}
          </p>
        </div>
        <!-- Overlay en hover -->
        <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition duration-300"></div>
      </NCard>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const router = useRouter()

// Definición de secciones: título, descripción, enlace y URL de imagen (placeholder)
const sections = ref([
  {
    id: 1,
    titleKey: 'sections.chatbot_cyber',
    descriptionKey: 'sections.chatbot_cyber_desc',
    link: '/chatbot-cyber',
    image: 'https://via.placeholder.com/300x200?text=Cybersecurity'
  },
  {
    id: 2,
    titleKey: 'sections.chatbot_llms',
    descriptionKey: 'sections.chatbot_llms_desc',
    link: '/chatbot-llms',
    image: 'https://via.placeholder.com/300x200?text=LLMs+Chatbot'
  },
  {
    id: 3,
    titleKey: 'sections.db_query_agent',
    descriptionKey: 'sections.db_query_agent_desc',
    link: '/db-query-agent',
    image: 'https://via.placeholder.com/300x200?text=DB+Query+Agent'
  },
  {
    id: 4,
    titleKey: 'sections.photos_journey',
    descriptionKey: 'sections.photos_journey_desc',
    link: '/photos-journey',
    image: 'https://via.placeholder.com/300x200?text=Journey+Photos'
  },
  {
    id: 5,
    titleKey: 'sections.integrate_whisper',
    descriptionKey: 'sections.integrate_whisper_desc',
    link: '/integrate-whisper',
    image: 'https://via.placeholder.com/300x200?text=Integrate+Whisper'
  },
  {
    id: 6,
    titleKey: 'sections.youtube_videos',
    descriptionKey: 'sections.youtube_videos_desc',
    link: '/youtube-videos',
    image: 'https://via.placeholder.com/300x200?text=YouTube+Videos'
  },
  {
    id: 7,
    titleKey: 'sections.conversation_history',
    descriptionKey: 'sections.conversation_history_desc',
    link: '/conversation-history',
    image: 'https://via.placeholder.com/300x200?text=Conversation+History'
  },
  {
    id: 8,
    titleKey: 'sections.generative_ai_business',
    descriptionKey: 'sections.generative_ai_business_desc',
    link: '/generative-ai-business',
    image: 'https://via.placeholder.com/300x200?text=Generative+AI+Business'
  },
  {
    id: 9,
    titleKey: 'sections.learn_english',
    descriptionKey: 'sections.learn_english_desc',
    link: 'https://ciexacapulco.com/',
    image: 'https://via.placeholder.com/300x200?text=Learn+English'
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
