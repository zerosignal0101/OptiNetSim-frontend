<!-- src/components/parameter-panels/elements/FiberParametersPanel.vue -->
<script setup lang="ts">
import type { NetworkElement } from '~/types/network'
import { useI18n } from 'vue-i18n'
import InputField from '~/components/common/InputField.vue'
import SelectField from '~/components/common/SelectField.vue'

const props = defineProps<{
  element: NetworkElement // Assuming localElement.type is 'Fiber' or 'RamanFiber'
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

const lengthUnitsOptions = ['m', 'km']
</script>

<template>
  <div v-if="localElement.params" class="grid grid-cols-1 gap-4">
    <InputField
      id="fiber-length"
      v-model="localElement.params.length"
      :label="t('editor.device_params.fiber.length')"
      type="number"
      @update:model-value="updateElement"
    />

    <SelectField
      id="fiber-length-units"
      v-model="localElement.params.length_units"
      :label="t('editor.device_params.fiber.length_units')"
      :options="lengthUnitsOptions"
      @update:model-value="updateElement"
    />

    <InputField
      id="fiber-loss-coef"
      v-model="localElement.params.loss_coef"
      :label="t('editor.device_params.fiber.loss_coef')"
      type="number"
      unit="dB/km"
      @update:model-value="updateElement"
    />

    <InputField
      id="fiber-att-in"
      v-model="localElement.params.att_in"
      :label="t('editor.device_params.fiber.att_in')"
      type="number"
      unit="dB"
      @update:model-value="updateElement"
    />

    <InputField
      id="fiber-con-in"
      v-model="localElement.params.con_in"
      :label="t('editor.device_params.fiber.con_in')"
      type="number"
      unit="dB"
      @update:model-value="updateElement"
    />

    <InputField
      id="fiber-con-out"
      v-model="localElement.params.con_out"
      :label="t('editor.device_params.fiber.con_out')"
      type="number"
      unit="dB"
      @update:model-value="updateElement"
    />
  </div>
</template>
