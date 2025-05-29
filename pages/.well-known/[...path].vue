<template>
  <div>
    <!-- Empty template - this catches all .well-known paths to prevent router warnings -->
  </div>
</template>

<script setup>
// Handle Chrome DevTools and other .well-known paths
// This prevents Vue Router warnings for paths like:
// /.well-known/appspecific/com.chrome.devtools.json

const route = useRoute()

// Return 404 for .well-known paths that don't exist
// This is better than router warnings
setResponseStatus(404)

// Optional: Log for debugging in development
if (process.dev) {
  console.log(`[Well-Known] Handled path: ${route.fullPath}`)
}
</script>