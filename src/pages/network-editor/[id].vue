<!-- src/pages/network-editor/[id].vue -->
<script setup lang="ts">
import type { Edges, EventHandlers, Layouts, Nodes, Paths, VNetworkGraphInstance } from 'v-network-graph'
import type { DeviceType, NetworkConnection, NetworkDetail, NetworkElement, NetworkService, SimulationConfig, SpanParameters, SpectrumInformation } from '~/types/network'
import { VNetworkGraph } from 'v-network-graph'
import { nextTick } from 'vue'
import NetworkParameterPanel from '~/components/NetworkParameterPanel.vue' // 导入参数面板组件
import { useComponentLibrary } from '~/composables/componentLibrary'
import { connectionApi } from '~/composables/connectionApi'
import { isDark } from '~/composables/dark'
import { getGraphConfig } from '~/composables/editorConfig'
import { elementApi } from '~/composables/elementApi'
import { networkApi } from '~/composables/networkApi'
import { serviceApi } from '~/composables/serviceApi'
import { useDialog } from '~/composables/useDialog'

const route = useRoute('/network-editor/[id]')
const { t } = useI18n()
const networkId = route.params.id as string

const dialog = useDialog()

// Component library integration
const {
  loadComponentLibrary,
  getSupportedDeviceTypes,
  getAvailableVarieties,
  getDeviceTemplate,
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

// 图数据
const nodes = reactive<Nodes>({})
const edges = reactive<Edges>({})
const paths = reactive<Paths>({}) // 用于服务路径
const layouts = reactive<Layouts>({ nodes: {} })

// 选中状态
const selectedNodes = ref<string[]>([])
const selectedEdges = ref<string[]>([])
const selectedPaths = ref<string[]>([])

// 跟踪未保存的更改
const hasUnsavedChanges = ref(false)

// 存储点击背景前的选择状态
const selectionBeforeClick = ref<{
  nodes: string[]
  edges: string[]
  paths: string[]
} | null>(null)

// 网络详情 (用于全局参数)
const networkDetail = ref<NetworkDetail | null>(null)

// --- 参数面板逻辑 ---
const selectedElement = computed(() => {
  if (selectedNodes.value.length === 1) {
    return networkDetail.value?.elements.find(el => el.element_id === selectedNodes.value[0]) || null
  }
  if (selectedEdges.value.length === 1) {
    return networkDetail.value?.connections.find(conn => conn.connection_id === selectedEdges.value[0]) || null
  }
  if (selectedPaths.value.length === 1) {
    return networkDetail.value?.services.find(svc => svc.service_id === selectedPaths.value[0]) || null
  }
  return null
})

const isElementSelected = computed(() => selectedNodes.value.length > 0 || selectedEdges.value.length > 0 || selectedPaths.value.length > 0)

// 处理参数面板的更新事件
async function handleElementUpdate(updatedElement: NetworkElement | NetworkConnection | NetworkService) {
  if ('element_id' in updatedElement) { // 是 NetworkElement
    try {
      // 直接使用 updatedElement 中的数据构建 payload
      const payload: Partial<NetworkElement> = {
        name: updatedElement.name,
        type: updatedElement.type,
        type_variety: updatedElement.type_variety,
        params: updatedElement.params,
        metadata: updatedElement.metadata,
      }

      // 调用 API 更新
      await elementApi.updateElement(networkId, updatedElement.element_id, payload)
      await fetchNetworkData() // 重新获取数据以确保一致性
    }
    catch (err) {
      console.error('Failed to update element:', err)
      dialog.showAlert(t('error.title'), t('error.update_failed'))
    }
  }
  else if ('connection_id' in updatedElement) { // 是 NetworkConnection
    // 目前 connection API 只有删除，没有更新。如果 API 支持，在这里实现
    console.warn('Connection update is not directly supported by the provided API.')
    // 如果需要，可以模拟更新本地状态，但不发送到后端
  }
  else if ('service_id' in updatedElement) { // 是 NetworkService
    try {
      // 直接使用 updatedElement 中的数据构建 payload
      const payload: Partial<NetworkService> = {
        name: updatedElement.name,
        status: updatedElement.status,
        path: updatedElement.path,
        service_requirements: updatedElement.service_requirements,
        service_constraints: updatedElement.service_constraints,
      }

      // 调用 API 更新
      await serviceApi.updateService(networkId, updatedElement.service_id, payload)
      await fetchNetworkData()
    }
    catch (err) {
      console.error('Failed to update service:', err)
    }
  }
}

// 加载和错误状态
const isLoading = ref(true)
const apiError = ref<any>(null)

// VNetworkGraph 组件的引用
const graph = ref<VNetworkGraphInstance | null>(null)

// NetworkParameterPanel 组件的引用
const parameterPanel = ref<InstanceType<typeof NetworkParameterPanel> | null>(null)

// --- v-network-graph 配置 ---
const configs = computed(() => getGraphConfig(isDark.value))

// --- v-network-graph 事件处理 ---
const eventHandlers: EventHandlers = {
  // 捕获选择状态，防止在 view:click 时丢失
  'node:click': () => {
    // 记录当前选择状态
    selectionBeforeClick.value = {
      nodes: [...selectedNodes.value],
      edges: [...selectedEdges.value],
      paths: [...selectedPaths.value],
    }
  },
  'edge:click': () => {
    // 记录当前选择状态
    selectionBeforeClick.value = {
      nodes: [...selectedNodes.value],
      edges: [...selectedEdges.value],
      paths: [...selectedPaths.value],
    }
  },
  'path:click': () => {
    // 记录当前选择状态
    selectionBeforeClick.value = {
      nodes: [...selectedNodes.value],
      edges: [...selectedEdges.value],
      paths: [...selectedPaths.value],
    }
  },
  'node:dragend': (event) => {
    Object.entries(event).forEach(([nodeId, { x, y }]) => {
      // 节点拖拽结束，更新位置到 API
      const element = networkDetail.value?.elements.find(el => el.element_id === nodeId)
      if (element) {
        const payload = {
          metadata: {
            ...element.metadata,
            location: { x, y },
          },
        }
        try {
          elementApi.updateElement(networkId, nodeId, payload)
        }
        catch (err) {
          console.error('Failed to update element location:', err)
        }
      }
    })
  },
  // 简化选择逻辑：让 v-model:selected-nodes/edges/paths 处理选择状态
  // 'node:click', 'edge:click', 'path:click' 不再手动修改 selectedXxx 数组
  'view:click': async () => {
    // 点击背景时取消所有选中，但如果有未保存的更改，先提示用户
    if (hasUnsavedChanges.value && selectionBeforeClick.value) {
      const confirmed = await dialog.showConfirm(
        t('dialog.unsaved_changes_title'),
        t('dialog.unsaved_changes_message'),
      )

      if (confirmed) {
        // 用户确认保存，调用参数面板的保存方法
        if (parameterPanel.value) {
          await parameterPanel.value.saveElementChanges()
        }
        hasUnsavedChanges.value = false
        await fetchNetworkData()
        // 保存成功后恢复选择状态，然后清除
        if (selectionBeforeClick.value) {
          selectedNodes.value = [...selectionBeforeClick.value.nodes]
          selectedEdges.value = [...selectionBeforeClick.value.edges]
          selectedPaths.value = [...selectionBeforeClick.value.paths]
        }
        // 延迟清除选择，让用户看到保存成功的效果
        setTimeout(() => {
          selectedNodes.value = []
          selectedEdges.value = []
          selectedPaths.value = []
        }, 100)
      }
      else {
        // 用户选择不保存，直接清除未保存更改状态
        hasUnsavedChanges.value = false
        await fetchNetworkData()
      }
    }
    // 清除存储的选择状态
    selectionBeforeClick.value = null
  },
  'view:contextmenu': ({ event }) => {
    event.preventDefault() // 阻止默认浏览器右键菜单
    // 可以在这里实现自定义的上下文菜单，例如添加节点
    console.warn('View context menu clicked at:', event.clientX, event.clientY)
  },
  'node:contextmenu': ({ node, event }) => {
    event.preventDefault()
    console.warn('Node context menu clicked for:', node)
    // 可以在这里实现删除节点、编辑节点等操作
  },
  'edge:contextmenu': ({ edge, event }) => {
    event.preventDefault()
    console.warn('Edge context menu clicked for:', edge)
    // 可以在这里实现删除边、编辑边等操作
  },
  'path:contextmenu': ({ path, event }) => {
    event.preventDefault()
    console.warn('Path context menu clicked for:', path)
    // 可以在这里实现删除服务、编辑服务等操作
  },
}

// --- 数据转换函数 ---
function transformApiToGraphData(detail: NetworkDetail) {
  const newNodesMap: Nodes = {}
  const newLayoutsNodesMap: Layouts['nodes'] = {}
  detail.elements.forEach((el) => {
    newNodesMap[el.element_id] = { name: el.name, type: el.type } // 假设只需要name属性
    if (el.metadata?.location) {
      newLayoutsNodesMap[el.element_id] = { x: el.metadata.location.x, y: el.metadata.location.y }
    }
    else {
      // 如果API没有提供位置，尝试保留现有位置，否则赋一个随机位置
      newLayoutsNodesMap[el.element_id] = layouts.nodes[el.element_id] || { x: Math.random() * 800, y: Math.random() * 600 }
    }
  })
  // 1. 删除不再存在于API响应中的节点及其布局
  for (const nodeId in nodes) {
    if (!(nodeId in newNodesMap)) {
      delete nodes[nodeId]
      delete layouts.nodes[nodeId]
    }
  }
  // 2. 添加或更新节点及其布局
  for (const nodeId in newNodesMap) {
    // 检查是否需要更新，避免不必要的响应式触发
    if (JSON.stringify(nodes[nodeId]) !== JSON.stringify(newNodesMap[nodeId])) {
      nodes[nodeId] = newNodesMap[nodeId]
    }
    if (JSON.stringify(layouts.nodes[nodeId]) !== JSON.stringify(newLayoutsNodesMap[nodeId])) {
      layouts.nodes[nodeId] = newLayoutsNodesMap[nodeId]
    }
  }
  // --- 智能更新 Edges ---
  const newEdgesMap: Edges = {}
  detail.connections.forEach((conn) => {
    newEdgesMap[conn.connection_id] = { source: conn.from_node, target: conn.to_node }
  })
  // 1. 删除不再存在于API响应中的边
  for (const edgeId in edges) {
    if (!(edgeId in newEdgesMap)) {
      delete edges[edgeId]
    }
  }
  // 2. 添加或更新边
  for (const edgeId in newEdgesMap) {
    if (JSON.stringify(edges[edgeId]) !== JSON.stringify(newEdgesMap[edgeId])) {
      edges[edgeId] = newEdgesMap[edgeId]
    }
  }
  // --- 智能更新 Paths (服务) ---
  const newPathsMap: Paths = {}
  detail.services.forEach((service) => {
    const servicePathEdges: string[] = []
    for (let i = 0; i < service.path.length - 1; i++) {
      const fromNodeId = service.path[i]
      const toNodeId = service.path[i + 1]
      const foundConnection = detail.connections.find(conn =>
        (conn.from_node === fromNodeId && conn.to_node === toNodeId)
        || (conn.from_node === toNodeId && conn.to_node === fromNodeId),
      )
      if (foundConnection) {
        servicePathEdges.push(foundConnection.connection_id)
      }
      else {
        console.warn(`Service ${service.service_id}: No connection found between ${fromNodeId} and ${toNodeId}. Path may be incomplete.`)
        break
      }
    }
    if (servicePathEdges.length > 0) {
      newPathsMap[service.service_id] = { edges: servicePathEdges }
    }
  })
  // 1. 删除不再存在于API响应中的路径
  for (const pathId in paths) {
    if (!(pathId in newPathsMap)) {
      delete paths[pathId]
    }
  }
  // 2. 添加或更新路径
  for (const pathId in newPathsMap) {
    if (JSON.stringify(paths[pathId]) !== JSON.stringify(newPathsMap[pathId])) {
      paths[pathId] = newPathsMap[pathId]
    }
  }
}

// --- 获取网络数据 ---
async function fetchNetworkData() {
  apiError.value = null

  try {
    const response = await networkApi.getNetwork(networkId)
    if (response === null) {
      throw new Error('Received null response')
    }
    networkDetail.value = response
    transformApiToGraphData(networkDetail.value)
  }
  catch (err) {
    apiError.value = err as Error
  }
  finally {
    isLoading.value = false
  }
}

onMounted(() => {
  isLoading.value = true
  fetchNetworkData()
})

async function handleGlobalUpdate(type: 'SI' | 'Span' | 'SimulationConfig', data: SpectrumInformation | SpanParameters | SimulationConfig) {
  let apiCallError: any = null
  if (type === 'SI') {
    try {
      await networkApi.updateSpectrumInformation(networkId, data as SpectrumInformation)
    }
    catch (err) {
      apiCallError = err as Error
    }
  }
  else if (type === 'Span') {
    try {
      await networkApi.updateSpanParameters(networkId, data as SpanParameters)
    }
    catch (err) {
      apiCallError = err as Error
    }
  }
  else if (type === 'SimulationConfig') {
    try {
      await networkApi.updateSimulationConfig(networkId, data as SimulationConfig)
    }
    catch (err) {
      apiCallError = err as Error
    }
  }

  if (apiCallError) {
    console.error(`Failed to update ${type}:`, apiCallError)
  }
  else {
    await fetchNetworkData() // 重新获取数据以确保一致性
  }
}

// 处理未保存的更改状态
function handleUnsavedChanges(hasChanges: boolean) {
  hasUnsavedChanges.value = hasChanges
}

// --- 操作 (添加/删除) ---
async function addNode() {
  const newNodeName = await dialog.showPrompt(t('editor.toolbar.add_node'), t('editor.toolbar.enter_node_name')) // <-- 使用 dialog.showPrompt
  if (!newNodeName)
    return

  // Get supported device types from component library
  const supportedTypes = getSupportedDeviceTypes()

  // Let user select device type
  const deviceTypeResult = await dialog.showSelect(
    t('editor.toolbar.select_device_type'),
    t('editor.toolbar.select_device_type_prompt'),
    supportedTypes.map(type => ({ label: type || 'Unknown', value: type || 'unknown' })),
  )

  if (!deviceTypeResult) {
    return
  }

  const deviceType = deviceTypeResult as DeviceType

  // Get available varieties for the selected device type
  const availableVarieties = getAvailableVarieties(deviceType)

  // Let user select type variety if available
  let selectedVariety: string | undefined
  if (availableVarieties.length > 0) {
    const varietyResult = await dialog.showSelect(
      t('editor.toolbar.select_type_variety'),
      t('editor.toolbar.select_type_variety_prompt'),
      availableVarieties.map(variety => ({ label: variety || 'Unknown', value: variety || 'unknown' })),
    )

    if (!varietyResult)
      return
    selectedVariety = varietyResult
  }

  let newX = 0
  let newY = 0

  // 获取视图中心点作为新节点位置
  if (graph.value) {
    // 获取图表容器的 DOM 元素
    const graphContainer = graph.value.$el as HTMLElement
    const containerRect = graphContainer.getBoundingClientRect()

    // 计算 DOM 容器的中心点坐标
    const domCenterX = containerRect.width / 2
    const domCenterY = containerRect.height / 2

    // 将 DOM 中心点坐标转换为 SVG 坐标
    const svgCoords = graph.value.translateFromDomToSvgCoordinates({
      x: domCenterX,
      y: domCenterY,
    })
    newX = svgCoords.x
    newY = svgCoords.y
  }
  else {
    // 如果 graph 引用不可用，则回退到随机位置（通常不会发生，因为按钮在组件挂载后才可见）
    console.warn('Graph component reference not available, falling back to random position for new node.')
    newX = Math.random() * 800 + 100
    newY = Math.random() * 600 + 100
  }

  // Get device template and apply defaults
  const template = selectedVariety ? getDeviceTemplate(deviceType, selectedVariety) : null
  const params: Record<string, any> = {}

  if (template && 'type_variety' in template) {
    // Apply template parameters, excluding metadata
    const templateParams = { ...template }
    // Safely remove properties that might not exist
    if ('type_variety' in templateParams) {
      delete (templateParams as any).type_variety
    }
    if ('type_def' in templateParams) {
      delete (templateParams as any).type_def
    }
    if ('allowed_for_design' in templateParams) {
      delete (templateParams as any).allowed_for_design
    }
    Object.assign(params, templateParams)
  }

  const payload = {
    name: newNodeName,
    type: deviceType,
    type_variety: selectedVariety,
    params,
    metadata: { location: { x: newX, y: newY } },
  }
  try {
    const response = await elementApi.addElement(networkId, payload)
    // Clear current selection
    selectedNodes.value = []
    selectedEdges.value = []
    selectedPaths.value = []

    // If API returns the created element, use its ID to select it
    if (response && 'element_id' in response) {
      nextTick(() => {
        selectedNodes.value = [response.element_id]
      })
    }
    else {
      // Fallback: find the new node by name after data refresh
      nextTick(async () => {
        await fetchNetworkData()
        const newNode = networkDetail.value?.elements.find(el => el.name === newNodeName)
        if (newNode) {
          selectedNodes.value = [newNode.element_id]
        }
      })
    }
  }
  catch (err) {
    console.error('Failed to add node:', err)
  }
  if (!selectedNodes.value.length) {
    await fetchNetworkData()
  }
}

async function deleteSelected() {
  if (!isElementSelected.value) {
    dialog.showAlert(t('editor.toolbar.delete_selected_title'), t('editor.toolbar.no_selection_to_delete')) // <-- 使用 dialog.showAlert
  }
  else if (selectedNodes.value.length > 0) {
    const confirmed = await dialog.showConfirm(t('editor.toolbar.confirm_delete_title'), 'delete') // <-- 使用 dialog.showConfirm
    if (!confirmed) {
      return
    }
    for (const nodeId of selectedNodes.value) {
      try {
        await elementApi.deleteElement(networkId, nodeId)
      }
      catch (err) {
        console.error(`Failed to delete node ${nodeId}:`, err)
      }
    }
    selectedNodes.value = [] // 清空选中
    await fetchNetworkData() // 重新获取数据以更新图
  }
  else if (selectedEdges.value.length > 0) {
    const confirmed = await dialog.showConfirm(t('editor.toolbar.confirm_delete_title'), 'delete') // <-- 使用 dialog.showConfirm
    if (!confirmed) {
      return
    }
    for (const edgeId of selectedEdges.value) {
      try {
        await connectionApi.deleteConnection(networkId, edgeId)
      }
      catch (err) {
        console.error(`Failed to delete edge ${edgeId}:`, err)
      }
    }
    selectedEdges.value = [] // 清空选中
    await fetchNetworkData() // 重新获取数据以更新图
  }
  else if (selectedPaths.value.length > 0) {
    const confirmed = await dialog.showConfirm(t('editor.toolbar.confirm_delete_title'), 'delete') // <-- 使用 dialog.showConfirm
    if (!confirmed) {
      return
    }
    for (const serviceId of selectedPaths.value) {
      try {
        await serviceApi.deleteService(networkId, serviceId)
      }
      catch (err) {
        console.error(`Failed to delete service ${serviceId}:`, err)
      }
    }
    selectedPaths.value = [] // 清空选中
    await fetchNetworkData() // 重新获取数据以更新图
  }
}

// 添加连接模式
const addConnectionMode = ref(false)
const connectionNodes = ref<string[]>([])

watch(selectedNodes, (newSelection) => {
  if (addConnectionMode.value) {
    connectionNodes.value = newSelection.slice(0, 2) // 最多选择两个节点用于连接
  }
})

function toggleAddConnectionMode() {
  addConnectionMode.value = !addConnectionMode.value
  connectionNodes.value = []
  if (!addConnectionMode.value) {
    selectedNodes.value = [] // 退出模式时清空选择
  }
}

async function createConnection() {
  if (connectionNodes.value.length !== 2) {
    dialog.showAlert(t('editor.toolbar.add_connection_title'), t('editor.toolbar.select_two_nodes')) // <-- 使用 dialog.showAlert
    return
  }
  const [from_node, to_node] = connectionNodes.value
  const payload = { from_node, to_node }
  try {
    await connectionApi.createConnection(networkId, payload)
  }
  catch (err) {
    console.error('Failed to create connection:', err)
  }
  await fetchNetworkData()
  toggleAddConnectionMode() // 创建后退出模式
}

// 添加服务模式
const addServiceMode = ref(false)
const servicePathNodes = ref<string[]>([])

watch(selectedNodes, (newSelection) => {
  if (addServiceMode.value) {
    // 如果选中了一个节点，且不在当前路径中
    if (newSelection.length === 1 && !servicePathNodes.value.includes(newSelection[0])) {
      // 检查新节点是否与路径中的最后一个节点连接
      if (servicePathNodes.value.length > 0) {
        const lastNodeInPath = servicePathNodes.value[servicePathNodes.value.length - 1]
        const isConnected = networkDetail.value?.connections.some(conn =>
          (conn.from_node === lastNodeInPath && conn.to_node === newSelection[0])
          || (conn.from_node === newSelection[0] && conn.to_node === lastNodeInPath),
        )
        if (isConnected) {
          servicePathNodes.value.push(newSelection[0])
        }
        else {
          dialog.showAlert(t('editor.toolbar.add_service_title'), t('editor.toolbar.node_not_connected_to_path')) // <-- 使用 dialog.showAlert
        }
      }
      else {
        servicePathNodes.value.push(newSelection[0]) // 路径为空时直接添加
      }
    }
  }
})

function toggleAddServiceMode() {
  addServiceMode.value = !addServiceMode.value
  servicePathNodes.value = []
  if (!addServiceMode.value) {
    selectedNodes.value = [] // 退出模式时清空选择
  }
}

async function createService() {
  if (servicePathNodes.value.length < 2) {
    dialog.showAlert(t('editor.toolbar.add_service_title'), t('editor.toolbar.select_two_nodes_for_service')) // <-- 使用 dialog.showAlert
    return
  }
  const serviceName = await dialog.showPrompt(t('editor.toolbar.add_service_title'), t('editor.toolbar.enter_service_name')) // <-- 使用 dialog.showPrompt
  if (serviceName === null)
    return

  if (!serviceName.trim()) {
    dialog.showAlert(t('error.title'), t('error.service_name_required')) // <-- 使用 dialog.showAlert
    return
  }

  const payload = {
    name: serviceName,
    path: servicePathNodes.value,
    service_requirements: { bandwidth: 100, latency: 1 }, // 默认需求
    service_constraints: {}, // 默认约束
  }
  try {
    await serviceApi.createService(networkId, payload)
  }
  catch (err) {
    console.error('Failed to create service:', err)
  }
  await fetchNetworkData()
  toggleAddServiceMode() // 创建后退出模式
}
</script>

<template>
  <div class="h-screen flex overflow-hidden">
    <!-- 主内容区 (图表) -->
    <div class="relative flex-grow">
      <!-- 加载和错误状态覆盖层 -->
      <div v-if="isLoading" class="absolute inset-0 z-10 flex-center bg-white/80 dark:bg-slate-900/80">
        <div i-carbon-circle-dash animate-spin text-4xl text-teal-600 />
        <span class="ml-2 text-teal-600">{{ t('info.loading') }}...</span>
      </div>
      <div v-else-if="apiError" class="absolute inset-0 z-10 flex-center bg-red-100/80 text-red-700 dark:bg-red-900/80 dark:text-red-300">
        <div i-carbon-warning text-4xl />
        <span class="ml-2">Error: {{ apiError.message }}</span>
      </div>
      <!-- v-network-graph 实例 -->
      <div v-else class="h-full w-full">
        <VNetworkGraph
          ref="graph"
          v-model:layouts="layouts"
          v-model:selected-nodes="selectedNodes"
          v-model:selected-edges="selectedEdges"
          v-model:selected-paths="selectedPaths"
          class="h-full w-full select-none"
          :nodes="nodes"
          :edges="edges"
          :paths="paths"
          :configs="configs"
          :event-handlers="eventHandlers"
        />
      </div>

      <!-- 操作按钮浮层 -->
      <div class="absolute left-4 top-4 z-20 flex flex-col gap-2 rounded-lg bg-white/80 p-2 shadow-md dark:bg-slate-800/80">
        <button class="icon-btn-secondary" @click="addNode">
          <div i-carbon-add-alt /> {{ t('editor.toolbar.add_node') }}
        </button>
        <!-- Add Connection Button -->
        <button
          v-if="!addConnectionMode"
          class="icon-btn-secondary"
          @click="toggleAddConnectionMode"
        >
          <div i-carbon-link /> {{ t('editor.toolbar.add_connection') }}
        </button>
        <!-- Cancel Connection Button -->
        <button
          v-else
          class="icon-btn-primary"
          @click="toggleAddConnectionMode"
        >
          <div i-carbon-link /> {{ t('editor.toolbar.cancel_connect') }}
        </button>
        <button v-if="addConnectionMode && connectionNodes.length === 2" class="icon-btn-primary" @click="createConnection">
          <div i-carbon-checkmark /> {{ t('editor.toolbar.confirm_connect') }}
        </button>
        <!-- <div v-if="addConnectionMode && connectionNodes.length > 0" class="text-center text-sm text-gray-600 dark:text-slate-400">
          Selected: {{ connectionNodes.join(', ') }}
        </div> -->

        <button
          v-if="addServiceMode"
          class="icon-btn-primary"
          @click="toggleAddServiceMode"
        >
          <div i-carbon-flow-connection /> {{ t('editor.toolbar.cancel_service') }}
        </button>
        <button
          v-else
          class="icon-btn-secondary"
          @click="toggleAddServiceMode"
        >
          <div i-carbon-flow-connection /> {{ t('editor.toolbar.add_service') }}
        </button>

        <button v-if="addServiceMode && servicePathNodes.length >= 2" class="icon-btn-primary" @click="createService">
          <div i-carbon-checkmark /> {{ t('editor.toolbar.confirm_service') }}
        </button>
        <!-- <div v-if="addServiceMode && servicePathNodes.length > 0" class="text-center text-sm text-gray-600 dark:text-slate-400">
          {{ t('editor.toolbar.path') }}: {{ servicePathNodes.join(' → ') }}
        </div> -->

        <button class="icon-btn-danger" :disabled="!isElementSelected" @click="deleteSelected">
          <div i-carbon-trash-can /> {{ t('editor.toolbar.delete_selected') }}
        </button>
      </div>
    </div>

    <!-- 参数修改面板 -->
    <div class="parameter-panel w-96 overflow-y-auto border-l border-gray-200 bg-gray-50 p-4 shadow-lg dark:border-slate-700 dark:bg-slate-800">
      <NetworkParameterPanel
        ref="parameterPanel"
        :selected-element="selectedElement"
        :network-detail="networkDetail"
        @update:element="handleElementUpdate"
        @update:global="handleGlobalUpdate"
        @has-unsaved-changes="handleUnsavedChanges"
      />
    </div>
  </div>
</template>

<route lang="yaml">
meta:
  layout: editor
</route>
