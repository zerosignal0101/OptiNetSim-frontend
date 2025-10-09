<!-- src/components/parameter-panels/elements/ElementPanelWrapper.vue -->
<script setup lang="ts">
import type { NetworkService } from '~/types/network'
import { useI18n } from 'vue-i18n'
import InputField from '~/components/common/InputField.vue'
import SelectField from '~/components/common/SelectField.vue'

const props = defineProps<{
  service: NetworkService
}>()

const emit = defineEmits<{
  (e: 'update:service', service: NetworkService): void
}>()

const { t } = useI18n()

const localService = ref(props.service)
watch(
  () => props.service,
  (newService) => {
    localService.value = newService
  },
)

// Helper to emit the full element object when any property changes
function updateService() {
  emit('update:service', localService.value)
}

// Unit conversion computed properties
const serviceBitRateGbit = computed({
  get: () => localService.value.service_requirements.bandwidth / 1e9,
  set: (value) => {
    localService.value.service_requirements.bandwidth = value * 1e9
  },
})
</script>

<template>
  <div class="grid grid-cols-1 gap-4 p-4">
    <h3 class="mb-3 heading03 text-teal-70 dark:text-teal-30">
      {{ localService.name || 'Unnamed Element' }}
    </h3>

    <!-- Name (Editable) -->
    <InputField
      id="element-name"
      v-model="localService.name"
      :label="t('editor.device_params.name')"
      type="text"
      @update:model-value="updateService"
    />

    <!-- Type Selection (Editable) -->
    <SelectField
      id="element-type"
      v-model="localService.status"
      label="Status"
      :options="['Active', 'Inactive', 'Provisioning']"
      @update:model-value="updateService"
    />

    <!-- Divider -->
    <div class="mt-3 h-px w-full bg-gray-30 dark:bg-gray-70" />

    <!-- Device-specific parameter panels -->
    <div v-if="localService.service_id">
      <h3 class="mb-4 heading02 text-teal-70 dark:text-teal-30">
        {{ t('editor.device_params.params') }}
      </h3>

      <InputField
        id="si-f-min"
        v-model="serviceBitRateGbit"
        label="Bit rate"
        type="number"
        unit="Gbit/s"
        step="any"
        @update:model-value="updateService"
      />
    </div>
  </div>
</template>
