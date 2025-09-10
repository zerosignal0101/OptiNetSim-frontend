<!-- src/components/parameter-panels/elements/RoadmParametersPanel.vue -->
<script setup lang="ts">
import type { NetworkElement } from '~/types/network'
import { useI18n } from 'vue-i18n'
import InputField from '~/components/common/InputField.vue'

const props = defineProps<{
  element: NetworkElement // Assuming element.type is 'Roadm'
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
    <p class="body02 text-gray-50 -mt-2 dark:text-gray-40">
      ({{ t('editor.device_params.roadm.help') }})
    </p>

    <InputField
      id="roadm-target-pch-out-db"
      v-model="localElement.params.target_pch_out_db"
      :label="t('editor.device_params.roadm.target_pch_out_db')"
      type="number"
      unit="dB"
      @update:model-value="updateElement"
    />

    <InputField
      id="roadm-target-psd-out-mwperghz"
      v-model="localElement.params.target_psd_out_mWperGHz"
      :label="t('editor.device_params.roadm.target_psd_out_mWperGHz')"
      type="number"
      unit="mW/GHz"
      @update:model-value="updateElement"
    />

    <InputField
      id="roadm-target-out-mwperslotwidth"
      v-model="localElement.params.target_out_mWperSlotWidth"
      :label="t('editor.device_params.roadm.target_out_mWperSlotWidth')"
      type="number"
      unit="mW/SlotWidth"
      @update:model-value="updateElement"
    />

    <!-- Notes on complex ROADM parameters (restrictions, per_degree_pch_out_db, etc.) apply here.
         They would require more advanced UI components not covered by simple InputField. -->
  </div>
</template>
