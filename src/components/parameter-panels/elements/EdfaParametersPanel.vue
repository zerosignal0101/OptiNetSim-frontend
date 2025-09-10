<!-- src/components/parameter-panels/elements/EdfaParametersPanel.vue -->
<script setup lang="ts">
import type { NetworkElement } from '~/types/network'
import { useI18n } from 'vue-i18n'
import InputField from '~/components/common/InputField.vue'

const props = defineProps<{
  element: NetworkElement // Assuming localElement.type is 'Edfa'
}>()

const emit = defineEmits<{
  (e: 'update:element', element: NetworkElement): void
}>()

const { t } = useI18n()

const localElement = ref(props.element)
watch(
  () => props.element,
  (newElement) => {
    localElement.value = newElement
  },
)

// Helper to emit the full element object when any property changes
function updateElement() {
  emit('update:element', localElement.value)
}
</script>

<template>
  <div v-if="localElement.operational && localElement.params" class="grid grid-cols-1 gap-4">
    <h3 class="mb-2 mt-4 heading02 text-teal-70 dark:text-teal-30">
      {{ t('editor.device_params.operational_params') }}
    </h3>

    <InputField
      id="edfa-gain-target"
      v-model="localElement.operational.gain_target"
      :label="t('editor.device_params.edfa.gain_target')"
      type="number"
      unit="dB"
      @update:model-value="updateElement"
    />

    <InputField
      id="edfa-delta-p"
      v-model="localElement.operational.delta_p"
      :label="t('editor.device_params.edfa.delta_p')"
      type="number"
      unit="dB"
      @update:model-value="updateElement"
    />

    <InputField
      id="edfa-out-voa"
      v-model="localElement.operational.out_voa"
      :label="t('editor.device_params.edfa.out_voa')"
      type="number"
      unit="dB"
      @update:model-value="updateElement"
    />

    <InputField
      id="edfa-in-voa"
      v-model="localElement.params.in_voa"
      :label="t('editor.device_params.edfa.in_voa')"
      type="number"
      unit="dB"
      @update:model-value="updateElement"
    />

    <InputField
      id="edfa-tilt-target"
      v-model="localElement.params.tilt_target"
      :label="t('editor.device_params.edfa.tilt_target')"
      type="number"
      unit="dB"
      @update:model-value="updateElement"
    />
  </div>
</template>
