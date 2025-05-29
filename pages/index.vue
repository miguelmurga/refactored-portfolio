<template>
  <div
      class="min-h-screen flex flex-col"
      :class="isDark ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'"
  >
    <!-- Header -->
    <header class="text-center mt-10">
      <img
          src="/img/miguel.jpg"
          alt="Miguel Murga"
          class="rounded-full h-40 w-40 mx-auto mb-4 shadow-lg ring-4"
          :class="$colorMode.value === 'dark' ? 'ring-blue-500' : 'ring-gray-500'"
      />

      <h1
          class="text-4xl font-extrabold mb-2 transition-all"
          :class="$colorMode.value === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'"
      >
        {{ $t('intro.greeting') }}
      </h1>

      <p class="text-lg font-medium text-center text-gray-700 dark:text-gray-300 max-w-xl mx-auto">
        {{ $t('intro.role1') }} | {{ $t('intro.role2') }} | {{ $t('intro.role3') }}
      </p>

      <!-- Botón muy sutil debajo -->
      <button
          @click="lineageModalOpen = true"
          class="mt-2 text-sm text-gray-500 hover:text-primary underline underline-offset-2 transition"
      >
        {{ $t('lineage.button') }}
      </button>
    </header>

    <SessionWelcome />

    <!-- Skills Section -->
    <main class="flex-grow px-4 mt-10">
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 max-w-screen-lg mx-auto">
        <div
            v-for="(skills, category) in skillCategories"
            :key="category"
            class="p-6 border rounded-xl shadow-lg transition-all transform hover:scale-105 overflow-y-auto max-h-96"
            :class="isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-200 border-gray-300'"
        >
          <h2
              class="text-2xl font-bold mb-4 border-b pb-2"
              :class="isDark ? 'text-blue-400 border-gray-600' : 'text-blue-600 border-gray-400'"
          >
            {{ category }}
          </h2>
          <div v-for="item in skills" :key="item.language" class="mb-4">
            <div
                class="flex items-center space-x-4 cursor-pointer p-2 rounded-lg transition-colors group"
                :class="isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-300'"
                @click="handleItemClick(item)"
            >
              <div
                  class="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center shadow-md border group-hover:ring-2"
                  :class="isDark
                ? 'bg-white border-gray-300 group-hover:ring-blue-400'
                : 'bg-gray-200 border-gray-400 group-hover:ring-blue-600'"
              >
                <img
                    :src="item.image || '/img/static.jpg'"
                    alt="Skill Icon"
                    class="max-w-full max-h-full object-contain"
                />
              </div>

              <div>
                <h3 class="text-lg font-semibold" :class="isDark ? 'group-hover:text-blue-300' : 'group-hover:text-blue-600'">
                  {{ item.language }}
                </h3>
                <a
                    v-if="item.url"
                    :href="item.url"
                    target="_blank"
                    class="text-sm underline"
                    :class="isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'"
                    @click.stop
                >
                  Documentation
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Modal existente -->
    <UModal v-model="modalOpen">
      <div
          class="p-6 rounded-xl shadow-xl transition-all transform"
          :class="isDark ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-900'"
      >
        <h2
            class="text-2xl font-bold"
            :class="isDark ? 'text-blue-400' : 'text-blue-600'"
        >
          {{ currentItem?.language || $t('Skill Details') }}
        </h2>
        <p v-if="currentItem?.language" class="mt-4">
          {{ $t(currentItem.language) }}
        </p>
        <a
            v-if="currentItem?.url"
            :href="currentItem.url"
            target="_blank"
            class="mt-4 underline block"
            :class="isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'"
        >
          {{ $t('Visit Documentation') }}
        </a>
        <button
            @click="closeModal"
            class="mt-4 py-2 px-4 rounded-lg shadow-md transition-all"
            :class="isDark
        ? 'bg-blue-500 hover:bg-blue-600 text-white'
        : 'bg-blue-600 hover:bg-blue-700 text-white'"
        >
          {{ $t('close') }}
        </button>
      </div>
    </UModal>

    <!-- ✅ NUEVO MODAL DE LINEAGE -->
    <UModal v-model="lineageModalOpen">
      <UCard>
        <template #header>
          <h2 class="text-lg font-semibold">
            {{ $t('lineage.title') }}
          </h2>
        </template>

        <div class="space-y-4">
          <!-- Texto adicional -->
          <div class="mt-6 p-4 bg-gray-100 border-l-4 border-blue-500 text-sm text-gray-800">
            <p>
              They claimed that the child may acquire frames of a linear pattern of sentence elements and learn the stimulus-response equivalences that can be substituted within each frame; imitation was an important, if not essential, aspect of establishing stimulus-response associations.
            </p>
          </div>

          <!-- Botón para "Miguel Segundo" -->
          <UButton
              block
              color="blue"
              variant="soft"
              to="https://www.academia.edu/28750241/Exploring_challenges_in_the_process_of_young_language_learners_a_case_study_at_CIEX_?auto=download"
              target="_blank"
          >
            {{ $t('lineage.miguelSecond') }}.
          </UButton>

          <!-- Botón para "Miguel Primero" -->
          <UButton
              block
              color="rose"
              variant="soft"
              to="https://www.youtube.com/watch?v=D1hvhTdPo5Q"
              target="_blank"
          >
            {{ $t('lineage.miguelFirst') }}.
          </UButton>

          <!-- Firma añadida -->
          <div class="mt-4 text-center text-sm">
            <p>{{ $t('lineage.signature') }}.</p>
          </div>
        </div>

        <template #footer>
          <!-- Botón de cierre -->
          <UButton @click="lineageModalOpen = false">
            {{ $t('close') }}
          </UButton>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

interface Skill {
  language: string;
  description?: string;
  image?: string;
  url?: string;
}

interface SkillCategories {
  [key: string]: Skill[];
}

const skillCategories = ref<SkillCategories>({});
const modalOpen = ref(false);
const currentItem = ref<Skill | null>(null);
const lineageModalOpen = ref(false);

const colorMode = useColorMode();
const isDark = computed(() => colorMode.value === "dark");

const { t } = useI18n({
  useScope: 'global',
  messages: {
    en: {
      'Skill Details': 'Skill Details',
      'Visit Documentation': 'Visit Documentation',
      'close': 'Close'
    },
    es: {
      'Skill Details': 'Detalles de Habilidad',
      'Visit Documentation': 'Visitar Documentación',
      'close': 'Cerrar'
    }
  }
});

async function fetchSkills() {
  try {
    const response = await fetch("/miguelSkills.json");
    if (!response.ok) {
      console.error("Failed to fetch skills:", response.statusText);
      return;
    }
    const data = await response.json();
    skillCategories.value = {
      "Web Development": data.techSkills || [],
      "CEH": data.itSkills || [],
      "Generative AI": data.dataScienceSkills || [],
    };
  } catch (error) {
    console.error("Error fetching skills:", error);
  }
}

function handleItemClick(item: Skill) {
  currentItem.value = item;
  modalOpen.value = true;
}

function closeModal() {
  modalOpen.value = false;
  currentItem.value = null;
}

onMounted(() => {
  fetchSkills();
});
</script>
