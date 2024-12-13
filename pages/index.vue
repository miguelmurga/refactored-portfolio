<template>
  <div class="min-h-screen bg-gray-900 text-white flex flex-col">
    <!-- Header -->
    <header class="text-center mt-10">
      <img
          src="/img/miguel.jpg"
          alt="Miguel Murga"
          class="rounded-full h-40 w-40 mx-auto mb-4"
      />
      <h1 class="text-4xl font-bold mb-2">Hello, I'm Miguel Murga</h1>
      <p class="text-lg text-gray-400">Developer | CEH | Data Scientist</p>
    </header>

    <!-- Skills Section -->
    <main class="flex-grow px-4 mt-10">
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 max-w-screen-lg mx-auto">
        <!-- Categories -->
        <div
            v-for="(skills, category) in skillCategories"
            :key="category"
            class="p-4 border rounded-lg shadow-lg bg-gray-800 overflow-y-auto max-h-60"
        >
          <h2 class="text-xl font-bold mb-4">{{ category }}</h2>
          <div v-for="item in skills" :key="item.language" class="mb-4">
            <div
                class="flex items-center space-x-3 cursor-pointer hover:bg-gray-700 p-2 rounded-md"
                @click="handleItemClick(item)"
            >
              <img
                  :src="item.image || '/img/static.jpg'"
                  alt="Skill Icon"
                  class="w-10 h-10 rounded-md object-cover"
              />
              <div>
                <h3 class="text-lg font-semibold">{{ item.language }}</h3>
                <a
                    v-if="item.url"
                    :href="item.url"
                    target="_blank"
                    class="text-blue-400 hover:underline text-sm"
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
          class="p-4 rounded-lg"
          :class="isDark ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-900'"
      >
        <h2 class="text-xl font-bold">
          {{ currentItem?.language || 'Skill Details' }}
        </h2>
        <p v-if="currentItem?.description" class="mt-2">
          {{ currentItem.description }}
        </p>
        <a
            v-if="currentItem?.url"
            :href="currentItem.url"
            target="_blank"
            class="mt-4 text-blue-500 hover:underline"
        >
          Visit Documentation
        </a>
        <button @click="closeModal" class="btn mt-4">Close</button>
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
    "Data Science": data.dataScienceSkills,
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
