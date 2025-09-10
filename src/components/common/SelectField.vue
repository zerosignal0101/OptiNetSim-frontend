<!-- src/components/common/SelectField.vue -->
<script setup lang="ts">
const props = defineProps<{
  id: string
  label: string
  modelValue: string | number | null
  options: (string | { value: string | number, text: string })[] | null
  defaultValue?: string // For "No Variety" or default empty option
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

function getOptionValue(option: string | { value: string | number, text: string }): string | number {
  return typeof option === 'string' ? option : option.value
}

function getOptionText(option: string | { value: string | number, text: string }): string {
  return typeof option === 'string' ? option : option.text
}
</script>

<template>
  <div>
    <label :for="id" class="mb-2 block body01 text-gray-60 dark:text-gray-40">{{ label }}:</label>
    <select
      :id="id"
      v-model="localValue"
      class="input-field"
      @change="emit('update:modelValue', localValue)"
    >
      <option v-if="defaultValue !== undefined" :value="defaultValue">
        {{ defaultValue }}
      </option>
      <option
        v-for="(option, index) in options"
        :key="index"
        :value="getOptionValue(option)"
      >
        {{ getOptionText(option) }}
      </option>
    </select>
  </div>
</template>

<style scoped>
.input-field {
  @apply w-full rounded-none border border-gray-60 bg-white px-3 py-2 text-gray-100
         focus:border-blue-60 focus:outline-none focus:ring-1 focus:ring-blue-60
         dark:border-gray-50 dark:bg-gray-80 dark:text-gray-10;
}
</style>
