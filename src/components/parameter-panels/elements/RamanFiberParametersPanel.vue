<!-- src/components/parameter-panels/elements/RamanFiberParametersPanel.vue -->
<script setup lang="ts">
import type { NetworkElement } from '~/types/network'
import { useI18n } from 'vue-i18n'
import InputField from '~/components/common/InputField.vue'
import FiberParametersPanel from './FiberParametersPanel.vue' // Reuses Fiber params
import RamanPumpConfigurator from './RamanPumpConfigurator.vue'

const props = defineProps<{
  element: NetworkElement // Assuming element.type is 'RamanFiber'
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

// Handler for when RamanPumpConfigurator updates its pumps
function handlePumpsUpdate(updatedPumps: any[]) {
  if (localElement.value.operational) {
    localElement.value.operational.raman_pumps = updatedPumps
    updateElement()
  }
}
</script>

<template>
  <div v-if="localElement.params || localElement.operational" class="grid grid-cols-1 gap-4">
    <h3 class="mb-2 mt-4 heading02 text-teal-70 dark:text-teal-30">
      {{ t('editor.device_params.params') }}
    </h3>
    <FiberParametersPanel
      :element="localElement"
      @update:element="emit('update:element', $event)"
    />

    <h3 class="mb-2 mt-4 heading02 text-teal-70 dark:text-teal-30">
      {{ t('editor.device_params.operational_params') }}
    </h3>
    <div v-if="localElement.operational" class="grid grid-cols-1 gap-4">
      <InputField
        id="raman-fiber-temperature"
        v-model="localElement.operational.temperature"
        :label="t('editor.device_params.raman_fiber.temperature')"
        type="number"
        @update:model-value="updateElement"
      />

      <RamanPumpConfigurator
        v-if="localElement.operational.raman_pumps"
        :pumps="localElement.operational.raman_pumps"
        @update:pumps="handlePumpsUpdate"
      />
    </div>
  </div>
</template>
