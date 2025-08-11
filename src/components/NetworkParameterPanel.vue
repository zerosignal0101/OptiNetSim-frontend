<!-- src/components/NetworkParameterPanel.vue -->
<script setup lang="ts">
import type { NetworkDetail, NetworkElement, SimulationConfig, SpanParameters, SpectrumInformation } from '~/types/network'

const props = defineProps<{
  isLoading: boolean
  selectedNodes: string[]
  networkDetail: NetworkDetail | null
}>()
const emit = defineEmits<{
  (e: 'update:element', element: NetworkElement | null): void
  (e: 'update:global', type: 'SI' | 'Span' | 'SimulationConfig', data: SpectrumInformation | SpanParameters | SimulationConfig): void
}>()
// const app = getCurrentInstance()! // 确保获取到实例

// const { proxy } = app

const { t } = useI18n()
// const dialog = useDialog()

const currentNodeId = ref<string | null>(null)
const currentElementDetail = computed<NetworkElement | null>(() => {
  if (!currentNodeId.value || !props.networkDetail)
    return null
  return props.networkDetail.elements.find(el => el.element_id === currentNodeId.value) || null
})
const currentSI = computed<SpectrumInformation | null>(() => {
  if (!props.networkDetail)
    return null
  return props.networkDetail.SI || null
})
const currentSpan = computed<SpanParameters | null>(() => {
  if (!props.networkDetail)
    return null
  return props.networkDetail.Span || null
})
const currentSimulationConfig = computed<SimulationConfig | null>(() => {
  if (!props.networkDetail)
    return null
  return props.networkDetail.simulation_config || null
})

// 使用 toRef 将 props 转换为响应式引用
const isLoadingRef = toRef(props, 'isLoading')
const selectedNodesRef = toRef(props, 'selectedNodes')

