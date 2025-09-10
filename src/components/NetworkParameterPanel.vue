<!-- src/components/NetworkParameterPanel.vue -->
<script setup lang="ts">
import type { NetworkDetail, NetworkElement, SimulationConfig, SpanParameters, SpectrumInformation } from '~/types/network'

const props = defineProps<{
  isLoading: boolean
  selectedNodes: string[]
  networkDetail: NetworkDetail | null
}>()
const emit = defineEmits<{
  (e: 'update:element', element: NetworkElement): void // Updated to expect a NetworkElement
  (e: 'update:global', type: 'SI' | 'Span' | 'SimulationConfig', data: SpectrumInformation | SpanParameters | SimulationConfig): void
}>()

const { t } = useI18n()

const currentNodeId = ref<string | null>(null)

// Computed property for the currently selected element's details
const currentElementDetail = computed<NetworkElement | null>(() => {
  if (!currentNodeId.value || !props.networkDetail) {
    return null
  }
  const elementDetail = props.networkDetail.elements.find(el => el.element_id === currentNodeId.value) || null
  return elementDetail
})

const currentSI = ref<SpectrumInformation | null>(props.networkDetail?.SI || null)
const currentSpan = ref<SpanParameters | null>(props.networkDetail?.Span || null)
const currentSimulationConfig = ref<SimulationConfig | null>(props.networkDetail?.simulation_config || null)

watch(
  () => props.networkDetail,
  (newDetail) => {
    currentSI.value = newDetail?.SI || null
    currentSpan.value = newDetail?.Span || null
    currentSimulationConfig.value = newDetail?.simulation_config || null
  },
  { deep: true, immediate: true },
)

// Using toRef to keep reactivity for props
const isLoadingRef = toRef(props, 'isLoading')
const selectedNodesRef = toRef(props, 'selectedNodes')

watch(selectedNodesRef, (selectedNodes) => {
  const lastIndex = selectedNodes.length - 1
  if (!selectedNodes[lastIndex]) {
    currentNodeId.value = null
  }
  else if (selectedNodes[lastIndex] !== currentNodeId.value) {
    currentNodeId.value = selectedNodes[lastIndex]
  }
}, { immediate: true }) // Added immediate: true to set initial currentNodeId if nodes are already selected

// Component library integration
const {
  getSupportedDeviceTypes,
  getAvailableVarieties,
} = useComponentLibrary()

const supportedDeviceTypes = getSupportedDeviceTypes()
const availableTypeVarieties = computed<string[] | null>(() => {
  if (!currentElementDetail.value) {
    return null
  }
  return getAvailableVarieties(currentElementDetail.value.type) || null
})
</script>

<template>
  <div flex="~ col" class="h-full">
    <h2 class="p-4 expressiveHeading03 text-gray-100 dark:text-gray-10">
      {{ currentNodeId ? t('editor.device_params.title') : t('editor.global.title') }}
    </h2>

    <!-- Panel loading state -->
    <div v-if="isLoadingRef" class="mb-5 border border-gray-30 rounded-md bg-gray-10 p-4 dark:bg-gray-100">
      <div class="flex items-center text-teal-70">
        <div class="mr-3 h-4 w-4 animate-spin border-b-2 border-teal-50 rounded-full" />
        <span class="body01">{{ t('editor.global.loading') }}</span>
      </div>
    </div>

    <!-- Element-specific parameters panel -->
    <ElementPanelWrapper
      v-else-if="currentElementDetail && currentNodeId"
      :element="currentElementDetail"
      :supported-device-types="supportedDeviceTypes"
      :available-type-varieties="availableTypeVarieties"
      @update:element="emit('update:element', $event)"
    />

    <!-- Global parameters panel -->
    <div v-else flex="grow" class="overflow-y-auto">
      <GlobalSpectrumInformationPanel
        v-if="currentSI"
        v-model:si="currentSI"
        @update:si="emit('update:global', 'SI', $event)"
      />

      <GlobalSpanParametersPanel
        v-if="currentSpan"
        v-model:span="currentSpan"
        @update:span="emit('update:global', 'Span', $event)"
      />

      <GlobalSimulationConfigPanel
        v-if="currentSimulationConfig"
        v-model:simulation-config="currentSimulationConfig"
        @update:simulation-config="emit('update:global', 'SimulationConfig', $event)"
      />
    </div>
  </div>
</template>

<style scoped>
/* Scoped styles can remain here if they are truly global to this component's layout */
</style>
