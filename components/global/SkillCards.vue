<template>
  <div class="container mx-auto p-4">
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      <div
          v-for="item in items"
          :key="item.language"
          @click="handleItemClick(item)"
          class="border p-4 rounded-lg shadow-lg transition-transform transform hover:scale-105 cursor-pointer"
          :class="isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'"
      >
        <div class="flex flex-col">
          <div class="aspect-w-16 aspect-h-9 w-full overflow-hidden rounded-md">
            <img
                :src="item.image || '/img/static.jpg'"
                alt="Skill Image"
                class="object-cover w-full h-full"
            />
          </div>
          <h1 class="text-lg font-bold mt-3">{{ item.language }}</h1>
          <a
              v-if="item.url"
              :href="item.url"
              target="_blank"
              class="text-sm text-blue-500 hover:underline"
          >
            Learn more
          </a>
        </div>
      </div>
    </div>

    <UModal v-model="modalOpen">
      <div
          class="p-4 rounded-lg"
          :class="isDark ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-900'"
      >
        <h2 class="text-xl font-bold">{{ currentItem?.language || 'Skill Details' }}</h2>
        <p v-if="currentItem?.description" class="mt-2">{{ currentItem.description }}</p>
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

const props = defineProps({
  items: {
    type: Array,
    required: true,
  },
});

const modalOpen = ref(false);
const currentItem = ref(null);
const colorMode = useColorMode();
const isDark = computed(() => colorMode.value === 'dark');

function handleItemClick(item) {
  currentItem.value = item;
  modalOpen.value = true;
}

function closeModal() {
  modalOpen.value = false;
  currentItem.value = null;
}
</script>