watch(selectedNodesRef, async (selectedNodes) => {
  const lastIndex = selectedNodes.length - 1
  if (!selectedNodes[lastIndex]) {
    currentNodeId.value = null
  }
  else if (selectedNodes[lastIndex] !== currentNodeId.value) {
    currentNodeId.value = selectedNodes[lastIndex]
  }
})

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
    <h2 text="xl gray-800 dark:slate-200" font="bold" class="mb-4">
      {{ currentNodeId ? 'Properties' : 'Global settings' }}
    </h2>
    <!-- Panel loading -->
    <div v-if="isLoadingRef" class="mb-4 border border-gray-300 rounded-md bg-gray-50 p-3">
      <div class="flex items-center text-teal-800">
        <div class="mr-3 h-4 w-4 animate-spin border-b-2 border-teal-600 rounded-full" />
        Loading
      </div>
    </div>
    <!-- Panel Element Parameters -->
    <div v-else-if="currentElementDetail" grid="~ col-1 gap-2">
      <h3 text="lg teal-700 dark:teal-400" font="semibold" class="mb-2">
        {{ currentElementDetail?.name }}
      </h3>
      <!-- 类型选择 (可编辑) -->
      <div>
        <label for="element-type" text="gray-600 dark:slate-400" class="mb-2 block">{{ t('editor.type') }}:</label>
        <select
          id="element-type" v-model="currentElementDetail.type" class="input-field"
          @change="emit('update:element', currentElementDetail)"
        >
          <option v-for="deviceType in supportedDeviceTypes" :key="deviceType" :value="deviceType">
            {{ deviceType }}
          </option>
        </select>
      </div>
      <!-- 类型变体选择 (可编辑) -->
      <div>
        <label for="element-type-variety" text="gray-600 dark:slate-400" class="mb-2 block">Type variety:</label>
        <select
          id="element-type-variety" v-model="currentElementDetail.type_variety" class="input-field"
          @change="emit('update:element', currentElementDetail)"
        >
          <option value="">
            {{ t('editor.noVariety') }}
          </option>
          <option v-for="variety in availableTypeVarieties" :key="variety" :value="variety">
            {{ variety }}
          </option>
        </select>
      </div>
    </div>
    <!-- Panel Global Parameters -->
    <div v-else flex="grow" class="overflow-y-auto">
      <!-- 频谱信息 (SI) -->
      <div bg="white dark:slate-700" text="sm" class="mb-6 rounded-md p-3 shadow-sm">
        <h3 text="lg teal-700 dark:teal-400" font="semibold" class="mb-2">
          Spectrum information
        </h3>
        <div v-if="currentSI" grid="~ col-1 gap-2" text="sm">
          <div>
            <label for="si-f-min" text="gray-600 dark:slate-400" class="mb-2 block">F min:</label>
            <input
              id="si-f-min" v-model.number="currentSI.f_min" type="number" class="input-field"
              @blur="emit('update:global', 'SI', currentSI)"
            >
          </div>
          <div>
            <label for="si-f-max" text="gray-600 dark:slate-400" class="mb-2 block">F max:</label>
            <input
              id="si-f-max" v-model.number="currentSI.f_max" type="number" class="input-field"
              @blur="emit('update:global', 'SI', currentSI)"
            >
          </div>

          <div>
            <label for="si-baud-rate" text="gray-600 dark:slate-400" class="mb-2 block">Baud Rate (Hz):</label>
            <input
              id="si-baud-rate" v-model.number="currentSI.baud_rate" type="number" class="input-field"
              @blur="emit('update:global', 'SI', currentSI)"
            >
          </div>

          <div>
            <label for="si-spacing" text="gray-600 dark:slate-400" class="mb-2 block">Spacing (Hz):</label>
            <input
              id="si-spacing" v-model.number="currentSI.spacing" type="number" class="input-field"
              @blur="emit('update:global', 'SI', currentSI)"
            >
          </div>

          <div>
            <label for="si-roll-off" text="gray-600 dark:slate-400" class="mb-2 block">Roll Off:</label>
            <input
              id="si-roll-off" v-model.number="currentSI.roll_off" type="number" step="0.01" class="input-field"
              @blur="emit('update:global', 'SI', currentSI)"
            >
          </div>

          <div>
            <label for="si-tx-osnr" text="gray-600 dark:slate-400" class="mb-2 block">TX OSNR (dB):</label>
            <input
              id="si-tx-osnr" v-model.number="currentSI.tx_osnr" type="number" class="input-field"
              @blur="emit('update:global', 'SI', currentSI)"
            >
          </div>

          <div>
            <label for="si-power-dbm" text="gray-600 dark:slate-400" class="mb-2 block">Power (dBm):</label>
            <input
              id="si-power-dbm" v-model.number="currentSI.power_dbm" type="number" class="input-field"
              @blur="emit('update:global', 'SI', currentSI)"
            >
          </div>

          <div>
            <label for="si-sys-margins" text="gray-600 dark:slate-400" class="mb-2 block">Sys Margins (dB):</label>
            <input
              id="si-sys-margins" v-model.number="currentSI.sys_margins" type="number" step="0.01"
              class="input-field" @blur="emit('update:global', 'SI', currentSI)"
            >
          </div>
        </div>
      </div>
      <!-- 跨段参数 (Span) -->
      <div bg="white dark:slate-700" text="sm" class="mb-6 rounded-md p-3 shadow-sm">
        <h3 text="lg teal-700 dark:teal-400" font="semibold" class="mb-2">
          Span
        </h3>
        <div v-if="currentSpan" grid="~ col-1 gap-2" text="sm">
          <div>
            <label for="span-power-mode" text="gray-600 dark:slate-400" class="mb-2 block">Power Mode (boolean):</label>
            <input
              id="span-power-mode" v-model="currentSpan.power_mode" type="checkbox"
              @change="emit('update:global', 'Span', currentSpan)"
            >
          </div>

          <div>
            <label for="span-max-fiber-lineic-loss-for-raman" text="gray-600 dark:slate-400" class="mb-2 block">Max
              Fiber Lineic Loss for Raman (dB):</label>
            <input
              id="span-max-fiber-lineic-loss-for-raman"
              v-model.number="currentSpan.max_fiber_lineic_loss_for_raman" type="number" class="input-field"
              @blur="emit('update:global', 'Span', currentSpan)"
            >
          </div>

          <div>
            <label for="span-max-length" text="gray-600 dark:slate-400" class="mb-2 block">Max Length:</label>
            <input
              id="span-max-length" v-model.number="currentSpan.max_length" type="number" class="input-field"
              @blur="emit('update:global', 'Span', currentSpan)"
            >
          </div>

          <div>
            <label for="span-length-unit" text="gray-600 dark:slate-400" class="mb-2 block">Length Unit:</label>
            <select
              id="span-length-unit" v-model="currentSpan.length_units" class="input-field"
              @change="emit('update:global', 'Span', currentSpan)"
            >
              <option value="m">
                m
              </option>
              <option value="km">
                km
              </option>
            </select>
          </div>

          <div>
            <label for="span-max-loss" text="gray-600 dark:slate-400" class="mb-2 block">Max Loss (dB):</label>
            <input
              id="span-max-loss" v-model.number="currentSpan.max_loss" type="number" class="input-field"
              @blur="emit('update:global', 'Span', currentSpan)"
            >
          </div>

          <div>
            <label for="span-padding" text="gray-600 dark:slate-400" class="mb-2 block">Padding (dB):</label>
            <input
              id="span-padding" v-model.number="currentSpan.padding" type="number" class="input-field"
              @blur="emit('update:global', 'Span', currentSpan)"
            >
          </div>

          <div>
            <label for="span-eol" text="gray-600 dark:slate-400" class="mb-2 block">EOL (dB):</label>
            <input
              id="span-eol" v-model.number="currentSpan.EOL" type="number" class="input-field"
              @blur="emit('update:global', 'Span', currentSpan)"
            >
          </div>

          <div>
            <label for="span-con-in" text="gray-600 dark:slate-400" class="mb-2 block">Con In (dB):</label>
            <input
              id="span-con-in" v-model.number="currentSpan.con_in" type="number" class="input-field"
              @blur="emit('update:global', 'Span', currentSpan)"
            >
          </div>

          <div>
            <label for="span-con-out" text="gray-600 dark:slate-400" class="mb-2 block">Con Out (dB):</label>
            <input
              id="span-con-out" v-model.number="currentSpan.con_out" type="number" class="input-field"
              @blur="emit('update:global', 'Span', currentSpan)"
            >
          </div>
        </div>
      </div>
      <!-- 全局参数 (Global) -->
      <div bg="white dark:slate-700" text="sm" class="mb-6 rounded-md p-3 shadow-sm">
        <h3 text="lg teal-700 dark:teal-400" font="semibold" class="mb-2">
          Global config
        </h3>
        <div v-if="currentSimulationConfig" grid="~ col-1 gap-2" text="sm">
          <div>
            <label for="raman-flag" text="gray-600 dark:slate-400" class="mb-2 block">Raman Params Flag
              (boolean):</label>
            <input
              id="raman-flag" v-model="currentSimulationConfig.raman_params.flag" type="checkbox"
              @change="emit('update:global', 'SimulationConfig', currentSimulationConfig)"
            >
          </div>

          <div>
            <label for="raman-result-spatial-resolution" text="gray-600 dark:slate-400" class="mb-2 block">Raman Params
              Result Spatial Resolution (m):</label>
            <input
              id="raman-result-spatial-resolution"
              v-model.number="currentSimulationConfig.raman_params.result_spatial_resolution" type="number"
              class="input-field" @blur="emit('update:global', 'SimulationConfig', currentSimulationConfig)"
            >
          </div>

          <div>
            <label for="raman-solver-spatial-resolution" text="gray-600 dark:slate-400" class="mb-2 block">Raman Params
              Solver Spatial Resolution (m):</label>
            <input
              id="raman-solver-spatial-resolution"
              v-model.number="currentSimulationConfig.raman_params.solver_spatial_resolution" type="number"
              class="input-field" @blur="emit('update:global', 'SimulationConfig', currentSimulationConfig)"
            >
          </div>

          <div>
            <label for="nli-method" text="gray-600 dark:slate-400" class="mb-2 block">NLI Params Method:</label>
            <input
              id="nli-method" v-model="currentSimulationConfig.nli_params.method" type="text" class="input-field"
              @blur="emit('update:global', 'SimulationConfig', currentSimulationConfig)"
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
