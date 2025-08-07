<!-- src/components/NetworkParameterPanel.vue -->
<script setup lang="ts">
import type { DeviceType, NetworkConnection, NetworkDetail, NetworkElement, NetworkService, SimulationConfig, SpanParameters, SpectrumInformation } from '~/types/network'

import { useComponentLibrary } from '~/composables/componentLibrary'

const props = defineProps<{
  selectedElement: NetworkElement | NetworkConnection | NetworkService | null
  networkDetail: NetworkDetail | null
}>()

const emit = defineEmits<{
  (e: 'update:element', element: NetworkElement | NetworkConnection | NetworkService): void
  (e: 'update:global', type: 'SI' | 'Span' | 'SimulationConfig', data: SpectrumInformation | SpanParameters | SimulationConfig): void
}>()

const { t } = useI18n()

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

// Available device types that have library support
const supportedDeviceTypes = computed(() => getSupportedDeviceTypes())

// Get available type varieties for the current element
const availableTypeVarieties = computed(() => {
  if (!editableElement.value || !('type' in editableElement.value)) {
    return []
  }
  return getAvailableVarieties(editableElement.value.type)
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
  if (varieties.length > 0 && (!editableElement.value.type_variety || !varieties.includes(editableElement.value.type_variety))) {
    editableElement.value.type_variety = varieties[0]
  }
  else if (varieties.length === 0) {
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

// Apply template defaults to element
function applyTemplateDefaults(template: any) {
  if (!editableElement.value || !('params' in editableElement.value)) {
    return
  }

  // Initialize params if not exists
  if (!editableElement.value.params) {
    editableElement.value.params = {}
  }

  // Apply template properties to params, excluding type_variety and other metadata
  const { type_variety, type_def, allowed_for_design, ...templateParams } = template

  // Apply the relevant template parameters
  Object.assign(editableElement.value.params, templateParams)

  // Handle special cases for different device types
  if (editableElement.value.type === 'Transceiver' && template.mode) {
    // For transceivers, we might want to set a default mode
    if (template.mode && template.mode.length > 0) {
      editableElement.value.params.default_mode = template.mode[0]
    }
  }
}

// 监听 selectedElement 变化，更新本地 editableElement
watch(() => props.selectedElement, (newVal) => {
  editableElement.value = newVal ? JSON.parse(JSON.stringify(newVal)) : null
}, { immediate: true, deep: true }) // immediate 立即运行，deep 深度监听对象内部变化

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

// 保存元素更改
function saveElementChanges() {
  if (editableElement.value) {
    emit('update:element', editableElement.value)
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
              @change="handleTypeChange($event.target.value as DeviceType)"
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
              @change="handleTypeVarietyChange($event.target.value)"
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

          <!-- 元素参数 (params) 和元数据 (metadata) -->
          <div v-if="'params' in editableElement && editableElement.params && Object.keys(editableElement.params).length > 0">
            <label class="block text-gray-600 dark:text-slate-400">{{ t('editor.parameters') }}:</label>
            <div class="ml-2 break-all rounded bg-gray-100 p-2 text-xs text-gray-900 font-mono dark:bg-slate-900 dark:text-slate-100">
              <pre>{{ JSON.stringify(editableElement.params, null, 2) }}</pre>
              <!-- 实际应用中，这里应根据 params 结构动态生成表单项 -->
            </div>
          </div>
          <div v-if="'metadata' in editableElement && editableElement.metadata && Object.keys(editableElement.metadata).length > 0">
            <label class="block text-gray-600 dark:text-slate-400">{{ t('editor.metadata') }}:</label>
            <div class="ml-2 break-all rounded bg-gray-100 p-2 text-xs text-gray-900 font-mono dark:bg-slate-900 dark:text-slate-100">
              <pre>{{ JSON.stringify(editableElement.metadata, null, 2) }}</pre>
              <!-- 实际应用中，这里应根据 metadata 结构动态生成表单项 -->
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
