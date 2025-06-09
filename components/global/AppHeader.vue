<template>
  <header class="bg-white dark:bg-gray-800 shadow sticky top-0 z-50">
    <nav class="container mx-auto px-4 lg:px-6 py-3 flex justify-between items-center">
      <NuxtLink to="/" class="text-xl font-bold text-blue-600 dark:text-blue-400">
        OptiNetSim
      </NuxtLink>

      <div class="flex items-center space-x-4">
        <NuxtLink
          to="/networks"
          class="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
          active-class="text-blue-600 dark:text-blue-400 font-semibold"
        >
          Networks
        </NuxtLink>
        <NuxtLink
          to="/libraries"
          class="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
          active-class="text-blue-600 dark:text-blue-400 font-semibold"
        >
          Libraries
        </NuxtLink>
        <DarkToggle />
        <!-- Add other header items if needed -->
      </div>
    </nav>
  </header>
</template>

<script setup lang="ts">
</script>
