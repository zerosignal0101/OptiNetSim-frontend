<script setup lang="ts">
const color = useColorMode()

useHead({
  meta: [{
    id: 'theme-color',
    name: 'theme-color',
    content: () => color.value === 'dark' ? '#222222' : '#ffffff',
  }],
})

function toggleDark() {
  color.preference = color.value === 'dark' ? 'light' : 'dark'
}
</script>

<template>
  <button @click="toggleDark">
    <Icon v-if="color.value === 'light'" name="heroicons-outline:sun" class="w-5 h-5" />
    <Icon v-else name="heroicons-outline:moon" class="w-5 h-5" />
  </button>
</template>
