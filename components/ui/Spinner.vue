<template>
  <div class="spinner" :class="[size, color]">
    <div class="dot1"></div>
    <div class="dot2"></div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  size: {
    type: String,
    default: 'md',
    validator: (val: string) => ['sm', 'md', 'lg'].includes(val)
  },
  color: {
    type: String,
    default: 'primary',
    validator: (val: string) => ['primary', 'white', 'gray', 'black'].includes(val)
  }
});
</script>

<style scoped>
.spinner {
  position: relative;
  display: inline-block;
}

.spinner .dot1, .spinner .dot2 {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background-color: currentColor;
  opacity: 0.6;
  position: absolute;
  top: 0;
  left: 0;
  animation: sk-bounce 2.0s infinite ease-in-out;
}

.spinner .dot2 {
  animation-delay: -1.0s;
}

/* Sizes */
.sm {
  width: 16px;
  height: 16px;
}

.md {
  width: 24px;
  height: 24px;
}

.lg {
  width: 32px;
  height: 32px;
}

/* Colors */
.primary {
  color: var(--color-primary-500, #3b82f6);
}

.white {
  color: white;
}

.gray {
  color: #6b7280;
}

.black {
  color: #1f2937;
}

@keyframes sk-bounce {
  0%, 100% { 
    transform: scale(0.0);
  } 50% { 
    transform: scale(1.0);
  }
}
</style>