<!-- src/components/parameter-panels/elements/FusedParametersPanel.vue -->
<script setup lang="ts">
import type { NetworkElement } from '~/types/network'
import { useI18n } from 'vue-i18n'
import InputField from '~/components/common/InputField.vue'

const props = defineProps<{
  element: NetworkElement // Assuming element.type is 'Fused'
}>()

const emit = defineEmits<{
  (e: 'update:element', element: NetworkElement): void
}>()

const localElement = ref(props.element)
watch(
  () => props.element,
  (newElement) => {
    localElement.value = newElement
  },
)

const { t } = useI18n()

// Helper to emit the full element object when any property changes
function updateElement() {
  emit('update:element', localElement.value)
}
</script>

<template>
  <div v-if="localElement.params" class="grid grid-cols-1 gap-4">
    <InputField
      id="fused-loss"
      v-model="localElement.params.loss"
      :label="t('editor.device_params.fused.loss')"
      type="number"
      unit="dB"
      @update:model-value="updateElement"
    />
  </div>
</template>
