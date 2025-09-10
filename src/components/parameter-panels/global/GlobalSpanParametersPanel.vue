<!-- src/components/parameter-panels/globals/GlobalSpanParametersPanel.vue -->
<script setup lang="ts">
import type { SpanParameters } from '~/types/network'
import { useI18n } from 'vue-i18n'
import CheckboxField from '~/components/common/CheckboxField.vue'
import InputField from '~/components/common/InputField.vue'
import SelectField from '~/components/common/SelectField.vue'

const props = defineProps<{
  span: SpanParameters
}>()

const emit = defineEmits<{
  (e: 'update:span', data: SpanParameters): void
}>()

const localSpan = ref(props.span)

const { t } = useI18n()

// Helper to emit the full Span object when any property changes
function updateSpan() {
  emit('update:span', localSpan.value)
}

const lengthUnitsOptions = ['m', 'km']
</script>

<template>
  <div class="mb-6 rounded-md bg-white p-4 dark:bg-gray-100">
    <h3 class="mb-4 heading03 text-teal-70 dark:text-teal-30">
      {{ t('editor.global.span_config.title') }}
    </h3>

    <div class="grid grid-cols-1 gap-4">
      <CheckboxField
        id="span-power-mode"
        v-model="localSpan.power_mode"
        :label="t('editor.global.span_config.power_mode')"
        @update:model-value="updateSpan"
      />

      <InputField
        id="span-max-fiber-lineic-loss-for-raman"
        v-model="localSpan.max_fiber_lineic_loss_for_raman"
        :label="t('editor.global.span_config.max_fiber_lineic_loss_for_raman')"
        type="number"
        unit="dB"
        step="any"
        @update:model-value="updateSpan"
      />

      <InputField
        id="span-max-length"
        v-model="localSpan.max_length"
        :label="t('editor.global.span_config.max_length')"
        type="number"
        step="any"
        @update:model-value="updateSpan"
      />

      <SelectField
        id="span-length-unit"
        v-model="localSpan.length_units"
        :label="t('editor.global.span_config.length_units')"
        :options="lengthUnitsOptions"
        @update:model-value="updateSpan"
      />

      <InputField
        id="span-max-loss"
        v-model="localSpan.max_loss"
        :label="t('editor.global.span_config.max_loss')"
        type="number"
        unit="dB"
        step="any"
        @update:model-value="updateSpan"
      />

      <InputField
        id="span-padding"
        v-model="localSpan.padding"
        :label="t('editor.global.span_config.padding')"
        type="number"
        unit="dB"
        step="any"
        @update:model-value="updateSpan"
      />

      <InputField
        id="span-eol"
        v-model="localSpan.EOL"
        :label="t('editor.global.span_config.eol')"
        type="number"
        unit="dB"
        step="any"
        @update:model-value="updateSpan"
      />

      <InputField
        id="span-con-in"
        v-model="localSpan.con_in"
        :label="t('editor.global.span_config.con_in')"
        type="number"
        unit="dB"
        step="any"
        @update:model-value="updateSpan"
      />

      <InputField
        id="span-con-out"
        v-model="localSpan.con_out"
        :label="t('editor.global.span_config.con_out')"
        type="number"
        unit="dB"
        step="any"
        @update:model-value="updateSpan"
      />
    </div>
  </div>
</template>
