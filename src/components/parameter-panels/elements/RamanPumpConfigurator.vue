<!-- src/components/parameter-panels/elements/RamanPumpConfigurator.vue -->
<script setup lang="ts">
import type { RamanPump } from '~/types/network' // Assuming RamanPump type is defined
import { useI18n } from 'vue-i18n'
import InputField from '~/components/common/InputField.vue'
import SelectField from '~/components/common/SelectField.vue'

const props = defineProps<{
  pumps: RamanPump[]
}>()

const emit = defineEmits<{
  (e: 'update:pumps', pumps: RamanPump[]): void
}>()

const { t } = useI18n()

const propagationDirectionOptions = ['coprop', 'counterprop']

function updatePump(_index: number) {
  const updatedPumps = [...props.pumps]
  // const pumpToUpdate = updatedPumps[_index]
  // The v-model in InputField and SelectField will already update 'pumpToUpdate'.
  // We just need to ensure the parent receives the updated array reference.
  emit('update:pumps', updatedPumps)
}
</script>

<template>
  <div v-if="pumps && pumps.length">
    <h4 class="expressionHeading02 mb-3 mt-4 text-teal-60 dark:text-teal-40">
      {{ t('editor.device_params.raman_fiber.pumps_title') }}
    </h4>
    <div v-for="(pump, index) in pumps" :key="index" class="mb-6 border-b border-gray-20 pb-4 last:border-b-0 dark:border-gray-80">
      <h5 class="mb-2 body01 text-gray-70 font-semibold dark:text-gray-30">
        {{ t('editor.device_params.raman_fiber.pump_label') }} {{ index + 1 }}
      </h5>
      <div class="grid grid-cols-1 gap-4">
        <InputField
          :id="`raman-pump-${index}-power`"
          v-model="pump.power"
          :label="t('editor.device_params.raman_fiber.power')"
          type="number"
          unit="W"
          step="any"
          @update:model-value="updatePump(index)"
        />
        <InputField
          :id="`raman-pump-${index}-frequency`"
          v-model="pump.frequency"
          :label="t('editor.device_params.raman_fiber.frequency')"
          type="number"
          unit="Hz"
          step="any"
          @update:model-value="updatePump(index)"
        />
        <SelectField
          :id="`raman-pump-${index}-direction`"
          v-model="pump.propagation_direction"
          :label="t('editor.device_params.raman_fiber.propagation_direction')"
          :options="propagationDirectionOptions"
          @update:model-value="updatePump(index)"
        />
      </div>
    </div>
  </div>
  <div v-else class="mt-4 body01 text-gray-50 dark:text-gray-40">
    {{ t('editor.device_params.raman_fiber.no_pumps') }}
  </div>
</template>
