<!-- src/components/parameter-panels/globals/GlobalSimulationConfigPanel.vue -->
<script setup lang="ts">
import type { SimulationConfig } from '~/types/network'
import { useI18n } from 'vue-i18n'
import CheckboxField from '~/components/common/CheckboxField.vue'
import InputField from '~/components/common/InputField.vue'

const props = defineProps<{
  simulationConfig: SimulationConfig
}>()

const emit = defineEmits<{
  (e: 'update:simulationConfig', data: SimulationConfig): void
}>()

const { t } = useI18n()

const localSimulationConfig = ref(props.simulationConfig)

// Helper to emit the full SimulationConfig object when any property changes
function updateSimulationConfig() {
  emit('update:simulationConfig', localSimulationConfig.value)
}
</script>

<template>
  <div class="mb-6 rounded-md bg-white p-4 dark:bg-gray-100">
    <h3 class="mb-4 heading03 text-teal-70 dark:text-teal-30">
      {{ t('editor.global.global_config.title') }}
    </h3>

    <div class="grid grid-cols-1 gap-4">
      <CheckboxField
        id="raman-flag"
        v-model="localSimulationConfig.raman_params.flag"
        :label="t('editor.global.global_config.flag')"
        @update:model-value="updateSimulationConfig"
      />

      <InputField
        id="raman-result-spatial-resolution"
        v-model="localSimulationConfig.raman_params.result_spatial_resolution"
        :label="t('editor.global.global_config.result_spatial_resolution')"
        type="number"
        unit="m"
        step="any"
        @update:model-value="updateSimulationConfig"
      />

      <InputField
        id="raman-solver-spatial-resolution"
        v-model="localSimulationConfig.raman_params.solver_spatial_resolution"
        :label="t('editor.global.global_config.solver_spatial_resolution')"
        type="number"
        unit="m"
        step="any"
        @update:model-value="updateSimulationConfig"
      />

      <InputField
        id="nli-method"
        v-model="localSimulationConfig.nli_params.method"
        :label="t('editor.global.global_config.nli_params')"
        type="text"
        @update:model-value="updateSimulationConfig"
      />
    </div>
  </div>
</template>
