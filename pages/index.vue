<script setup lang="ts">
import { ref, onMounted } from 'vue';

// Reactive variable to store the parsed JSON data
const jsonDataParsed = ref<any>(null);

// Reactive variable to indicate whether the JSON data is valid
const isValidJson = ref<boolean>(true);

/**
 * Async function to load the JSON file.
 */
async function loadJsonData() {
  try {
    // Fetch the JSON file from the specified path
    const response = await fetch('/miguelSkills.json');

    // Check if the HTTP response is valid (status code 200-299)
    if (!response.ok) {
      console.error(`Failed to load JSON data. HTTP status: ${response.status}`);
      isValidJson.value = false; // Mark the JSON as invalid
      return; // Exit the function
    }

    // Parse the JSON response and store it in the reactive variable
    jsonDataParsed.value = await response.json();
    isValidJson.value = true; // Mark the JSON as valid
  } catch (error: any) {
    // Handle any error that occurs during the JSON loading process
    console.error('Error loading JSON data:', error?.message || error);
    isValidJson.value = false; // Mark the JSON as invalid
  }
}

// Lifecycle hook to execute code when the component is mounted
onMounted(() => {
  loadJsonData(); // Call the function to load the JSON
});
</script>

<template>
  <div>
    <!-- Show an error message if the JSON failed to load -->
    <p v-if="!isValidJson">Error loading JSON data</p>

    <!-- Display the JSON content if it was successfully loaded -->
    <pre v-else>{{ jsonDataParsed }}</pre>
  </div>
</template>
