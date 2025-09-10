<!-- src/components/common/InputField.vue -->
<script setup lang="ts">
const props = defineProps<{
  id: string
  label: string
  modelValue: string | number | null
  type?: 'text' | 'number'
  step?: string | number
  min?: string | number
  max?: string | number
  unit?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number | null): void
}>()

const localValue = ref(props.modelValue)
watch(
  () => props.modelValue,
  (newValue) => {
    localValue.value = newValue
  },
)
</script>

<template>
  <div>
    <label :for="id" class="mb-2 block body01 text-gray-60 dark:text-gray-40">
      {{ label }}<span v-if="unit"> ({{ unit }})</span>:
    </label>
    <input
      :id="id"
      v-model="localValue"
      :type="type || 'text'"
      :step="step"
      :min="min"
      :max="max"
      class="input-field"
      @blur="emit('update:modelValue', localValue)"
    >
  </div>
</template>

<style scoped>
.input-field {
  @apply w-full rounded-none border border-gray-60 bg-white px-3 py-2 text-gray-100
         focus:border-blue-60 focus:outline-none focus:ring-1 focus:ring-blue-60
         dark:border-gray-50 dark:bg-gray-80 dark:text-gray-10;
}
</style>
