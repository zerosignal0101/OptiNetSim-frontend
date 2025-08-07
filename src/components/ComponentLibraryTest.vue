<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useComponentLibrary } from '~/composables/componentLibrary'

const {
  loadComponentLibrary,
  getSupportedDeviceTypes,
  getAvailableVarieties,
  availableCategories,
  loading,
  error,
} = useComponentLibrary()

const supportedDeviceTypes = ref<string[]>([])
const transceiverVarieties = ref<string[]>([])
const edfaVarieties = ref<string[]>([])
const fiberVarieties = ref<string[]>([])

onMounted(async () => {
  try {
    await loadComponentLibrary()
    supportedDeviceTypes.value = getSupportedDeviceTypes()
    transceiverVarieties.value = getAvailableVarieties('Transceiver')
    edfaVarieties.value = getAvailableVarieties('Edfa')
    fiberVarieties.value = getAvailableVarieties('Fiber')
  }
  catch (err) {
    console.error('Failed to load component library:', err)
  }
})
</script>

<template>
  <div class="p-4">
    <h2 class="mb-4 text-xl font-bold">
      Component Library Test
    </h2>

    <div v-if="loading" class="text-blue-600">
      Loading component library...
    </div>

    <div v-else-if="error" class="text-red-600">
      Error loading component library: {{ error }}
    </div>

    <div v-else>
      <div class="mb-4">
        <h3 class="mb-2 font-semibold">
          Supported Device Types:
        </h3>
        <ul class="list-disc list-inside">
          <li v-for="type in supportedDeviceTypes" :key="type">
            {{ type }}
          </li>
        </ul>
      </div>

      <div class="mb-4">
        <h3 class="mb-2 font-semibold">
          Available Categories:
        </h3>
        <ul class="list-disc list-inside">
          <li v-for="category in availableCategories" :key="category">
            {{ category }}
          </li>
        </ul>
      </div>

      <div class="mb-4">
        <h3 class="mb-2 font-semibold">
          Type Varieties for Transceiver:
        </h3>
        <ul class="list-disc list-inside">
          <li v-for="variety in transceiverVarieties" :key="variety">
            {{ variety }}
          </li>
        </ul>
      </div>

      <div class="mb-4">
        <h3 class="mb-2 font-semibold">
          Type Varieties for Edfa:
        </h3>
        <ul class="list-disc list-inside">
          <li v-for="variety in edfaVarieties" :key="variety">
            {{ variety }}
          </li>
        </ul>
      </div>

      <div class="mb-4">
        <h3 class="mb-2 font-semibold">
          Type Varieties for Fiber:
        </h3>
        <ul class="list-disc list-inside">
          <li v-for="variety in fiberVarieties" :key="variety">
            {{ variety }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
