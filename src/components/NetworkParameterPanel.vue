<!-- src/components/NetworkParameterPanel.vue -->
<script setup lang="ts">
import type { DeviceType, NetworkConnection, NetworkDetail, NetworkElement, NetworkService, SimulationConfig, SpanParameters, SpectrumInformation } from '~/types/network'

import { useComponentLibrary } from '~/composables/componentLibrary'
import { useDialog } from '~/composables/useDialog'

const props = defineProps<{
  selectedElement: NetworkElement | NetworkConnection | NetworkService | null
  networkDetail: NetworkDetail | null
}>()

const emit = defineEmits<{
  (e: 'update:element', element: NetworkElement | NetworkConnection | NetworkService): void
  (e: 'update:global', type: 'SI' | 'Span' | 'SimulationConfig', data: SpectrumInformation | SpanParameters | SimulationConfig): void
  (e: 'hasUnsavedChanges', hasChanges: boolean): void
}>()

const { t } = useI18n()
const dialog = useDialog()

// Component library integration
const {
  loadComponentLibrary,
  getAvailableVarieties,
  getDeviceTemplate,
  getSupportedDeviceTypes,
  loading: libraryLoading,
} = useComponentLibrary()

// Load component library on component mount
onMounted(async () => {
  try {
    await loadComponentLibrary()
  }
  catch (error) {
    console.error('Failed to load component library:', error)
  }
})

// 用于编辑的本地状态，避免直接修改 props
// 使用 JSON.parse(JSON.stringify()) 进行深拷贝，确保修改不会影响原始 props
const editableElement = ref<NetworkElement | NetworkConnection | NetworkService | null>(null)
const editableSI = ref<SpectrumInformation | null>(null)
const editableSpan = ref<SpanParameters | null>(null)
const editableSimulationConfig = ref<SimulationConfig | null>(null)

// 跟踪参数的模板值和空状态
const templateParams = ref<Record<string, any>>({})
const emptyParams = ref<Set<string>>(new Set())
const originalParams = ref<Record<string, any>>({})

// 跟踪是否有未保存的更改
const hasUnsavedChanges = ref(false)

// Available device types that have library support
const supportedDeviceTypes = computed(() => getSupportedDeviceTypes())

// Get available type varieties for the current element
const availableTypeVarieties = computed(() => {
  if (!editableElement.value || !('type' in editableElement.value)) {
    return []
  }
  const varieties = getAvailableVarieties(editableElement.value.type)
  return varieties.filter((variety): variety is string => variety !== null)
})

// Handle type change
async function handleTypeChange(newType: DeviceType) {
  if (!editableElement.value || !('type' in editableElement.value)) {
    return
  }

  // Update the type
  editableElement.value.type = newType

  // Reset type_variety if the new type doesn't support the current variety
  const varieties = getAvailableVarieties(newType)
  const filteredVarieties = varieties.filter((variety): variety is string => variety !== null)
  if (filteredVarieties.length > 0 && (!editableElement.value.type_variety || !filteredVarieties.includes(editableElement.value.type_variety))) {
    editableElement.value.type_variety = filteredVarieties[0]
  }
  else if (filteredVarieties.length === 0) {
    editableElement.value.type_variety = undefined
  }

  // Apply template defaults if available
  if (editableElement.value.type_variety) {
    const template = getDeviceTemplate(newType, editableElement.value.type_variety)
    if (template) {
      applyTemplateDefaults(template)
    }
  }
}

// Handle type variety change
async function handleTypeVarietyChange(newVariety: string) {
  if (!editableElement.value || !('type' in editableElement.value)) {
    return
  }

  editableElement.value.type_variety = newVariety

  // Apply template defaults
  const template = getDeviceTemplate(editableElement.value.type, newVariety)
  if (template) {
    applyTemplateDefaults(template)
  }
}

// Type guard to check if element has params
function hasParams(element: any): element is NetworkElement {
  return element && 'params' in element
}

// Apply template defaults to element
function applyTemplateDefaults(template: any) {
  if (!editableElement.value || !hasParams(editableElement.value)) {
    return
  }

  // Initialize params if not exists
  if (!editableElement.value.params) {
    editableElement.value.params = {}
  }

  // Store original params before applying template
  originalParams.value = { ...editableElement.value.params }

  // Apply template properties to params, excluding type_variety and other metadata
  const { type_variety, type_def, allowed_for_design, ...templateParamsData } = template

  // Store template values for placeholder logic
  templateParams.value = templateParamsData

  // Reset empty params tracking
  emptyParams.value = new Set()

  // Apply the relevant template parameters only if they don't exist in original params
  Object.keys(templateParamsData).forEach((key) => {
    if (hasParams(editableElement.value!) && editableElement.value!.params && (editableElement.value!.params[key] === undefined || editableElement.value!.params[key] === null || editableElement.value!.params[key] === '')) {
      // Mark as empty so we can show template value as placeholder
      emptyParams.value.add(key)
      // Don't actually set the value in params - keep it empty
    }
  })

  // Handle special cases for different device types
  if (editableElement.value.type === 'Transceiver' && template.mode) {
    // For transceivers, we might want to set a default mode
    if (template.mode && template.mode.length > 0) {
      if (hasParams(editableElement.value!) && editableElement.value!.params && (editableElement.value!.params.default_mode === undefined || editableElement.value!.params.default_mode === null || editableElement.value!.params.default_mode === '')) {
        emptyParams.value.add('default_mode')
      }
    }
  }
}

// 检查元素是否有更改
function checkForChanges() {
  if (!props.selectedElement || !editableElement.value) {
    hasUnsavedChanges.value = false
    return
  }

  const originalStr = JSON.stringify(props.selectedElement)
  const currentStr = JSON.stringify(editableElement.value)
  hasUnsavedChanges.value = originalStr !== currentStr
}

// 监听 selectedElement 变化，更新本地 editableElement
watch(() => props.selectedElement, (newVal) => {
  editableElement.value = newVal ? JSON.parse(JSON.stringify(newVal)) : null
  templateParams.value = {}
  emptyParams.value = new Set()
  originalParams.value = {}
  hasUnsavedChanges.value = false
}, { immediate: true, deep: true }) // immediate 立即运行，deep 深度监听对象内部变化

// 监听 editableElement 变化，检查是否有未保存的更改
watch(editableElement, () => {
  checkForChanges()
  emit('hasUnsavedChanges', hasUnsavedChanges.value)
}, { deep: true })

// 监听 networkDetail 变化，更新本地全局配置
watch(() => props.networkDetail, (newVal) => {
  if (newVal) {
    editableSI.value = newVal.SI ? JSON.parse(JSON.stringify(newVal.SI)) : null
    editableSpan.value = newVal.Span ? JSON.parse(JSON.stringify(newVal.Span)) : null
    editableSimulationConfig.value = newVal.simulation_config ? JSON.parse(JSON.stringify(newVal.simulation_config)) : null
  }
  else {
    editableSI.value = null
    editableSpan.value = null
    editableSimulationConfig.value = null
  }
}, { immediate: true, deep: true })

