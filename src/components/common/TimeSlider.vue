<!-- src/components/common/TimeSlider.vue -->
<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  modelValue: number
  min: number
  max: number
}>()

const emit = defineEmits(['update:modelValue'])

function onInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', Number(target.value))
}

const formattedTime = computed(() => props.modelValue.toFixed(2))
const formattedMin = computed(() => props.min.toFixed(2))
const formattedMax = computed(() => props.max.toFixed(2))
</script>

<template>
  <div class="w-full flex items-center rounded-md bg-gray-800/80 p-3 text-white backdrop-blur-sm space-x-4">
    <span class="w-20 text-center heading01 font-mono">{{ formattedMin }} s</span>
    <div class="flex flex-grow flex-col items-center">
      <input
        type="range"
        :min="min"
        :max="max"
        :value="modelValue"
        step="0.01"
        class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-60"
        @input="onInput"
      >
      <span class="mt-1 body02 font-bold font-mono">{{ formattedTime }} s</span>
    </div>
    <span class="w-20 text-center heading01 font-mono">{{ formattedMax }} s</span>
  </div>
</template>

<style scoped>
/* Custom styles for the range input thumb for better visibility */
input[type='range']::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid white;
  @apply bg-blue-70;
}

input[type='range']::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid white;
  @apply bg-blue-70;
}
</style>
