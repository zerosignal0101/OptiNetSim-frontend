<!-- src/components/parameter-panels/elements/ElementPanelWrapper.vue -->
<script setup lang="ts">
import type { NetworkElement } from '~/types/network'
import { useI18n } from 'vue-i18n'
import InputField from '~/components/common/InputField.vue'
import SelectField from '~/components/common/SelectField.vue'

// Import device-specific panels
import EdfaParametersPanel from './EdfaParametersPanel.vue'
import FiberParametersPanel from './FiberParametersPanel.vue'
import FusedParametersPanel from './FusedParametersPanel.vue'
import RamanFiberParametersPanel from './RamanFiberParametersPanel.vue'
import RoadmParametersPanel from './RoadmParametersPanel.vue'

const props = defineProps<{
  element: NetworkElement
  supportedDeviceTypes: string[]
  availableTypeVarieties: string[] | null
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
  <div class="grid grid-cols-1 gap-4 p-4">
    <h3 class="mb-3 heading03 text-teal-70 dark:text-teal-30">
      {{ localElement.name || 'Unnamed Element' }}
    </h3>

    <!-- Name (Editable) -->
    <InputField
      id="element-name"
      v-model="localElement.name"
      :label="t('editor.device_params.name')"
      type="text"
      @update:model-value="updateElement"
    />

    <!-- Type Selection (Editable) -->
    <SelectField
      id="element-type"
      v-model="localElement.type"
      :label="t('editor.device_params.type')"
      :options="supportedDeviceTypes"
      @update:model-value="updateElement"
    />

    <!-- Type Variety Selection (Editable) -->
    <SelectField
      id="element-type-variety"
      v-model="localElement.type_variety"
      :label="t('editor.device_params.type_variety')"
      :options="availableTypeVarieties || []"
      default-value=""
      @update:model-value="updateElement"
    >
      <template #default>
        <option value="">
          {{ t('editor.device_params.no_variety') }}
        </option>
      </template>
    </SelectField>

    <!-- Divider -->
    <div class="mt-3 h-px w-full bg-gray-30 dark:bg-gray-70" />

    <!-- Device-specific parameter panels -->
    <div v-if="localElement.params || localElement.operational">
      <h3 class="mb-4 heading02 text-teal-70 dark:text-teal-30">
        {{ t('editor.device_params.params') }}
      </h3>

      <EdfaParametersPanel
        v-if="localElement.type === 'Edfa'"
        :element="element"
        @update:element="emit('update:element', $event)"
      />

      <FiberParametersPanel
        v-else-if="localElement.type === 'Fiber'"
        :element="element"
        @update:element="emit('update:element', $event)"
      />

      <RamanFiberParametersPanel
        v-else-if="localElement.type === 'RamanFiber'"
        :element="element"
        @update:element="emit('update:element', $event)"
      />

      <FusedParametersPanel
        v-else-if="localElement.type === 'Fused'"
        :element="element"
        @update:element="emit('update:element', $event)"
      />

      <RoadmParametersPanel
        v-else-if="localElement.type === 'Roadm'"
        :element="element"
        @update:element="emit('update:element', $event)"
      />

      <!-- Add more device types here as needed -->
      <div v-else class="body01 text-gray-50 dark:text-gray-40">
        {{ t('editor.device_params.no_specific_params') }}
      </div>
    </div>
  </div>
</template>