const isElementSelected = computed(() => !!props.selectedElement)

// 参数验证函数
function validateDeviceParams(element: NetworkElement): { isValid: boolean, errors: string[] } {
  // 首先检查是否为 NetworkElement
  if (!('element_id' in element) || !('type' in element)) {
    return { isValid: true, errors: [] } // 非元素类型不验证
  }
  const errors: string[] = []

  if (!element.name || element.name.trim() === '') {
    errors.push(t('editor.validation.name_required'))
  }

  if (element.type === 'Fiber') {
    if (element.params?.length !== undefined && element.params.length <= 0) {
      errors.push(t('editor.validation.fiber_length_positive'))
    }
    if (element.params?.loss_coef !== undefined && element.params.loss_coef < 0) {
      errors.push(t('editor.validation.loss_coef_non_negative'))
    }
    if (element.params?.att_in !== undefined && element.params.att_in < 0) {
      errors.push(t('editor.validation.attenuation_non_negative'))
    }
    if (element.params?.con_in !== undefined && element.params.con_in < 0) {
      errors.push(t('editor.validation.connector_loss_non_negative'))
    }
    if (element.params?.con_out !== undefined && element.params.con_out < 0) {
      errors.push(t('editor.validation.connector_loss_non_negative'))
    }
  }
  else if (element.type === 'Edfa') {
    if (element.params?.gain_target !== undefined && element.params.gain_target < 0) {
      errors.push(t('editor.validation.gain_target_non_negative'))
    }
    if (element.params?.out_voa !== undefined && element.params.out_voa < 0) {
      errors.push(t('editor.validation.voa_non_negative'))
    }
    if (element.params?.in_voa !== undefined && element.params.in_voa < 0) {
      errors.push(t('editor.validation.voa_non_negative'))
    }
  }
  else if (element.type === 'RamanFiber') {
    if (element.params?.length !== undefined && element.params.length <= 0) {
      errors.push(t('editor.validation.fiber_length_positive'))
    }
    if (element.params?.raman_pump_power !== undefined && element.params.raman_pump_power < 0) {
      errors.push(t('editor.validation.power_non_negative'))
    }
    if (element.params?.raman_pump_frequency !== undefined && element.params.raman_pump_frequency <= 0) {
      errors.push(t('editor.validation.frequency_positive'))
    }
  }
  else if (element.type === 'Fused') {
    if (element.params?.loss !== undefined && element.params.loss < 0) {
      errors.push(t('editor.validation.loss_non_negative'))
    }
  }

  return { isValid: errors.length === 0, errors }
}

// 保存元素更改
function saveElementChanges() {
  if (editableElement.value) {
    // 只对 NetworkElement 进行参数验证和结构化
    if ('element_id' in editableElement.value && 'type' in editableElement.value) {
      const element = editableElement.value as NetworkElement

      // 参数验证
      const validation = validateDeviceParams(element)
      if (!validation.isValid) {
        // 显示验证错误
        dialog.showAlert(t('editor.validation.title'), validation.errors.join('\n'))
        return
      }

      // Ensure params object exists
      if (!element.params) {
        element.params = {}
      }

      // Create patch payload with empty parameters removed
      const patchPayload = createPatchPayload()

      // Apply structured parameters based on device type
      if (element.type === 'Fiber') {
        // Only include parameters that have actual values
        const fiberParams: any = {}
        if (patchPayload.length !== undefined)
          fiberParams.length = patchPayload.length
        if (patchPayload.length_units !== undefined)
          fiberParams.length_units = patchPayload.length_units
        if (patchPayload.loss_coef !== undefined)
          fiberParams.loss_coef = patchPayload.loss_coef
        if (patchPayload.att_in !== undefined)
          fiberParams.att_in = patchPayload.att_in
        if (patchPayload.con_in !== undefined)
          fiberParams.con_in = patchPayload.con_in
        if (patchPayload.con_out !== undefined)
          fiberParams.con_out = patchPayload.con_out

        element.params = fiberParams
      }
      else if (element.type === 'Edfa') {
        // Ensure operational parameters are properly structured
        const operationalParams: any = {}
        if (patchPayload.gain_target !== undefined)
          operationalParams.gain_target = patchPayload.gain_target
        if (patchPayload.delta_p !== undefined)
          operationalParams.delta_p = patchPayload.delta_p
        if (patchPayload.out_voa !== undefined)
          operationalParams.out_voa = patchPayload.out_voa
        if (patchPayload.in_voa !== undefined)
          operationalParams.in_voa = patchPayload.in_voa
        if (patchPayload.tilt_target !== undefined)
          operationalParams.tilt_target = patchPayload.tilt_target

        element.params = operationalParams
      }
      else if (element.type === 'RamanFiber') {
        // Structure Raman Fiber parameters
        const fiberParams: any = {}
        if (patchPayload.length !== undefined)
          fiberParams.length = patchPayload.length
        if (patchPayload.length_units !== undefined)
          fiberParams.length_units = patchPayload.length_units
        if (patchPayload.loss_coef !== undefined)
          fiberParams.loss_coef = patchPayload.loss_coef
        if (patchPayload.att_in !== undefined)
          fiberParams.att_in = patchPayload.att_in
        if (patchPayload.con_in !== undefined)
          fiberParams.con_in = patchPayload.con_in
        if (patchPayload.con_out !== undefined)
          fiberParams.con_out = patchPayload.con_out

        const operationalParams: any = {}
        if (patchPayload.temperature !== undefined)
          operationalParams.temperature = patchPayload.temperature

        const ramanPumpParams: any = {}
        if (patchPayload.raman_pump_power !== undefined)
          ramanPumpParams.power = patchPayload.raman_pump_power
        if (patchPayload.raman_pump_frequency !== undefined)
          ramanPumpParams.frequency = patchPayload.raman_pump_frequency
        if (patchPayload.raman_pump_direction !== undefined)
          ramanPumpParams.propagation_direction = patchPayload.raman_pump_direction

        if (Object.keys(ramanPumpParams).length > 0) {
          operationalParams.raman_pump = ramanPumpParams
        }

        element.params = {
          ...fiberParams,
          ...operationalParams,
        }
      }
      else if (element.type === 'Fused') {
        if (patchPayload.loss !== undefined) {
          element.params = { loss: patchPayload.loss }
        }
        else {
          element.params = {}
        }
      }
      else if (element.type === 'Roadm') {
        // Handle ROADM target power parameters (mutually exclusive)
        const roadmParams: any = {}
        if (patchPayload.target_pch_out_db !== undefined) {
          roadmParams.target_pch_out_db = patchPayload.target_pch_out_db
        }
        if (patchPayload.target_psd_out_mWperGHz !== undefined) {
          roadmParams.target_psd_out_mWperGHz = patchPayload.target_psd_out_mWperGHz
        }
        if (patchPayload.target_out_mWperSlotWidth !== undefined) {
          roadmParams.target_out_mWperSlotWidth = patchPayload.target_out_mWperSlotWidth
        }

        element.params = roadmParams
      }
    }

    emit('update:element', editableElement.value)
    hasUnsavedChanges.value = false
    emit('hasUnsavedChanges', false)
  }
}

