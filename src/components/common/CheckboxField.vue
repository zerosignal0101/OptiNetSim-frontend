<!-- src/components/common/CheckboxField.vue -->
<script setup lang="ts">
const props = defineProps<{
  id: string
  label: string
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
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
  <div class="flex items-center">
    <input
      :id="id"
      v-model="localValue"
      type="checkbox"
      class="h-5 w-5 border-gray-30 rounded bg-teal-60 focus:ring-teal-50"
      @change="emit('update:modelValue', localValue)"
    >
    <label :for="id" class="ml-2 block body01 text-gray-60 dark:text-gray-40">
      {{ label }}
    </label>
  </div>
</template>
