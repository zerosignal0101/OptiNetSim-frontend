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

const siFMinTHz = createUnitConverter(currentSI, 'f_min', 1e12)
const siFMaxTHz = createUnitConverter(currentSI, 'f_max', 1e12)
const siBaudRateGHz = createUnitConverter(currentSI, 'baud_rate', 1e9)
const siSpacingGHz = createUnitConverter(currentSI, 'spacing', 1e9)

/**
 * 创建单位转换计算属性
 * @param {Ref|Reactive} sourceRef 源响应式对象
 * @param {string} propKey 属性名
 * @param {number} factor 转换因子（存储单位 = 显示单位 × factor）
 * @returns {ComputedRef} 可写的计算属性
 */
function createUnitConverter(sourceRef: Ref, propKey: string, factor: number) {
  return computed({
    get() {
      if (sourceRef.value) {
        return sourceRef.value[propKey] / factor
      }
      return 0
    },
    set(value) {
      if (sourceRef.value) {
        sourceRef.value[propKey] = value * factor
      }
    },
  })
}
</script>

<template>
  <div flex="~ col" class="h-full">
    <h2 class="p-4 expressiveHeading03 text-gray-100 dark:text-gray-10">
      {{ currentNodeId ? 'Properties' : 'Global settings' }}
    </h2>

    <!-- Panel loading -->
    <div v-if="isLoadingRef" class="mb-5 border border-gray-30 rounded-md bg-gray-10 p-4 dark:bg-gray-100">
      <div class="flex items-center text-teal-70">
        <div class="mr-3 h-4 w-4 animate-spin border-b-2 border-teal-50 rounded-full" />
        <span class="body01">Loading</span>
      </div>
    </div>

    <!-- Panel Element Parameters -->
    <div v-else-if="currentElementDetail" class="grid grid-cols-1 gap-4 p-4">
      <h3 class="mb-3 heading03 text-teal-70 dark:text-teal-30">
        {{ currentElementDetail?.name }}
      </h3>

      <!-- 名称 (可编辑) -->
      <div>
        <label for="element-name" class="mb-2 block body01 text-gray-60 dark:text-gray-40">Name: </label>
        <input
          id="element-name"
          v-model.number="currentElementDetail.name"
          type="text"
          class="input-field"
          @change="emit('update:element', currentElementDetail)"
        >
      </div>

      <!-- 类型选择 (可编辑) -->
      <div>
        <label for="element-type" class="mb-2 block body01 text-gray-60 dark:text-gray-40">{{ t('editor.device_params.type') }}:</label>
        <select
          id="element-type"
          v-model="currentElementDetail.type"
          class="input-field"
          @change="emit('update:element', currentElementDetail)"
        >
          <option v-for="deviceType in supportedDeviceTypes" :key="deviceType" :value="deviceType">
            {{ deviceType }}
          </option>
        </select>
      </div>

      <!-- 类型变体选择 (可编辑) -->
      <div>
        <label for="element-type-variety" class="mb-2 block body01 text-gray-60 dark:text-gray-40">Type variety:</label>
        <select
          id="element-type-variety"
          v-model="currentElementDetail.type_variety"
          class="input-field"
          @change="emit('update:element', currentElementDetail)"
        >
          <option value="">
            {{ t('editor.device_params.no_variety') }}
          </option>
          <option v-for="variety in availableTypeVarieties" :key="variety" :value="variety">
            {{ variety }}
          </option>
        </select>
      </div>

      <!-- Divider -->
      <div class="mt-3 h-px w-full bg-gray-30 dark:bg-gray-70" />

      <div v-if="currentElementDetail.params && currentElementDetail.operational">
        <!-- EDFA Component Params -->
        <div v-if="currentElementDetail.type === 'Edfa'" class="grid grid-cols-1 gap-4">
          <h3 class="heading02 text-teal-70 dark:text-teal-30">
            {{ t('editor.device_params.operational_params') }}
          </h3>

          <div>
            <label for="edfa-gain-target" class="mb-2 block body01 text-gray-60 dark:text-gray-40">
              {{ t('editor.device_params.edfa.gain_target') }} (dB):
            </label>
            <input
              id="edfa-gain-target"
              v-model.number="currentElementDetail.operational.gain_target"
              type="number"
              class="input-field"
              @change="emit('update:element', currentElementDetail)"
            >
          </div>

          <div>
            <label for="edfa-delta-p" class="mb-2 block body01 text-gray-60 dark:text-gray-40">
              {{ t('editor.device_params.edfa.delta_p') }} (dB):
            </label>
            <input
              id="edfa-delta-p"
              v-model.number="currentElementDetail.operational.delta_p"
              type="number"
              class="input-field"
              @change="emit('update:element', currentElementDetail)"
            >
          </div>

          <div>
            <label for="edfa-out-voa" class="mb-2 block body01 text-gray-60 dark:text-gray-40">
              {{ t('editor.device_params.edfa.out_voa') }} (dB):
            </label>
            <input
              id="edfa-out-voa"
              v-model.number="currentElementDetail.operational.out_voa"
              type="number"
              class="input-field"
              @change="emit('update:element', currentElementDetail)"
            >
          </div>

          <div>
            <label for="edfa-in-voa" class="mb-2 block body01 text-gray-60 dark:text-gray-40">
              {{ t('editor.device_params.edfa.in_voa') }} (dB):
            </label>
            <input
              id="edfa-in-voa"
              v-model.number="currentElementDetail.params.in_voa"
              type="number"
              class="input-field"
              @change="emit('update:element', currentElementDetail)"
            >
          </div>

          <div>
            <label for="edfa-tilt-target" class="mb-2 block body01 text-gray-60 dark:text-gray-40">
              {{ t('editor.device_params.edfa.tilt_target') }} (dB):
            </label>
            <input
              id="edfa-tilt-target"
              v-model.number="currentElementDetail.params.tilt_target"
              type="number"
              class="input-field"
              @change="emit('update:element', currentElementDetail)"
            >
          </div>
        </div>

        <!-- Fiber Component Params -->
        <div v-else-if="currentElementDetail.type === 'Fiber'" class="grid grid-cols-1 gap-4">
          <h3 class="heading02 text-teal-70 dark:text-teal-30">
            {{ t('editor.device_params.params') }}
          </h3>

          <div>
            <label for="fiber-length" class="mb-2 block body01 text-gray-60 dark:text-gray-40">
              {{ t('editor.device_params.fiber.length') }}:
            </label>
            <input
              id="fiber-length"
              v-model.number="currentElementDetail.params.length"
              type="number"
              class="input-field"
              @change="emit('update:element', currentElementDetail)"
            >
          </div>

          <div>
            <label for="fiber-length-units" class="mb-2 block body01 text-gray-60 dark:text-gray-40">
              {{ t('editor.device_params.fiber.length_units') }}:
            </label>
            <select
              id="fiber-length-units"
              v-model="currentElementDetail.params.length_units"
              class="input-field"
              @change="emit('update:element', currentElementDetail)"
            >
              <option value="">
                Same as global config
              </option>
              <option value="m">
                m
              </option>
              <option value="km">
                km
              </option>
            </select>
          </div>

          <div>
            <label for="fiber-loss-coef" class="mb-2 block body01 text-gray-60 dark:text-gray-40">
              {{ t('editor.device_params.fiber.loss_coef') }} (dB/km):
            </label>
            <!-- Note: loss_coef can be a Number or a Dictionary. This UI only handles the Number input for simplicity.
             A dictionary would require a more complex UI component (e.g., JSON editor). -->
            <input
              id="fiber-loss-coef"
              v-model.number="currentElementDetail.params.loss_coef"
              type="number"
              class="input-field"
              @change="emit('update:element', currentElementDetail)"
            >
          </div>

          <div>
            <label for="fiber-att-in" class="mb-2 block body01 text-gray-60 dark:text-gray-40">
              {{ t('editor.device_params.fiber.att_in') }} (dB):
            </label>
            <input
              id="fiber-att-in"
              v-model.number="currentElementDetail.params.att_in"
              type="number"
              class="input-field"
              @change="emit('update:element', currentElementDetail)"
            >
          </div>

          <div>
            <label for="fiber-con-in" class="mb-2 block body01 text-gray-60 dark:text-gray-40">
              {{ t('editor.device_params.fiber.con_in') }} (dB):
            </label>
            <input
              id="fiber-con-in"
              v-model.number="currentElementDetail.params.con_in"
              type="number"
              class="input-field"
              @change="emit('update:element', currentElementDetail)"
            >
          </div>

          <div>
            <label for="fiber-con-out" class="mb-2 block body01 text-gray-60 dark:text-gray-40">
              {{ t('editor.device_params.fiber.con_out') }} (dB):
            </label>
            <input
              id="fiber-con-out"
              v-model.number="currentElementDetail.params.con_out"
              type="number"
              class="input-field"
              @change="emit('update:element', currentElementDetail)"
            >
          </div>
        </div>

        <!-- Fused Component Params -->
        <div v-else-if="currentElementDetail.type === 'Fused'" class="grid grid-cols-1 gap-4">
          <h3 class="heading02 text-teal-70 dark:text-teal-30">
            {{ t('editor.device_params.params') }}
          </h3>

          <div>
            <label for="fused-loss" class="mb-2 block body01 text-gray-60 dark:text-gray-40">
              {{ t('editor.device_params.fused.loss') }} (dB):
            </label>
            <input
              id="fused-loss"
              v-model.number="currentElementDetail.params.loss"
              type="number"
              class="input-field"
              @change="emit('update:element', currentElementDetail)"
            >
          </div>
        </div>

        <!-- ROADM Component Params -->
        <div v-else-if="currentElementDetail.type === 'Roadm'" class="grid grid-cols-1 gap-4">
          <h3 class="heading02 text-teal-70 dark:text-teal-30">
            {{ t('editor.device_params.params') }}
          </h3>

          <!-- Mutually exclusive target power parameters -->
          <p class="body02 text-gray-50 -mt-2 dark:text-gray-40">
            ({{ t('editor.device_params.roadm.help') }})
          </p>

          <div>
            <label for="roadm-target-pch-out-db" class="mb-2 block body01 text-gray-60 dark:text-gray-40">
              {{ t('editor.device_params.roadm.target_pch_out_db') }} (dB):
            </label>
            <input
              id="roadm-target-pch-out-db"
              v-model.number="currentElementDetail.params.target_pch_out_db"
              type="number"
              class="input-field"
              @change="emit('update:element', currentElementDetail)"
            >
          </div>

          <div>
            <label for="roadm-target-psd-out-mwperghz" class="mb-2 block body01 text-gray-60 dark:text-gray-40">
              {{ t('editor.device_params.roadm.target_psd_out_mWperGHz') }} (mW/GHz):
            </label>
            <input
              id="roadm-target-psd-out-mwperghz"
              v-model.number="currentElementDetail.params.target_psd_out_mWperGHz"
              type="number"
              class="input-field"
              @change="emit('update:element', currentElementDetail)"
            >
          </div>

          <div>
            <label for="roadm-target-out-mwperslotwidth" class="mb-2 block body01 text-gray-60 dark:text-gray-40">
              {{ t('editor.device_params.roadm.target_out_mWperSlotWidth') }} (mW/SlotWidth):
            </label>
            <input
              id="roadm-target-out-mwperslotwidth"
              v-model.number="currentElementDetail.params.target_out_mWperSlotWidth"
              type="number"
              class="input-field"
              @change="emit('update:element', currentElementDetail)"
            >
          </div>

          <!--
            Note: The following ROADM parameters are of complex types (dictionaries or lists)
            and cannot be represented by simple input fields in a similar style.
            Implementing them would require custom components (e.g., JSON editors, dynamic list forms).

            - restrictions (Dictionary of strings)
            - per_degree_pch_out_db (Dictionary)
            - per_degree_psd_out_mWperGHz (Dictionary)
            - per_degree_psd_out_mWperSlotWidth (Dictionary)
            - per_degree_impairments (List)
            - design_bands (List of dictionaries)
            - per_degree_design_bands (Dictionary)
          -->
        </div>
      </div>
    </div>

    <!-- Panel Global Parameters -->
    <div v-else flex="grow" class="overflow-y-auto p-4">
      <!-- 频谱信息 (SI) -->
      <div class="mb-6 rounded-md bg-white dark:bg-gray-100">
        <h3 class="mb-4 heading03 text-teal-70 dark:text-teal-30">
          {{ t('editor.global.spectrum_information.title') }}
        </h3>

        <div v-if="currentSI" class="grid grid-cols-1 gap-4">
          <div>
            <label for="si-f-min" class="mb-2 block body01 text-gray-60 dark:text-gray-40">
              {{ t('editor.global.spectrum_information.f_min') }} (THz):
            </label>
            <input
              id="si-f-min"
              v-model.number="siFMinTHz"
              type="number"
              class="input-field"
              @change="emit('update:global', 'SI', currentSI)"
            >
          </div>

          <div>
            <label for="si-f-max" class="mb-2 block body01 text-gray-60 dark:text-gray-40">
              {{ t('editor.global.spectrum_information.f_max') }} (THz):
            </label>
            <input
              id="si-f-max"
              v-model.number="siFMaxTHz"
              type="number"
              class="input-field"
              @change="emit('update:global', 'SI', currentSI)"
            >
          </div>

          <div>
            <label for="si-baud-rate" class="mb-2 block body01 text-gray-60 dark:text-gray-40">
              {{ t('editor.global.spectrum_information.baud_rate') }} (GHz):
            </label>
            <input
              id="si-baud-rate"
              v-model.number="siBaudRateGHz"
              type="number"
              class="input-field"
              @change="emit('update:global', 'SI', currentSI)"
            >
          </div>

          <div>
            <label for="si-spacing" class="mb-2 block body01 text-gray-60 dark:text-gray-40">
              {{ t('editor.global.spectrum_information.spacing') }} (GHz):
            </label>
            <input
              id="si-spacing"
              v-model.number="siSpacingGHz"
              type="number"
              class="input-field"
              @change="emit('update:global', 'SI', currentSI)"
            >
          </div>

          <div>
            <label for="si-roll-off" class="mb-2 block body01 text-gray-60 dark:text-gray-40">
              {{ t('editor.global.spectrum_information.roll_off') }}:
            </label>
            <input
              id="si-roll-off"
              v-model.number="currentSI.roll_off"
              type="number"
              step="0.01"
              class="input-field"
              @change="emit('update:global', 'SI', currentSI)"
            >
          </div>

          <div>
            <label for="si-tx-osnr" class="mb-2 block body01 text-gray-60 dark:text-gray-40">
              {{ t('editor.global.spectrum_information.tx_osnr') }} (dB):
            </label>
            <input
              id="si-tx-osnr"
              v-model.number="currentSI.tx_osnr"
              type="number"
              class="input-field"
              @change="emit('update:global', 'SI', currentSI)"
            >
          </div>

          <div>
            <label for="si-power-dbm" class="mb-2 block body01 text-gray-60 dark:text-gray-40">
              {{ t('editor.global.spectrum_information.power_dbm') }} (dBm):
            </label>
            <input
              id="si-power-dbm"
              v-model.number="currentSI.power_dbm"
              type="number"
              class="input-field"
              @change="emit('update:global', 'SI', currentSI)"
            >
          </div>

          <div>
            <label for="si-sys-margins" class="mb-2 block body01 text-gray-60 dark:text-gray-40">
              {{ t('editor.global.spectrum_information.sys_margins') }} (dB):
            </label>
            <input
              id="si-sys-margins"
              v-model.number="currentSI.sys_margins"
              type="number"
              step="0.01"
              class="input-field"
              @change="emit('update:global', 'SI', currentSI)"
            >
          </div>
        </div>
      </div>

      <!-- 跨段参数 (Span) -->
      <div class="mb-6 rounded-md bg-white dark:bg-gray-100">
        <h3 class="mb-4 heading03 text-teal-70 dark:text-teal-30">
          {{ t('editor.global.span_config.title') }}
        </h3>

        <div v-if="currentSpan" class="grid grid-cols-1 gap-4">
          <div>
            <label for="span-power-mode" class="mb-2 block body01 text-gray-60 dark:text-gray-40">
              {{ t('editor.global.span_config.power_mode') }}:
            </label>
            <input
              id="span-power-mode"
              v-model="currentSpan.power_mode"
              type="checkbox"
              class="h-5 w-5 border-gray-30 rounded bg-teal-60 focus:ring-teal-50"
              @change="emit('update:global', 'Span', currentSpan)"
            >
          </div>

          <div>
            <label for="span-max-fiber-lineic-loss-for-raman" class="mb-2 block body01 text-gray-60 dark:text-gray-40">
              {{ t('editor.global.span_config.max_fiber_lineic_loss_for_raman') }} (dB):
            </label>
            <input
              id="span-max-fiber-lineic-loss-for-raman"
              v-model.number="currentSpan.max_fiber_lineic_loss_for_raman"
              type="number"
              class="input-field"
              @change="emit('update:global', 'Span', currentSpan)"
            >
          </div>

          <div>
            <label for="span-max-length" class="mb-2 block body01 text-gray-60 dark:text-gray-40">
              {{ t('editor.global.span_config.max_length') }}:
            </label>
            <input
              id="span-max-length"
              v-model.number="currentSpan.max_length"
              type="number"
              class="input-field"
              @change="emit('update:global', 'Span', currentSpan)"
            >
          </div>

          <div>
            <label for="span-length-unit" class="mb-2 block body01 text-gray-60 dark:text-gray-40">
              {{ t('editor.global.span_config.length_units') }}:
            </label>
            <select
              id="span-length-unit"
              v-model="currentSpan.length_units"
              class="input-field"
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
            <label for="span-max-loss" class="mb-2 block body01 text-gray-60 dark:text-gray-40">
              {{ t('editor.global.span_config.max_loss') }} (dB):
            </label>
            <input
              id="span-max-loss"
              v-model.number="currentSpan.max_loss"
              type="number"
              class="input-field"
              @change="emit('update:global', 'Span', currentSpan)"
            >
          </div>

          <div>
            <label for="span-padding" class="mb-2 block body01 text-gray-60 dark:text-gray-40">
              {{ t('editor.global.span_config.padding') }} (dB):
            </label>
            <input
              id="span-padding"
              v-model.number="currentSpan.padding"
              type="number"
              class="input-field"
              @change="emit('update:global', 'Span', currentSpan)"
            >
          </div>

          <div>
            <label for="span-eol" class="mb-2 block body01 text-gray-60 dark:text-gray-40">
              {{ t('editor.global.span_config.eol') }} (dB):
            </label>
            <input
              id="span-eol"
              v-model.number="currentSpan.EOL"
              type="number"
              class="input-field"
              @change="emit('update:global', 'Span', currentSpan)"
            >
          </div>

          <div>
            <label for="span-con-in" class="mb-2 block body01 text-gray-60 dark:text-gray-40">
              {{ t('editor.global.span_config.con_in') }} (dB):
            </label>
            <input
              id="span-con-in"
              v-model.number="currentSpan.con_in"
              type="number"
              class="input-field"
              @change="emit('update:global', 'Span', currentSpan)"
            >
          </div>

          <div>
            <label for="span-con-out" class="mb-2 block body01 text-gray-60 dark:text-gray-40">
              {{ t('editor.global.span_config.con_out') }} (dB):
            </label>
            <input
              id="span-con-out"
              v-model.number="currentSpan.con_out"
              type="number"
              class="input-field"
              @change="emit('update:global', 'Span', currentSpan)"
            >
          </div>
        </div>
      </div>

      <!-- 全局参数 (Global) -->
      <div class="mb-6 rounded-md bg-white dark:bg-gray-100">
        <h3 class="mb-4 heading03 text-teal-70 dark:text-teal-30">
          {{ t('editor.global.global_config.title') }}
        </h3>

        <div v-if="currentSimulationConfig" class="grid grid-cols-1 gap-4">
          <div>
            <label for="raman-flag" class="mb-2 block body01 text-gray-60 dark:text-gray-40">
              {{ t('editor.global.global_config.flag') }}:
            </label>
            <input
              id="raman-flag"
              v-model="currentSimulationConfig.raman_params.flag"
              type="checkbox"
              class="h-5 w-5 border-gray-30 rounded bg-teal-60 focus:ring-teal-50"
              @change="emit('update:global', 'SimulationConfig', currentSimulationConfig)"
            >
          </div>

          <div>
            <label for="raman-result-spatial-resolution" class="mb-2 block body01 text-gray-60 dark:text-gray-40">
              {{ t('editor.global.global_config.result_spatial_resolution') }} (m):
            </label>
            <input
              id="raman-result-spatial-resolution"
              v-model.number="currentSimulationConfig.raman_params.result_spatial_resolution"
              type="number"
              class="input-field"
              @change="emit('update:global', 'SimulationConfig', currentSimulationConfig)"
            >
          </div>

          <div>
            <label for="raman-solver-spatial-resolution" class="mb-2 block body01 text-gray-60 dark:text-gray-40">
              {{ t('editor.global.global_config.solver_spatial_resolution') }} (m):
            </label>
            <input
              id="raman-solver-spatial-resolution"
              v-model.number="currentSimulationConfig.raman_params.solver_spatial_resolution"
              type="number"
              class="input-field"
              @change="emit('update:global', 'SimulationConfig', currentSimulationConfig)"
            >
          </div>

          <div>
            <label for="nli-method" class="mb-2 block body01 text-gray-60 dark:text-gray-40">
              {{ t('editor.global.global_config.nli_params') }}:
            </label>
            <input
              id="nli-method"
              v-model="currentSimulationConfig.nli_params.method"
              type="text"
              class="input-field"
              @change="emit('update:global', 'SimulationConfig', currentSimulationConfig)"
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.input-field {
  @apply w-full rounded-none border border-gray-60 bg-white px-3 py-2 text-gray-100
         focus:border-blue-60 focus:outline-none focus:ring-1 focus:ring-blue-60
         dark:border-gray-50 dark:bg-gray-80 dark:text-gray-10;
}
</style>