// 保存全局配置更改
function saveGlobalChanges(type: 'SI' | 'Span' | 'SimulationConfig') {
  if (type === 'SI' && editableSI.value) {
    emit('update:global', 'SI', editableSI.value)
  }
  else if (type === 'Span' && editableSpan.value) {
    emit('update:global', 'Span', editableSpan.value)
  }
  else if (type === 'SimulationConfig' && editableSimulationConfig.value) {
    emit('update:global', 'SimulationConfig', editableSimulationConfig.value)
  }
}

// 辅助函数：将对象渲染为可读字符串（用于复杂参数的展示）
function renderObject(obj: Record<string, any>): string {
  if (!obj)
    return ''
  return Object.entries(obj).map(([key, value]) => {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      return `${key}: { ${renderObject(value)} }`
    }
    return `${key}: ${JSON.stringify(value)}`
  }).join(', ')
}

// 辅助函数：获取元素的显示名称
function getDisplayName(element: NetworkElement | NetworkConnection | NetworkService): string {
  if ('name' in element && element.name) {
    return element.name
  }
  if ('element_id' in element) {
    return element.element_id
  }
  if ('connection_id' in element) {
    return element.connection_id
  }
  if ('service_id' in element) {
    return element.service_id
  }
  return 'Unknown'
}

// Helper function to get parameter display value
function getParamValue(paramName: string): any {
  if (!editableElement.value || !hasParams(editableElement.value)) {
    return undefined
  }

  const currentValue = editableElement.value.params?.[paramName]

  // If parameter is empty (null, undefined, or empty string), return undefined to trigger placeholder
  if (currentValue === undefined || currentValue === null || currentValue === '') {
    return undefined
  }

  return currentValue
}

// Helper function to get template placeholder value
function getTemplatePlaceholder(paramName: string): string {
  const templateValue = templateParams.value[paramName]
  if (templateValue === undefined || templateValue === null) {
    return ''
  }
  return String(templateValue)
}

// Helper function to check if parameter is empty
function isParamEmpty(paramName: string): boolean {
  if (!editableElement.value || !hasParams(editableElement.value)) {
    return true
  }

  const value = editableElement.value.params?.[paramName]
  return value === undefined || value === null || value === ''
}

// Helper function to handle parameter input
function handleParamInput(paramName: string, value: any, isNumeric: boolean = false) {
  if (!editableElement.value || !hasParams(editableElement.value)) {
    return
  }

  // Initialize params if not exists
  if (!editableElement.value.params) {
    editableElement.value.params = {}
  }

  // Convert value if numeric
  const processedValue = isNumeric ? (value === '' ? undefined : Number(value)) : value

  // Handle empty value
  if (processedValue === undefined || processedValue === null || processedValue === '') {
    // Remove from params and mark as empty
    delete editableElement.value.params[paramName]
    emptyParams.value.add(paramName)
  }
  else {
    // Set the value and remove from empty set
    editableElement.value.params[paramName] = processedValue
    emptyParams.value.delete(paramName)
  }
}

// Helper function to create patch payload with empty parameters removed
function createPatchPayload(): Record<string, any> {
  if (!editableElement.value || !hasParams(editableElement.value)) {
    return {}
  }

  const patch: Record<string, any> = {}

  // Only include non-empty parameters
  Object.entries(editableElement.value.params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      patch[key] = value
    }
  })

  return patch
}

// Expose methods for parent component to call
defineExpose({
  hasUnsavedChanges,
  saveElementChanges,
  saveGlobalChanges,
  checkForChanges,
  createPatchPayload,
})
</script>

