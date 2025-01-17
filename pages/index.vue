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
          class="rounded-full h-40 w-40 mx-auto mb-4 shadow-lg"
          :class="isDark ? 'ring-4 ring-blue-500' : 'ring-4 ring-gray-500'"
      />
      <h1
          class="text-4xl font-extrabold mb-2 transition-all"
          :class="isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'"
      >
        Hello, I'm Miguel Murga
      </h1>
      <p class="text-lg font-medium">
        Developer | CEH | Generative AI Professional
      </p>
    </header>

    <!-- Skills Section -->
    <main class="flex-grow px-4 mt-10">
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 max-w-screen-lg mx-auto">
        <!-- Categories -->
        <div
            v-for="(skills, category) in skillCategories"
            :key="category"
            class="p-6 border rounded-xl shadow-lg transition-all transform hover:scale-105 overflow-y-auto max-h-60"
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
                >
                  Documentation
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Modal -->
    <UModal v-model="modalOpen">
      <div
          class="p-6 rounded-xl shadow-xl transition-all transform"
          :class="isDark ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-900'"
      >
        <!-- Título -->
        <h2
            class="text-2xl font-bold"
            :class="isDark ? 'text-blue-400' : 'text-blue-600'"
        >
          {{ currentItem?.language || $t('Skill Details') }}
        </h2>

        <!-- Descripción -->
        <p v-if="currentItem?.language" class="mt-4">
          {{ $t(currentItem.language) }}
        </p>

        <!-- Enlace -->
        <a
            v-if="currentItem?.url"
            :href="currentItem.url"
            target="_blank"
            class="mt-4 underline block"
            :class="isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'"
        >
          {{ $t('Visit Documentation') }}
        </a>

        <!-- Botón de cerrar -->
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

  </div>
</template>

<script setup lang="ts">
const skillCategories = ref({});
const modalOpen = ref(false);
const currentItem = ref(null);
const colorMode = useColorMode();
const isDark = computed(() => colorMode.value === "dark");

// Fetch skills from miguelSkills.json
async function fetchSkills() {
  const response = await fetch("/miguelSkills.json");
  const data = await response.json();

  // Organize skills into categories
  skillCategories.value = {
    "Web Development": data.techSkills,
    CEH: data.itSkills,
    "Generative AI": data.dataScienceSkills,
  };
}

// Handle item click to open modal
function handleItemClick(item) {
  currentItem.value = item;
  modalOpen.value = true;
}

// Close modal
function closeModal() {
  modalOpen.value = false;
  currentItem.value = null;
}

onMounted(fetchSkills);
</script>
