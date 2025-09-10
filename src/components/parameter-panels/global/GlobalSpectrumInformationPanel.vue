<!-- src/components/parameter-panels/globals/GlobalSpectrumInformationPanel.vue -->
<script setup lang="ts">
import type { SpectrumInformation } from '~/types/network'
import { computed } from 'vue' // Explicitly import computed
import { useI18n } from 'vue-i18n'
import InputField from '~/components/common/InputField.vue'

const props = defineProps<{
  si: SpectrumInformation
}>()

const emit = defineEmits<{
  (e: 'update:si', data: SpectrumInformation): void
}>()

const { t } = useI18n()

const localSI: Ref<SpectrumInformation> = ref(props.si)

// Helper to emit the full SI object when any property changes
function updateSI() {
  emit('update:si', localSI.value)
}

// Unit conversion computed properties
const siFMinTHz = computed({
  get: () => localSI.value.f_min / 1e12,
  set: (value) => {
    localSI.value.f_min = value * 1e12
  },
})
const siFMaxTHz = computed({
  get: () => localSI.value.f_max / 1e12,
  set: (value) => {
    localSI.value.f_max = value * 1e12
  },
})
const siBaudRateGHz = computed({
  get: () => localSI.value.baud_rate / 1e9,
  set: (value) => {
    localSI.value.baud_rate = value * 1e9
  },
})
const siSpacingGHz = computed({
  get: () => localSI.value.spacing / 1e9,
  set: (value) => {
    localSI.value.spacing = value * 1e9
  },
})
</script>

<template>
  <div class="mb-6 rounded-md bg-white p-4 dark:bg-gray-100">
    <h3 class="mb-4 heading03 text-teal-70 dark:text-teal-30">
      {{ t('editor.global.spectrum_information.title') }}
    </h3>

    <div class="grid grid-cols-1 gap-4">
      <InputField
        id="si-f-min"
        v-model="siFMinTHz"
        :label="t('editor.global.spectrum_information.f_min')"
        type="number"
        unit="THz"
        step="any"
        @update:model-value="updateSI"
      />

      <InputField
        id="si-f-max"
        v-model="siFMaxTHz"
        :label="t('editor.global.spectrum_information.f_max')"
        type="number"
        unit="THz"
        step="any"
        @update:model-value="updateSI"
      />

      <InputField
        id="si-baud-rate"
        v-model="siBaudRateGHz"
        :label="t('editor.global.spectrum_information.baud_rate')"
        type="number"
        unit="GHz"
        step="any"
        @update:model-value="updateSI"
      />

      <InputField
        id="si-spacing"
        v-model="siSpacingGHz"
        :label="t('editor.global.spectrum_information.spacing')"
        type="number"
        unit="GHz"
        step="any"
        @update:model-value="updateSI"
      />

      <InputField
        id="si-roll-off"
        v-model="localSI.roll_off"
        :label="t('editor.global.spectrum_information.roll_off')"
        type="number"
        step="0.01"
        @update:model-value="updateSI"
      />

      <InputField
        id="si-tx-osnr"
        v-model="localSI.tx_osnr"
        :label="t('editor.global.spectrum_information.tx_osnr')"
        type="number"
        unit="dB"
        step="any"
        @update:model-value="updateSI"
      />

      <InputField
        id="si-power-dbm"
        v-model="localSI.power_dbm"
        :label="t('editor.global.spectrum_information.power_dbm')"
        type="number"
        unit="dBm"
        step="any"
        @update:model-value="updateSI"
      />

      <InputField
        id="si-sys-margins"
        v-model="localSI.sys_margins"
        :label="t('editor.global.spectrum_information.sys_margins')"
        type="number"
        unit="dB"
        step="0.01"
        @update:model-value="updateSI"
      />
    </div>
  </div>
</template>