<template>
  <div class="h-full flex flex-col">
    <h2 class="mb-4 text-xl text-gray-800 font-bold dark:text-slate-200">
      {{ isElementSelected ? t('editor.elementProperties') : t('editor.networkGlobalSettings') }}
    </h2>

    <!-- 元素属性面板 -->
    <div v-if="isElementSelected && editableElement" class="flex-grow overflow-y-auto">
      <!-- Library loading indicator -->
      <div v-if="libraryLoading" class="mb-4 border border-blue-200 rounded-md bg-blue-50 p-3">
        <div class="flex items-center text-blue-800">
          <div class="mr-2 h-4 w-4 animate-spin border-b-2 border-blue-600 rounded-full" />
          {{ t('editor.loadingLibrary') }}
        </div>
      </div>
      <div class="mb-4 rounded-md bg-white p-3 shadow-sm dark:bg-slate-700">
        <h3 class="mb-2 text-lg text-teal-700 font-semibold dark:text-teal-400">
          {{ t('editor.selected') }} {{ getDisplayName(editableElement) }}
        </h3>
        <div class="grid grid-cols-1 gap-2 text-sm">
          <!-- ID 字段 (不可编辑) -->
          <div v-if="'element_id' in editableElement">
            <label class="block text-gray-600 dark:text-slate-400">{{ t('editor.id') }}:</label>
            <span class="text-gray-900 font-mono dark:text-slate-100">{{ editableElement.element_id }}</span>
          </div>
          <div v-else-if="'connection_id' in editableElement">
            <label class="block text-gray-600 dark:text-slate-400">{{ t('editor.id') }}:</label>
            <span class="text-gray-900 font-mono dark:text-slate-100">{{ editableElement.connection_id }}</span>
          </div>
          <div v-else-if="'service_id' in editableElement">
            <label class="block text-gray-600 dark:text-slate-400">{{ t('editor.id') }}:</label>
            <span class="text-gray-900 font-mono dark:text-slate-100">{{ editableElement.service_id }}</span>
          </div>

          <!-- 名称字段 (可编辑) -->
          <div v-if="'name' in editableElement">
            <label for="element-name" class="block text-gray-600 dark:text-slate-400">{{ t('editor.name') }}:</label>
            <input
              id="element-name"
              v-model="editableElement.name"
              type="text"
              class="w-full border border-gray-300 rounded bg-white p-1 text-gray-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            >
          </div>

          <!-- 类型选择 (可编辑) -->
          <div v-if="'type' in editableElement">
            <label for="element-type" class="block text-gray-600 dark:text-slate-400">{{ t('editor.type') }}:</label>
            <select
              id="element-type"
              :value="editableElement.type"
              class="w-full border border-gray-300 rounded bg-white p-1 text-gray-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              @change="handleTypeChange(($event.target as HTMLSelectElement).value as DeviceType)"
            >
              <option v-for="deviceType in supportedDeviceTypes" :key="deviceType" :value="deviceType">
                {{ deviceType }}
              </option>
            </select>
          </div>

          <!-- 类型变体选择 (可编辑) -->
          <div v-if="'type' in editableElement && availableTypeVarieties.length > 0">
            <label for="element-type-variety" class="block text-gray-600 dark:text-slate-400">{{ t('editor.typeVariety') }}:</label>
            <select
              id="element-type-variety"
              :value="editableElement.type_variety || ''"
              class="w-full border border-gray-300 rounded bg-white p-1 text-gray-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              @change="handleTypeVarietyChange(($event.target as HTMLSelectElement).value)"
            >
              <option value="">
                {{ t('editor.noVariety') }}
              </option>
              <option v-for="variety in availableTypeVarieties" :key="variety" :value="variety">
                {{ variety }}
              </option>
            </select>
          </div>
          <div v-else-if="'type_variety' in editableElement && editableElement.type_variety">
            <label class="block text-gray-600 dark:text-slate-400">{{ t('editor.typeVariety') }}:</label>
            <span class="text-gray-900 dark:text-slate-100">{{ editableElement.type_variety }}</span>
          </div>

          <!-- 连接的节点 (只读) -->
          <div v-if="'from_node' in editableElement">
            <label class="block text-gray-600 dark:text-slate-400">{{ t('editor.fromNode') }}:</label>
            <span class="text-gray-900 dark:text-slate-100">{{ editableElement.from_node }}</span>
          </div>
          <div v-if="'to_node' in editableElement">
            <label class="block text-gray-600 dark:text-slate-400">{{ t('editor.toNode') }}:</label>
            <span class="text-gray-900 dark:text-slate-100">{{ editableElement.to_node }}</span>
          </div>

          <!-- 服务的路径和状态 (路径只读，状态可编辑) -->
          <div v-if="'path' in editableElement">
            <label class="block text-gray-600 dark:text-slate-400">{{ t('editor.path') }}:</label>
            <span class="text-gray-900 dark:text-slate-100">{{ editableElement.path.join(' → ') }}</span>
          </div>
          <div v-if="'status' in editableElement">
            <label for="service-status" class="block text-gray-600 dark:text-slate-400">{{ t('editor.status') }}:</label>
            <select
              id="service-status"
              v-model="editableElement.status"
              class="w-full border border-gray-300 rounded bg-white p-1 text-gray-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="Active">
                Active
              </option>
              <option value="Inactive">
                Inactive
              </option>
              <!-- 根据实际 API 支持的状态添加更多选项 -->
            </select>
          </div>
          <div v-if="'service_requirements' in editableElement">
            <label class="block text-gray-600 dark:text-slate-400">{{ t('editor.serviceRequirements') }}:</label>
            <div class="ml-2">
              <label class="block text-xs text-gray-600 dark:text-slate-400">{{ t('editor.properties.bandwidth') }} (bps):</label>
              <input
                id="req-bandwidth"
                v-model.number="editableElement.service_requirements.bandwidth"
                type="number"
                class="w-full border border-gray-300 rounded bg-white p-1 text-gray-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              >
              <label for="req-latency" class="block text-xs text-gray-600 dark:text-slate-400">{{ t('editor.properties.latency') }} (ms):</label>
              <input
                id="req-latency"
                v-model.number="editableElement.service_requirements.latency"
                type="number"
                class="w-full border border-gray-300 rounded bg-white p-1 text-gray-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              >
            </div>
          </div>
          <div v-if="'service_constraints' in editableElement && Object.keys(editableElement.service_constraints).length > 0">
            <label class="block text-gray-600 dark:text-slate-400">{{ t('editor.serviceConstraints') }}:</label>
            <div class="ml-2 break-all text-xs text-gray-900 font-mono dark:text-slate-100">
              {{ renderObject(editableElement.service_constraints) }}
            </div>
          </div>

          <!-- 设备特定参数编辑 -->
          <div v-if="'params' in editableElement">
            <label class="mb-2 block text-gray-600 dark:text-slate-400">{{ t('editor.parameters') }}:</label>
            <div class="ml-2 space-y-3">
              <!-- Transceiver 参数 -->
              <div v-if="editableElement.type === 'Transceiver'" class="space-y-2">
                <div class="text-sm text-gray-700 font-medium dark:text-slate-300">
                  {{ t('editor.deviceParams.transceiver') }}
                </div>
              </div>

              <!-- Fiber 参数 -->
              <div v-else-if="editableElement.type === 'Fiber'" class="space-y-2">
                <div class="text-sm text-gray-700 font-medium dark:text-slate-300">
                  {{ t('editor.deviceParams.fiber') }}
                </div>
                <div>
                  <label class="block text-xs text-gray-600 dark:text-slate-400">{{ t('editor.deviceParams.length') }}:</label>
                  <input
                    :value="getParamValue('length')"
                    :placeholder="getTemplatePlaceholder('length')"
                    type="number"
                    class="w-full border border-gray-300 rounded bg-white p-1 text-gray-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    :class="{ 'italic text-gray-400': isParamEmpty('length') }"
                    @input="handleParamInput('length', ($event.target as HTMLInputElement).valueAsNumber, true)"
                  >
                </div>
                <div>
                  <label class="block text-xs text-gray-600 dark:text-slate-400">{{ t('editor.deviceParams.length_units') }}:</label>
                  <select
                    :value="getParamValue('length_units')"
                    class="w-full border border-gray-300 rounded bg-white p-1 text-gray-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    :class="{ 'italic text-gray-400': isParamEmpty('length_units') }"
                    @input="handleParamInput('length_units', ($event.target as HTMLInputElement).value, false)"
                  >
                    <option value="" disabled selected :class="{ 'text-gray-400': isParamEmpty('length_units') }">
                      {{ getTemplatePlaceholder('length_units') || 'Select units' }}
                    </option>
                    <option value="km">
                      km
                    </option>
                    <option value="m">
                      m
                    </option>
                    <option value="cm">
                      cm
                    </option>
                    <option value="mm">
                      mm
                    </option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs text-gray-600 dark:text-slate-400">{{ t('editor.deviceParams.loss_coef') }}:</label>
                  <input
                    :value="getParamValue('loss_coef')"
                    :placeholder="getTemplatePlaceholder('loss_coef')"
                    type="number"
                    step="0.001"
                    class="w-full border border-gray-300 rounded bg-white p-1 text-gray-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    :class="{ 'italic text-gray-400': isParamEmpty('loss_coef') }"
                    @input="handleParamInput('loss_coef', ($event.target as HTMLInputElement).valueAsNumber, true)"
                  >
                </div>
                <div>
                  <label class="block text-xs text-gray-600 dark:text-slate-400">{{ t('editor.deviceParams.att_in') }} (dB):</label>
                  <input
                    :value="getParamValue('att_in')"
                    :placeholder="getTemplatePlaceholder('att_in')"
                    type="number"
                    step="0.1"
                    class="w-full border border-gray-300 rounded bg-white p-1 text-gray-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    :class="{ 'italic text-gray-400': isParamEmpty('att_in') }"
                    @input="handleParamInput('att_in', ($event.target as HTMLInputElement).valueAsNumber, true)"
                  >
                </div>
                <div>
                  <label class="block text-xs text-gray-600 dark:text-slate-400">{{ t('editor.deviceParams.con_in') }} (dB):</label>
                  <input
                    :value="getParamValue('con_in')"
                    :placeholder="getTemplatePlaceholder('con_in')"
                    type="number"
                    step="0.1"
                    class="w-full border border-gray-300 rounded bg-white p-1 text-gray-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    :class="{ 'italic text-gray-400': isParamEmpty('con_in') }"
                    @input="handleParamInput('con_in', ($event.target as HTMLInputElement).valueAsNumber, true)"
                  >
                </div>
                <div>
                  <label class="block text-xs text-gray-600 dark:text-slate-400">{{ t('editor.deviceParams.con_out') }} (dB):</label>
                  <input
                    :value="getParamValue('con_out')"
                    :placeholder="getTemplatePlaceholder('con_out')"
                    type="number"
                    step="0.1"
                    class="w-full border border-gray-300 rounded bg-white p-1 text-gray-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    :class="{ 'italic text-gray-400': isParamEmpty('con_out') }"
                    @input="handleParamInput('con_out', ($event.target as HTMLInputElement).valueAsNumber, true)"
                  >
                </div>
              </div>

              <!-- EDFA 参数 -->
              <div v-else-if="editableElement.type === 'Edfa'" class="space-y-2">
                <div class="text-sm text-gray-700 font-medium dark:text-slate-300">
                  {{ t('editor.deviceParams.edfa') }}
                </div>
                <!-- Operational Parameters -->
                <div class="mt-3">
                  <div class="mb-2 text-sm text-gray-700 font-medium dark:text-slate-300">
                    {{ t('editor.deviceParams.operational') }}
                  </div>
                  <div>
                    <label class="block text-xs text-gray-600 dark:text-slate-400">{{ t('editor.deviceParams.gain_target') }} (dB):</label>
                    <input
                      :value="getParamValue('gain_target')"
                      :placeholder="getTemplatePlaceholder('gain_target')"
                      type="number"
                      step="0.1"
                      class="w-full border border-gray-300 rounded bg-white p-1 text-gray-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                      :class="{ 'italic text-gray-400': isParamEmpty('gain_target') }"
                      @input="handleParamInput('gain_target', ($event.target as HTMLInputElement).valueAsNumber, true)"
                    >
                  </div>
                  <div>
                    <label class="block text-xs text-gray-600 dark:text-slate-400">{{ t('editor.deviceParams.delta_p') }} (dB):</label>
                    <input
                      :value="getParamValue('delta_p')"
                      :placeholder="getTemplatePlaceholder('delta_p')"
                      type="number"
                      step="0.1"
                      class="w-full border border-gray-300 rounded bg-white p-1 text-gray-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                      :class="{ 'italic text-gray-400': isParamEmpty('delta_p') }"
                      @input="handleParamInput('delta_p', ($event.target as HTMLInputElement).valueAsNumber, true)"
                    >
                  </div>
                  <div>
                    <label class="block text-xs text-gray-600 dark:text-slate-400">{{ t('editor.deviceParams.out_voa') }} (dB):</label>
                    <input
                      :value="getParamValue('out_voa')"
                      :placeholder="getTemplatePlaceholder('out_voa')"
                      type="number"
                      step="0.1"
                      class="w-full border border-gray-300 rounded bg-white p-1 text-gray-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                      :class="{ 'italic text-gray-400': isParamEmpty('out_voa') }"
                      @input="handleParamInput('out_voa', ($event.target as HTMLInputElement).valueAsNumber, true)"
                    >
                  </div>
                  <div>
                    <label class="block text-xs text-gray-600 dark:text-slate-400">{{ t('editor.deviceParams.in_voa') }} (dB):</label>
                    <input
                      :value="getParamValue('in_voa')"
                      :placeholder="getTemplatePlaceholder('in_voa')"
                      type="number"
                      step="0.1"
                      class="w-full border border-gray-300 rounded bg-white p-1 text-gray-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                      :class="{ 'italic text-gray-400': isParamEmpty('in_voa') }"
                      @input="handleParamInput('in_voa', ($event.target as HTMLInputElement).valueAsNumber, true)"
                    >
                  </div>
                  <div>
                    <label class="block text-xs text-gray-600 dark:text-slate-400">{{ t('editor.deviceParams.tilt_target') }} (dB):</label>
                    <input
                      :value="getParamValue('tilt_target')"
                      :placeholder="getTemplatePlaceholder('tilt_target')"
                      type="number"
                      step="0.1"
                      class="w-full border border-gray-300 rounded bg-white p-1 text-gray-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                      :class="{ 'italic text-gray-400': isParamEmpty('tilt_target') }"
                      @input="handleParamInput('tilt_target', ($event.target as HTMLInputElement).valueAsNumber, true)"
                    >
                  </div>
                </div>
              </div>

              <!-- Raman Fiber 参数 -->
              <div v-else-if="editableElement.type === 'RamanFiber'" class="space-y-2">
                <div class="text-sm text-gray-700 font-medium dark:text-slate-300">
                  {{ t('editor.deviceParams.raman_fiber') }}
                </div>
                <!-- Basic Fiber Parameters (same as regular Fiber) -->
                <div>
                  <label class="block text-xs text-gray-600 dark:text-slate-400">{{ t('editor.deviceParams.length') }}:</label>
                  <input
                    :value="getParamValue('length')"
                    :placeholder="getTemplatePlaceholder('length')"
                    type="number"
                    class="w-full border border-gray-300 rounded bg-white p-1 text-gray-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    :class="{ 'italic text-gray-400': isParamEmpty('length') }"
                    @input="handleParamInput('length', ($event.target as HTMLInputElement).valueAsNumber, true)"
                  >
                </div>
                <div>
                  <label class="block text-xs text-gray-600 dark:text-slate-400">{{ t('editor.deviceParams.length_units') }}:</label>
                  <select
                    :value="getParamValue('length_units')"
                    class="w-full border border-gray-300 rounded bg-white p-1 text-gray-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    :class="{ 'italic text-gray-400': isParamEmpty('length_units') }"
                    @input="handleParamInput('length_units', ($event.target as HTMLInputElement).value, false)"
                  >
                    <option value="" disabled selected :class="{ 'text-gray-400': isParamEmpty('length_units') }">
                      {{ getTemplatePlaceholder('length_units') || 'Select units' }}
                    </option>
                    <option value="km">
                      km
                    </option>
                    <option value="m">
                      m
                    </option>
                    <option value="cm">
                      cm
                    </option>
                    <option value="mm">
                      mm
                    </option>
                  </select>
                </div>
                <!-- Raman Specific Parameters -->
                <div class="mt-3">
                  <div class="mb-2 text-sm text-gray-700 font-medium dark:text-slate-300">
                    {{ t('editor.deviceParams.operational') }}
                  </div>
                  <div>
                    <label class="block text-xs text-gray-600 dark:text-slate-400">{{ t('editor.deviceParams.temperature') }}:</label>
                    <input
                      :value="getParamValue('temperature')"
                      :placeholder="getTemplatePlaceholder('temperature')"
                      type="number"
                      step="0.1"
                      class="w-full border border-gray-300 rounded bg-white p-1 text-gray-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                      :class="{ 'italic text-gray-400': isParamEmpty('temperature') }"
                      @input="handleParamInput('temperature', ($event.target as HTMLInputElement).valueAsNumber, true)"
                    >
                  </div>
                  <!-- Raman Pump Parameters -->
                  <div class="mt-2">
                    <div class="mb-1 text-sm text-gray-700 font-medium dark:text-slate-300">
                      {{ t('editor.deviceParams.raman_pump') }}
                    </div>
                    <div>
                      <label class="block text-xs text-gray-600 dark:text-slate-400">{{ t('editor.deviceParams.power') }} (W):</label>
                      <input
                        :value="getParamValue('raman_pump_power')"
                        :placeholder="getTemplatePlaceholder('raman_pump_power')"
                        type="number"
                        step="0.001"
                        class="w-full border border-gray-300 rounded bg-white p-1 text-gray-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                        :class="{ 'italic text-gray-400': isParamEmpty('raman_pump_power') }"
                        @input="handleParamInput('raman_pump_power', ($event.target as HTMLInputElement).valueAsNumber, true)"
                      >
                    </div>
                    <div>
                      <label class="block text-xs text-gray-600 dark:text-slate-400">{{ t('editor.deviceParams.frequency') }} (Hz):</label>
                      <input
                        :value="getParamValue('raman_pump_frequency')"
                        :placeholder="getTemplatePlaceholder('raman_pump_frequency')"
                        type="number"
                        step="1e12"
                        class="w-full border border-gray-300 rounded bg-white p-1 text-gray-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                        :class="{ 'italic text-gray-400': isParamEmpty('raman_pump_frequency') }"
                        @input="handleParamInput('raman_pump_frequency', ($event.target as HTMLInputElement).valueAsNumber, true)"
                      >
                    </div>
                    <div>
                      <label class="block text-xs text-gray-600 dark:text-slate-400">{{ t('editor.deviceParams.propagation_direction') }}:</label>
                      <select
                        :value="getParamValue('raman_pump_direction')"
                        class="w-full border border-gray-300 rounded bg-white p-1 text-gray-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                        :class="{ 'italic text-gray-400': isParamEmpty('raman_pump_direction') }"
                        @input="handleParamInput('raman_pump_direction', ($event.target as HTMLInputElement).value, false)"
                      >
                        <option value="" disabled selected :class="{ 'text-gray-400': isParamEmpty('raman_pump_direction') }">
                          {{ getTemplatePlaceholder('raman_pump_direction') || 'Select direction' }}
                        </option>
                        <option value="coprop">
                          coprop
                        </option>
                        <option value="counterprop">
                          counterprop
                        </option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Fused 参数 -->
              <div v-else-if="editableElement.type === 'Fused'" class="space-y-2">
                <div class="text-sm text-gray-700 font-medium dark:text-slate-300">
                  {{ t('editor.deviceParams.fused') }}
                </div>
                <div>
                  <label class="block text-xs text-gray-600 dark:text-slate-400">{{ t('editor.deviceParams.loss') }} (dB):</label>
                  <input
                    :value="getParamValue('loss')"
                    :placeholder="getTemplatePlaceholder('loss')"
                    type="number"
                    step="0.1"
                    class="w-full border border-gray-300 rounded bg-white p-1 text-gray-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    :class="{ 'italic text-gray-400': isParamEmpty('loss') }"
                    @input="handleParamInput('loss', ($event.target as HTMLInputElement).valueAsNumber, true)"
                  >
                </div>
              </div>

              <!-- ROADM 参数 -->
              <div v-else-if="editableElement.type === 'Roadm'" class="space-y-2">
                <div class="text-sm text-gray-700 font-medium dark:text-slate-300">
                  {{ t('editor.deviceParams.roadm') }}
                </div>
                <div>
                  <label class="block text-xs text-gray-600 dark:text-slate-400">{{ t('editor.deviceParams.target_pch_out_db') }} (dB):</label>
                  <input
                    :value="getParamValue('target_pch_out_db')"
                    :placeholder="getTemplatePlaceholder('target_pch_out_db')"
                    type="number"
                    step="0.1"
                    class="w-full border border-gray-300 rounded bg-white p-1 text-gray-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    :class="{ 'italic text-gray-400': isParamEmpty('target_pch_out_db') }"
                    @input="handleParamInput('target_pch_out_db', ($event.target as HTMLInputElement).valueAsNumber, true)"
                  >
                </div>
                <div>
                  <label class="block text-xs text-gray-600 dark:text-slate-400">{{ t('editor.deviceParams.target_psd_out_mWperGHz') }} (mW/GHz):</label>
                  <input
                    :value="getParamValue('target_psd_out_mWperGHz')"
                    :placeholder="getTemplatePlaceholder('target_psd_out_mWperGHz')"
                    type="number"
                    step="0.001"
                    class="w-full border border-gray-300 rounded bg-white p-1 text-gray-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    :class="{ 'italic text-gray-400': isParamEmpty('target_psd_out_mWperGHz') }"
                    @input="handleParamInput('target_psd_out_mWperGHz', ($event.target as HTMLInputElement).valueAsNumber, true)"
                  >
                </div>
                <div>
                  <label class="block text-xs text-gray-600 dark:text-slate-400">{{ t('editor.deviceParams.target_out_mWperSlotWidth') }} (mW/slot):</label>
                  <input
                    :value="getParamValue('target_out_mWperSlotWidth')"
                    :placeholder="getTemplatePlaceholder('target_out_mWperSlotWidth')"
                    type="number"
                    step="0.001"
                    class="w-full border border-gray-300 rounded bg-white p-1 text-gray-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    :class="{ 'italic text-gray-400': isParamEmpty('target_out_mWperSlotWidth') }"
                    @input="handleParamInput('target_out_mWperSlotWidth', ($event.target as HTMLInputElement).valueAsNumber, true)"
                  >
                </div>
              </div>

              <!-- 默认参数显示 (JSON) -->
              <div v-else class="space-y-2">
                <div class="text-sm text-gray-700 font-medium dark:text-slate-300">
                  {{ t('editor.deviceParams.generic') }}
                </div>
                <div class="break-all rounded bg-gray-100 p-2 text-xs text-gray-900 font-mono dark:bg-slate-900 dark:text-slate-100">
                  <pre>{{ JSON.stringify(editableElement.params, null, 2) }}</pre>
                </div>
              </div>
            </div>
          </div>

          <!-- 元数据编辑 -->
          <div v-if="'metadata' in editableElement && editableElement.metadata" class="mt-4">
            <label class="mb-2 block text-gray-600 dark:text-slate-400">{{ t('editor.metadata') }}:</label>
            <div class="ml-2 space-y-2">
              <!-- 位置编辑 -->
              <div v-if="editableElement.metadata.location" class="space-y-2">
                <div class="text-sm text-gray-700 font-medium dark:text-slate-300">
                  {{ t('editor.deviceParams.location') }}
                </div>
                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <label class="block text-xs text-gray-600 dark:text-slate-400">{{ t('editor.deviceParams.x') }}:</label>
                    <input
                      v-model.number="editableElement.metadata.location.x"
                      type="number"
                      step="0.1"
                      class="w-full border border-gray-300 rounded bg-white p-1 text-gray-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    >
                  </div>
                  <div>
                    <label class="block text-xs text-gray-600 dark:text-slate-400">{{ t('editor.deviceParams.y') }}:</label>
                    <input
                      v-model.number="editableElement.metadata.location.y"
                      type="number"
                      step="0.1"
                      class="w-full border border-gray-300 rounded bg-white p-1 text-gray-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    >
                  </div>
                </div>
              </div>

              <!-- 其他元数据显示 -->
              <div class="space-y-2">
                <div class="text-sm text-gray-700 font-medium dark:text-slate-300">
                  {{ t('editor.deviceParams.other_metadata') }}
                </div>
                <div class="break-all rounded bg-gray-100 p-2 text-xs text-gray-900 font-mono dark:bg-slate-900 dark:text-slate-100">
                  <pre>{{ JSON.stringify(editableElement.metadata, null, 2) }}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
        <button class="mt-4 w-full btn-primary" @click="saveElementChanges">
          <div i-carbon-save mr-1 inline-block /> {{ t('actions.save_changes') }}
        </button>
      </div>
    </div>

    <!-- 全局网络设置面板 -->
    <div v-else class="flex-grow overflow-y-auto">
      <!-- 频谱信息 (SI) -->
      <div class="mb-6 rounded-md bg-white p-3 shadow-sm dark:bg-slate-700">
        <h3 class="mb-2 text-lg text-teal-700 font-semibold dark:text-teal-400">
          {{ t('editor.spectrumInformation') }} (SI)
        </h3>
        <div v-if="editableSI" class="grid grid-cols-1 gap-2 text-sm">
          <div>
            <label for="si-f-min" class="block text-gray-600 dark:text-slate-400">{{ t('editor.properties.f_min') }}:</label>
            <input id="si-f-min" v-model.number="editableSI.f_min" type="number" class="w-full border border-gray-300 rounded bg-white p-1 text-gray-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
          </div>
          <div>
            <label for="si-f-max" class="block text-gray-600 dark:text-slate-400">{{ t('editor.properties.f_max') }}:</label>
            <input id="si-f-max" v-model.number="editableSI.f_max" type="number" class="w-full border border-gray-300 rounded bg-white p-1 text-gray-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
          </div>
          <div>
            <label for="si-baud-rate" class="block text-gray-600 dark:text-slate-400">{{ t('editor.properties.baud_rate') }}:</label>
            <input id="si-baud-rate" v-model.number="editableSI.baud_rate" type="number" class="w-full border border-gray-300 rounded bg-white p-1 text-gray-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
          </div>
          <div>
            <label for="si-spacing" class="block text-gray-600 dark:text-slate-400">{{ t('editor.properties.spacing') }}:</label>
            <input id="si-spacing" v-model.number="editableSI.spacing" type="number" class="w-full border border-gray-300 rounded bg-white p-1 text-gray-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
          </div>
          <div>
            <label for="si-power-dbm" class="block text-gray-600 dark:text-slate-400">{{ t('editor.properties.power_dbm') }}:</label>
            <input id="si-power-dbm" v-model.number="editableSI.power_dbm" type="number" class="w-full border border-gray-300 rounded bg-white p-1 text-gray-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
          </div>
          <div>
            <label for="si-roll-off" class="block text-gray-600 dark:text-slate-400">{{ t('editor.properties.roll_off') }}:</label>
            <input id="si-roll-off" v-model.number="editableSI.roll_off" type="number" class="w-full border border-gray-300 rounded bg-white p-1 text-gray-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
          </div>
          <div>
            <label for="si-tx-osnr" class="block text-gray-600 dark:text-slate-400">{{ t('editor.properties.tx_osnr') }}:</label>
            <input id="si-tx-osnr" v-model.number="editableSI.tx_osnr" type="number" class="w-full border border-gray-300 rounded bg-white p-1 text-gray-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
          </div>
          <div>
            <label for="si-sys-margins" class="block text-gray-600 dark:text-slate-400">{{ t('editor.properties.sys_margins') }}:</label>
            <input id="si-sys-margins" v-model.number="editableSI.sys_margins" type="number" class="w-full border border-gray-300 rounded bg-white p-1 text-gray-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
          </div>
          <!-- 数组类型 power_range_db 简化为只读或 JSON 文本框 -->
          <div v-if="editableSI.power_range_db">
            <label class="block text-gray-600 dark:text-slate-400">{{ t('editor.properties.power_range_db') }}:</label>
            <span class="text-gray-900 font-mono dark:text-slate-100">{{ editableSI.power_range_db.join(', ') }}</span>
          </div>
        </div>
        <div v-else class="text-sm text-gray-500 dark:text-slate-500">
          {{ t('editor.no_spectrum_info') }}
        </div>
        <button class="mt-4 w-full btn-primary" :disabled="!editableSI" @click="saveGlobalChanges('SI')">
          <div i-carbon-save mr-1 inline-block /> {{ t('actions.save_changes') }}
        </button>
      </div>

      <!-- Span Parameters -->
      <div class="mb-6 rounded-md bg-white p-3 shadow-sm dark:bg-slate-700">
        <h3 class="mb-2 text-lg text-teal-700 font-semibold dark:text-teal-400">
          {{ t('editor.spanParameters') }} (Span)
        </h3>
        <div v-if="editableSpan" class="grid grid-cols-1 gap-2 text-sm">
          <div>
            <label for="span-power-mode" class="block text-gray-600 dark:text-slate-400">{{ t('editor.properties.power_mode') }}:</label>
            <input id="span-power-mode" v-model="editableSpan.power_mode" type="checkbox" class="border border-gray-300 rounded bg-white p-1 dark:border-slate-600 dark:bg-slate-800">
          </div>
          <div>
            <label for="span-max-length" class="block text-gray-600 dark:text-slate-400">{{ t('editor.properties.max_length') }}:</label>
            <input id="span-max-length" v-model.number="editableSpan.max_length" type="number" class="w-full border border-gray-300 rounded bg-white p-1 text-gray-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
          </div>
          <div>
            <label for="span-length-units" class="block text-gray-600 dark:text-slate-400">{{ t('editor.properties.length_units') }}:</label>
            <input id="span-length-units" v-model="editableSpan.length_units" type="text" class="w-full border border-gray-300 rounded bg-white p-1 text-gray-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
          </div>
          <div>
            <label for="span-max-loss" class="block text-gray-600 dark:text-slate-400">{{ t('editor.properties.max_loss') }}:</label>
            <input id="span-max-loss" v-model.number="editableSpan.max_loss" type="number" class="w-full border border-gray-300 rounded bg-white p-1 text-gray-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
          </div>
          <div>
            <label for="span-padding" class="block text-gray-600 dark:text-slate-400">{{ t('editor.properties.padding') }}:</label>
            <input id="span-padding" v-model.number="editableSpan.padding" type="number" class="w-full border border-gray-300 rounded bg-white p-1 text-gray-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
          </div>
          <div>
            <label for="span-eol" class="block text-gray-600 dark:text-slate-400">{{ t('editor.properties.eol') }}:</label>
            <input id="span-eol" v-model.number="editableSpan.EOL" type="number" class="w-full border border-gray-300 rounded bg-white p-1 text-gray-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
          </div>
          <div>
            <label for="span-con-in" class="block text-gray-600 dark:text-slate-400">{{ t('editor.properties.con_in') }}:</label>
            <input id="span-con-in" v-model.number="editableSpan.con_in" type="number" class="w-full border border-gray-300 rounded bg-white p-1 text-gray-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
          </div>
          <div>
            <label for="span-con-out" class="block text-gray-600 dark:text-slate-400">{{ t('editor.properties.con_out') }}:</label>
            <input id="span-con-out" v-model.number="editableSpan.con_out" type="number" class="w-full border border-gray-300 rounded bg-white p-1 text-gray-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
          </div>
          <!-- 数组类型 delta_power_range_db 简化为只读或 JSON 文本框 -->
          <div v-if="editableSpan.delta_power_range_db">
            <label class="block text-gray-600 dark:text-slate-400">{{ t('editor.properties.delta_power_range_db') }}:</label>
            <span class="text-gray-900 font-mono dark:text-slate-100">{{ editableSpan.delta_power_range_db.join(', ') }}</span>
          </div>
          <div>
            <label for="span-max-fiber-lineic-loss" class="block text-gray-600 dark:text-slate-400">{{ t('editor.properties.max_fiber_lineic_loss_for_raman') }}:</label>
            <input id="span-max-fiber-lineic-loss" v-model.number="editableSpan.max_fiber_lineic_loss_for_raman" type="number" class="w-full border border-gray-300 rounded bg-white p-1 text-gray-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
          </div>
          <div>
            <label for="span-target-extended-gain" class="block text-gray-600 dark:text-slate-400">{{ t('editor.properties.target_extended_gain') }}:</label>
            <input id="span-target-extended-gain" v-model.number="editableSpan.target_extended_gain" type="number" class="w-full border border-gray-300 rounded bg-white p-1 text-gray-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
          </div>
        </div>
        <div v-else class="text-sm text-gray-500 dark:text-slate-500">
          {{ t('editor.no_span_params') }}
        </div>
        <button class="mt-4 w-full btn-primary" :disabled="!editableSpan" @click="saveGlobalChanges('Span')">
          <div i-carbon-save mr-1 inline-block /> {{ t('actions.save_changes') }}
        </button>
      </div>

      <!-- 仿真配置 (Simulation Configuration) -->
      <div class="mb-6 rounded-md bg-white p-3 shadow-sm dark:bg-slate-700">
        <h3 class="mb-2 text-lg text-teal-700 font-semibold dark:text-teal-400">
          {{ t('editor.simulationConfiguration') }}
        </h3>
        <div v-if="editableSimulationConfig" class="grid grid-cols-1 gap-2 text-sm">
          <div class="text-gray-700 font-semibold dark:text-slate-300">
            {{ t('editor.properties.raman_params') }}
          </div>
          <div>
            <label for="raman-flag" class="block text-gray-600 dark:text-slate-400">{{ t('editor.properties.flag') }}:</label>
            <input id="raman-flag" v-model="editableSimulationConfig.raman_params.flag" type="checkbox" class="border border-gray-300 rounded bg-white p-1 dark:border-slate-600 dark:bg-slate-800">
          </div>
          <div>
            <label for="raman-spatial-resolution" class="block text-gray-600 dark:text-slate-400">{{ t('editor.properties.result_spatial_resolution') }}:</label>
            <input id="raman-spatial-resolution" v-model.number="editableSimulationConfig.raman_params.result_spatial_resolution" type="number" class="w-full border border-gray-300 rounded bg-white p-1 text-gray-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
          </div>
          <div>
            <label for="raman-solver-spatial-resolution" class="block text-gray-600 dark:text-slate-400">{{ t('editor.properties.solver_spatial_resolution') }}:</label>
            <input id="raman-solver-spatial-resolution" v-model.number="editableSimulationConfig.raman_params.solver_spatial_resolution" type="number" class="w-full border border-gray-300 rounded bg-white p-1 text-gray-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
          </div>

          <div class="mt-4 text-gray-700 font-semibold dark:text-slate-300">
            {{ t('editor.properties.nli_params') }}
          </div>
          <div>
            <label for="nli-method" class="block text-gray-600 dark:text-slate-400">{{ t('editor.properties.method') }}:</label>
            <input id="nli-method" v-model="editableSimulationConfig.nli_params.method" type="text" class="w-full border border-gray-300 rounded bg-white p-1 text-gray-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
          </div>
          <div>
            <label for="nli-dispersion-tolerance" class="block text-gray-600 dark:text-slate-400">{{ t('editor.properties.dispersion_tolerance') }}:</label>
            <input id="nli-dispersion-tolerance" v-model.number="editableSimulationConfig.nli_params.dispersion_tolerance" type="number" class="w-full border border-gray-300 rounded bg-white p-1 text-gray-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
          </div>
          <div>
            <label for="nli-phase-shift-tolerance" class="block text-gray-600 dark:text-slate-400">{{ t('editor.properties.phase_shift_tolerance') }}:</label>
            <input id="nli-phase-shift-tolerance" v-model.number="editableSimulationConfig.nli_params.phase_shift_tolerance" type="number" class="w-full border border-gray-300 rounded bg-white p-1 text-gray-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
          </div>
          <!-- 数组类型 computed_channels 简化为只读或 JSON 文本框 -->
          <div v-if="editableSimulationConfig.nli_params.computed_channels">
            <label class="block text-gray-600 dark:text-slate-400">{{ t('editor.properties.computed_channels') }}:</label>
            <span class="text-gray-900 font-mono dark:text-slate-100">{{ editableSimulationConfig.nli_params.computed_channels.join(', ') }}</span>
          </div>
        </div>
        <div v-else class="text-sm text-gray-500 dark:text-slate-500">
          {{ t('editor.no_simulation_config') }}
        </div>
        <button class="mt-4 w-full btn-primary" :disabled="!editableSimulationConfig" @click="saveGlobalChanges('SimulationConfig')">
          <div i-carbon-save mr-1 inline-block /> {{ t('actions.save_changes') }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* UnoCSS classes for styling are applied directly in the template */
/* Input and select base styles */
input[type='text'],
input[type='number'],
select {
  @apply focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors duration-200;
}
input[type='checkbox'] {
  @apply w-4 h-4 text-teal-600 bg-gray-100 border-gray-300 rounded focus:ring-teal-500 dark:focus:ring-teal-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600;
}
</style>
