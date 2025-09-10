<!-- src/pages/network-editor/[id].vue -->
<script setup lang="ts">
import type * as vNG from 'v-network-graph'
import type { EventHandlers } from 'v-network-graph' // 导入类型
import type { WatchHandle } from 'vue'
import type { DeviceType, NetworkConnection, NetworkElement, SimulationConfig, SpanParameters, SpectrumInformation } from '~/types/network'
import { VNetworkGraph } from 'v-network-graph'
import { useDialog } from '~/composables/useDialog'
import { useNetworkLoader } from '~/composables/useNetworkLoader'

const dialog = useDialog()

// Router
const route = useRoute('/network-editor/[id]')
const networkId = route.params.id

// 在 setup 中获取当前组件实例的代理，以访问全局属性
const app = getCurrentInstance()! // 确保获取到实例
const { proxy } = app // 解构出 proxy

// I18n
const { t } = useI18n()

// 添加连接模式
const addConnectionMode = ref(false)
const connectionNodeId = ref<string | null>()
let connectionWatch: WatchHandle | null = null

// Network graph data (v-network-graph)
const configs = computed(() => getGraphConfig(isDark.value, addConnectionMode.value))
const {
  isLoading,
  apiError,
  networkDetail,
  nodes,
  edges,
  paths,
  layouts,
} = useNetworkLoader(networkId)

const graph = ref<vNG.Instance | null>(null) // 新增：VNetworkGraph 组件的引用
const lastViewClickEvent = ref<MouseEvent | null>(null) // 新增：存储视图右键点击时的MouseEvent

// Selected components in graph
const selectedNodes = ref<string[]>([])
const selectedEdges = ref<string[]>([])
const selectedPaths = ref<string[]>([])

// Component library integration
const {
  getAvailableVarieties,
} = useComponentLibrary()

// Info
const statusBarInfo = ref<string>('...')

// --- 菜单refs ---
const viewMenu = ref<HTMLDivElement>()
const nodeMenu = ref<HTMLDivElement>()
const edgeMenu = ref<HTMLDivElement>()
const pathMenu = ref<HTMLDivElement>()

// --- 菜单目标数据 ---
const menuTargetNode = ref('')
const menuTargetEdges = ref<string[]>([])

// --- 全局上下文菜单关闭处理器 ---
// 用于在点击菜单外部或执行菜单项时关闭菜单
let globalContextMenuCloseHandler: ((event: PointerEvent) => void) | null = null

// --- 显示上下文菜单函数 ---
function showContextMenu(element: HTMLElement, event: MouseEvent) {
  // 确保在显示新菜单之前，移除旧的监听器
  if (globalContextMenuCloseHandler) {
    document.removeEventListener('pointerdown', globalContextMenuCloseHandler, { capture: true })
    globalContextMenuCloseHandler = null
  }

  // 设置菜单位置和可见性
  element.style.left = `${event.x}px`
  element.style.top = `${event.y}px`
  element.hidden = false
  element.style.zIndex = '100' // 确保菜单在最上层

  // 定义新的菜单关闭处理函数
  const currentMenuElement = element // 捕获当前菜单元素
  globalContextMenuCloseHandler = (e: PointerEvent) => {
    // 如果点击目标不存在或点击在菜单外部，则隐藏所有菜单
    if (!e.target || !currentMenuElement.contains(e.target as HTMLElement)) {
      hideAllMenus()
    }
  }

  // 添加全局监听器，用于点击菜单外部时隐藏菜单
  document.addEventListener('pointerdown', globalContextMenuCloseHandler, { passive: true, capture: true })
}

// --- 隐藏所有上下文菜单函数 ---
function hideAllMenus() {
  if (viewMenu.value)
    viewMenu.value.hidden = true
  if (nodeMenu.value)
    nodeMenu.value.hidden = true
  if (edgeMenu.value)
    edgeMenu.value.hidden = true
  if (pathMenu.value)
    pathMenu.value.hidden = true

  // 移除全局监听器
  if (globalContextMenuCloseHandler) {
    document.removeEventListener('pointerdown', globalContextMenuCloseHandler, { capture: true })
    globalContextMenuCloseHandler = null
  }
}

// --- 组件卸载时清理事件监听器 ---
onUnmounted(() => {
  if (globalContextMenuCloseHandler) {
    document.removeEventListener('pointerdown', globalContextMenuCloseHandler, { capture: true })
  }
})

// --- 特定事件处理函数 ---
function showViewContextMenu(params: vNG.ViewEvent<MouseEvent>) {
  const { event } = params
  event.stopPropagation()
  event.preventDefault() // 禁用浏览器默认上下文菜单
  lastViewClickEvent.value = event
  if (viewMenu.value) {
    showContextMenu(viewMenu.value, event)
  }
}

async function addNodeAtMouse() {
  // 确保有 graph 实例和上次的点击事件
  if (!graph.value || !lastViewClickEvent.value) {
    console.error('Cannot add node: graph instance or last click event is missing.')
    return
  }

  const { offsetX, offsetY } = lastViewClickEvent.value // 获取点击的DOM坐标
  // 将DOM坐标转换为SVG（图表内部）坐标
  const svgCoords = graph.value.translateFromDomToSvgCoordinates({ x: offsetX, y: offsetY })

  await addNodeAtCoords(svgCoords)
}

async function addNodeAtCenter() {
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
  await addNodeAtCoords({ x: newX, y: newY })
}

async function addNodeAtCoords(svgCoords: vNG.Point) {
  const newNodeName = await dialog.showPrompt(t('editor.toolbar.add_node'), t('editor.toolbar.enter_node_name')) // <-- 使用 dialog.showPrompt
  if (!newNodeName)
    return

  // Get supported device types from component library
  const supportedTypes: DeviceType[] = [
    'Transceiver',
    'Fiber',
    'Edfa',
    'RamanFiber',
    'Roadm',
    'Fused',
  ]

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

  const payload = {
    name: newNodeName,
    type: deviceType,
    type_variety: selectedVariety,
    params: {},
    operational: {},
    metadata: { location: { x: svgCoords.x, y: svgCoords.y } },
  }

  try {
    // 调用API创建新节点
    const res = await elementApi.addElement(networkId, payload) // 假设您有 elementApi

    if (res === null) {
      proxy?.$notify({
        type: 'error',
        message: 'Failed to create node: Null response from API.',
      })
      return
    }

    // 也更新 networkDetail.value?.elements 以保持数据一致性
    networkDetail.value?.elements.push(res)

    proxy?.$notify({
      type: 'success',
      message: t('editor.toolbar.add_node_success_message', { node_name: newNodeName, x: svgCoords.x.toFixed(1), y: svgCoords.y.toFixed(1) }),
    })
  }
  catch (err: any) {
    console.error('Failed to add new node:', err)
    proxy?.$notify({
      type: 'error',
      message: t('editor.toolbar.add_node_fail_message', { msg: err.message || 'Unknown error' }),
    })
  }
}

function showNodeContextMenu(params: vNG.NodeEvent<MouseEvent>) {
  const { node, event } = params
  event.stopPropagation()
  event.preventDefault()
  if (nodeMenu.value) {
    // menuTargetNode.value = data.nodes[node].name ?? ''
    if (!selectedNodes.value.includes(node)) {
      // 将 nodeId 插入到数组的第一个位置
      selectedNodes.value.unshift(node)
    }
    showContextMenu(nodeMenu.value, event)
  }
}

function showEdgeContextMenu(params: vNG.EdgeEvent<MouseEvent>) {
  const { edge, event } = params
  event.stopPropagation()
  event.preventDefault()
  if (edgeMenu.value) {
    menuTargetEdges.value = params.summarized ? params.edges : [params.edge]
    if (edge && !selectedEdges.value.includes(edge)) {
      // 将 nodeId 插入到数组的第一个位置
      selectedEdges.value.unshift(edge)
    }
    showContextMenu(edgeMenu.value, event)
  }
}

function showPathContextMenu(params: vNG.PathEvent<MouseEvent>) {
  const { path, event } = params
  event.stopPropagation()
  event.preventDefault() // 禁用浏览器默认上下文菜单
  if (pathMenu.value) {
    if (!selectedPaths.value.includes(path)) {
      // 将 nodeId 插入到数组的第一个位置
      selectedPaths.value.unshift(path)
    }
    showContextMenu(pathMenu.value, event)
  }
}

// --- v-network-graph 事件处理 ---
const eventHandlers: EventHandlers = {
  'node:click': () => {

  },
  'edge:click': () => {

  },
  'path:click': () => {

  },
  'node:dragend': async (event) => {
    const validResponses = []
    for (const [nodeId, { x, y }] of Object.entries(event)) {
      const element = networkDetail.value?.elements.find(el => el.element_id === nodeId)
      if (element) {
        const payload = {
          ...element,
          metadata: {
            ...element.metadata,
            location: { x, y },
          },
        }
        try {
          const response = await elementApi.updateElement(networkId, nodeId, payload)
          if (response) {
            validResponses.push(response)
          }
        }
        catch (err) {
          console.error('Failed to update element location', err)
          proxy?.$notify({
            type: 'error',
            message: 'Failed to update element location',
          })
        }
      }
    }
    for (const response of validResponses) {
      const index = networkDetail.value?.elements.findIndex(elem => elem.element_id === response.element_id)
      if (networkDetail.value && index !== undefined && index !== -1) {
        networkDetail.value.elements[index].metadata = response.metadata
      }
    }
  },
  'view:load': () => {
    // 隐藏所有菜单项
    hideAllMenus()
  },
  'view:pan': ({ x, y }) => {
    statusBarInfo.value = `${t('editor.status_bar.view_position')}: ${x.toFixed(2)}, ${y.toFixed(2)}`
  },
  'view:zoom': (zoomLevel) => {
    statusBarInfo.value = `${t('editor.status_bar.zoom_level')}: ${zoomLevel.toFixed(2)}`
  },
  'view:click': () => {
    // Click background
  },
  'view:contextmenu': showViewContextMenu,
  'node:contextmenu': showNodeContextMenu,
  'edge:contextmenu': showEdgeContextMenu,
  'path:contextmenu': showPathContextMenu,
}

watch(addConnectionMode, (newMode) => {
  // 无论进入或退出连接模式，都先清空所有选择
  selectedNodes.value = []
  selectedEdges.value = []
  selectedPaths.value = []
  connectionNodeId.value = null // 也清空 connectionNodes
  if (newMode) {
    statusBarInfo.value = t('editor.status_bar.connect_mode')
    // 进入连接模式时，启动对 selectedNodes 的监听
    connectionWatch = watch(selectedNodes, async (newSelection) => {
      if (newSelection.length !== 1) {
        connectionNodeId.value = null
        statusBarInfo.value = t('editor.status_bar.connect_mode')
      }
      else if (connectionNodeId.value != null) {
        const from_node = connectionNodeId.value
        const to_node = newSelection[0]
        const payload = { from_node, to_node }
        try {
          const res = await connectionApi.createConnection(networkId, payload)
          if (res === null) {
            proxy?.$notify({
              type: 'error',
              message: 'Failed to create connection: Null resp.',
            })
          }
          else {
            networkDetail.value?.connections.push(res)
            connectionNodeId.value = newSelection[0]
            statusBarInfo.value = t('editor.status_bar.connect_mode_continue')
          }
        }
        catch (err) {
          console.error('Failed to create connection:', err)
          proxy?.$notify({
            type: 'error',
            message: 'Failed to create connection',
          })
        }
      }
      else {
        connectionNodeId.value = newSelection[0]
        statusBarInfo.value = t('editor.status_bar.connect_mode_first_node')
      }
    })
  }
  else {
    // 退出连接模式时，停止对 selectedNodes 的监听
    if (connectionWatch) {
      connectionWatch() // 执行停止函数
      connectionWatch = null // 将其设置为 null，方便下次判断
    }
    statusBarInfo.value = t('editor.status_bar.view_mode')
  }
}, { immediate: true })

/**
 * 删除选中的节点
 */
async function deleteSelectedNodes() {
  const confirmed = await dialog.showConfirm(
    t('editor.delete.confirm_delete_title'),
    `Delete ${selectedNodes.value.length} node(s)?`,
  )
  if (!confirmed) {
    return
  }

  let failedCount = 0
  const initialCount = selectedNodes.value.length

  for (const nodeId of selectedNodes.value) {
    try {
      await elementApi.deleteElement(networkId, nodeId)
      const index = networkDetail.value?.elements.findIndex(elem => elem.element_id === nodeId)
      if (index !== undefined && index !== -1) {
        networkDetail.value?.elements.splice(index, 1)
      }
    }
    catch (err) {
      failedCount++
      console.error(`Failed to delete node ${nodeId}:`, err)
    }
  }

  selectedNodes.value = [] // 清空选中

  if (failedCount === 0) {
    proxy!.$notify({
      type: 'success',
      message: t('editor.delete.delete_nodes_success', { count: initialCount }), // 建议添加此翻译key
    })
  }
  else {
    proxy!.$notify({
      type: 'error',
      message: t('editor.delete.delete_nodes_partial_failure', { failed: failedCount, total: initialCount }), // 建议添加此翻译key
      duration: 0,
    })
  }
}

/**
 * 删除选中的边
 */
async function deleteSelectedEdges() {
  const confirmed = await dialog.showConfirm(
    t('editor.delete.confirm_delete_title'),
    `Delete ${selectedEdges.value.length} connection(s)?`,
  )
  if (!confirmed) {
    return
  }

  let failedCount = 0
  const initialCount = selectedEdges.value.length

  for (const edgeId of selectedEdges.value) {
    try {
      await connectionApi.deleteConnection(networkId, edgeId)
      const index = networkDetail.value?.connections.findIndex(conn => conn.connection_id === edgeId)
      if (index !== undefined && index !== -1) {
        networkDetail.value?.connections.splice(index, 1)
      }
    }
    catch (err) {
      failedCount++
      console.error(`Failed to delete edge ${edgeId}:`, err)
    }
  }

  selectedEdges.value = [] // 清空选中

  if (failedCount === 0) {
    proxy!.$notify({
      type: 'success',
      message: t('editor.delete.delete_edges_success', { count: initialCount }),
    })
  }
  else {
    proxy!.$notify({
      type: 'error',
      message: t('editor.delete.delete_edges_partial_failure', { failed: failedCount, total: initialCount }),
      duration: 0,
    })
  }
}

/**
 * 删除选中的路径
 */
async function deleteSelectedPaths() {
  const confirmed = await dialog.showConfirm(
    t('editor.delete.confirm_delete_title'),
    `Delete ${selectedPaths.value.length} service(s)?`,
  )
  if (!confirmed) {
    return
  }

  let failedCount = 0
  const initialCount = selectedPaths.value.length

  for (const serviceId of selectedPaths.value) {
    try {
      await serviceApi.deleteService(networkId, serviceId)
      const index = networkDetail.value?.services.findIndex(serv => serv.service_id === serviceId)
      if (index !== undefined && index !== -1) {
        networkDetail.value?.services.splice(index, 1)
      }
    }
    catch (err) {
      failedCount++
      console.error(`Failed to delete service ${serviceId}:`, err)
    }
  }

  selectedPaths.value = [] // 清空选中

  if (failedCount === 0) {
    proxy!.$notify({
      type: 'success',
      message: t('editor.delete.delete_services_success', { count: initialCount }),
    })
  }
  else {
    proxy!.$notify({
      type: 'error',
      message: t('editor.delete.delete_services_partial_failure', { failed: failedCount, total: initialCount }),
      duration: 0,
    })
  }
}

/**
 * 主删除函数：根据当前选中的项目类型，调用相应的删除逻辑
 */
async function deleteSelected() {
  // 1. 检查是否有任何项目被选中
  if (selectedNodes.value.length === 0 && selectedEdges.value.length === 0 && selectedPaths.value.length === 0) {
    proxy!.$notify({
      type: 'warning',
      message: t('editor.delete.nothing_selected_to_delete'), // 建议添加此翻译key
      duration: 5000,
    })
    return
  }

  // 2. 根据选中的类型，调用对应的删除函数
  if (selectedNodes.value.length > 0) {
    await deleteSelectedNodes()
  }
  else if (selectedEdges.value.length > 0) {
    await deleteSelectedEdges()
  }
  else if (selectedPaths.value.length > 0) {
    await deleteSelectedPaths()
  }
}

async function handleElementUpdate(data: NetworkElement | null) {
  if (!data) {
    return
  }
  try {
    const updatedElement = await elementApi.updateElement(networkId, data.element_id, data)
    if (updatedElement && networkDetail) {
      const index = networkDetail.value?.elements.findIndex(elem => elem.element_id === updatedElement.element_id)
      if (index && index !== -1) {
        networkDetail.value!.elements[index] = updatedElement
      }
    }
  }
  catch (err) {
    console.error(`Failed to update element:`, err)
  }
}

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
}

interface CopiedNodeItem {
  element_id: string
  // 每个节点的属性模板
  template: Omit<NetworkElement, 'element_id' | 'metadata'>
  // 该节点相对于组几何中心的偏移量
  offset: { x: number, y: number }
}
interface CopiedConnectionItem {
  // 连接的属性模板，不包含 connection_id 和 from_node, to_node
  template: Omit<NetworkConnection, 'connection_id' | 'from_node' | 'to_node'>
  // 连接的原始起点和终点节点ID
  source: { from: string, to: string }
}
interface CopiedNodeGroup {
  is_cut: boolean
  // 节点列表
  nodes: CopiedNodeItem[]
  // 原始节点组的几何中心（用于调试或未来扩展，非必需但推荐）
  originalCenter: vNG.Point
  connections: CopiedConnectionItem[]
}
const copiedNodeGroup = ref<CopiedNodeGroup | null>(null)

async function handleCopyCutNode(is_cut: boolean) { // 添加 async
  if (selectedNodes.value.length === 0) {
    proxy?.$notify({ type: 'warning', message: 'No nodes selected to copy.' })
    return
  }

  const nodesToCopy = networkDetail.value?.elements.filter(el =>
    selectedNodes.value.includes(el.element_id),
  )
  if (!nodesToCopy || nodesToCopy.length === 0) {
    proxy?.$notify({ type: 'error', message: 'Could not find selected nodes data.' })
    return
  }

  let sumX = 0
  let sumY = 0
  nodesToCopy.forEach((node) => {
    sumX += node.metadata.location.x
    sumY += node.metadata.location.y
  })
  const nodeCount = nodesToCopy.length
  const originalCenter = {
    x: sumX / nodeCount,
    y: sumY / nodeCount,
  }

  const connectionsToCopy: CopiedConnectionItem[] = []
  networkDetail.value?.connections.forEach((conn) => {
    if (selectedNodes.value.includes(conn.from_node) && selectedNodes.value.includes(conn.to_node)) {
      const { connection_id, from_node, to_node, ...template } = conn
      connectionsToCopy.push({
        template,
        source: { from: from_node, to: to_node },
      })
    }
  })

  // 1. 创建 groupToCopy 对象
  const groupToCopy: CopiedNodeGroup = {
    is_cut,
    originalCenter,
    nodes: nodesToCopy.map((node) => {
      const { element_id, metadata, ...template } = node
      return {
        // 注意：element_id 在粘贴时会重新生成，但保留它是为了在同一页面内维护映射，
        // 如果是跨应用，这个 element_id 的具体值就无意义了，仅仅是作为旧ID的标识。
        element_id,
        template,
        offset: {
          x: metadata.location.x - originalCenter.x,
          y: metadata.location.y - originalCenter.y,
        },
      }
    }),
    connections: connectionsToCopy,
  }

  // 2. 序列化为 JSON 字符串
  const jsonString = JSON.stringify(groupToCopy)

  // 3. 写入系统剪贴板
  try {
    // navigator.clipboard.writeText 需要用户手势，所以确保这个函数是在点击事件中触发的
    await navigator.clipboard.writeText(jsonString)
    copiedNodeGroup.value = groupToCopy // 仍然保留内部引用，方便在本窗口快速粘贴
    const connectionCount = connectionsToCopy.length
    if (is_cut) {
      for (const nodeInfo of groupToCopy.nodes) {
        await elementApi.deleteElement(networkId, nodeInfo.element_id)
        const index = networkDetail.value?.elements.findIndex(elem => elem.element_id === nodeInfo.element_id)
        if (index !== undefined && index !== -1) {
          networkDetail.value?.elements.splice(index, 1)
        }
      }
    }
    proxy?.$notify({ type: 'success', message: t('editor.menu.copy_message.copied', { nodeCount, connectionCount }) })
  }
  catch (err) {
    console.error('Failed to copy to clipboard:', err)
    proxy?.$notify({ type: 'error', message: 'Failed to copy to clipboard. Please try again or check browser permissions.' })
  }
}

async function handlePasteNode() { // 添加 async
  // 1. 尝试从系统剪贴板读取数据
  let pasteData: CopiedNodeGroup | null = null
  try {
    // navigator.clipboard.readText 也需要用户手势和/或权限
    const clipboardText = await navigator.clipboard.readText()
    pasteData = JSON.parse(clipboardText) as CopiedNodeGroup // 尝试解析
    // 【重要】验证解析后的数据结构是否符合 CopiedNodeGroup 预期
    if (!pasteData || !Array.isArray(pasteData.nodes) || !Array.isArray(pasteData.connections) || typeof pasteData.originalCenter !== 'object') {
      throw new Error('Invalid data format on clipboard.')
    }
  }
  catch (e) {
    const message = t('editor.menu.paste_message.invalid_clipboard')
    console.warn(message, e)
    proxy?.$notify({ type: 'warning', message })
    // 如果系统剪贴板读取失败或数据不合法，则回退到内部 `copiedNodeGroup` 变量
    pasteData = copiedNodeGroup.value
  }

  if (!pasteData || pasteData.nodes.length === 0) {
    proxy?.$notify({ type: 'warning', message: t('editor.menu.paste_message.empty_clipboard') })
    return
  }

  // 确保有 graph 实例和上次的点击事件
  if (!graph.value || !lastViewClickEvent.value) {
    console.error('Cannot add node: graph instance or last click event is missing.')
    return
  }

  const { offsetX, offsetY } = lastViewClickEvent.value
  const newCenter = graph.value.translateFromDomToSvgCoordinates({ x: offsetX, y: offsetY })

  let nodeSuccessCount = 0
  let nodeFailCount = 0
  let connectionSuccessCount = 0
  let connectionFailCount = 0

  const nodeIdMap = new Map<string, string>() // 用于映射旧ID到新ID

  const { nodes: nodesToPaste, connections: connectionsToPaste } = pasteData // 使用从剪贴板或内部变量获取的数据

  const nodePastePromises = nodesToPaste.map(async (item) => {
    const originalName = item.template.name || 'Node'
    let newName = pasteData.is_cut ? originalName : `${originalName}_copy`
    let counter = 1
    while (networkDetail.value?.elements.some(el => el.name === newName)) {
      newName = `${originalName}_copy${counter}`
      counter++
    }

    const newNodePosition = {
      x: newCenter.x + item.offset.x,
      y: newCenter.y + item.offset.y,
    }

    const payload = {
      ...item.template,
      name: newName,
      metadata: { location: newNodePosition },
    }

    try {
      const newNode = await elementApi.addElement(networkId, payload)
      if (newNode) {
        networkDetail.value?.elements.push(newNode)
        nodeIdMap.set(item.element_id, newNode.element_id) //
        nodeSuccessCount++
      }
      else {
        nodeFailCount++
      }
    }
    catch (err) {
      console.error('Failed to paste one node:', err)
      nodeFailCount++
    }
  })

  await Promise.all(nodePastePromises)

  if (connectionsToPaste.length > 0) {
    const connectionPastePromises = connectionsToPaste.map(async (connItem) => {
      const newFromNodeId = nodeIdMap.get(connItem.source.from)
      const newToNodeId = nodeIdMap.get(connItem.source.to)

      if (!newFromNodeId || !newToNodeId) {
        console.warn(`Could not find new node IDs for connection from ${connItem.source.from} to ${connItem.source.to}. Skipping.`)
        connectionFailCount++
        return
      }

      const payload = {
        ...connItem.template,
        from_node: newFromNodeId,
        to_node: newToNodeId,
      }

      try {
        const newConnection = await connectionApi.createConnection(networkId, payload)
        if (newConnection) {
          networkDetail.value?.connections.push(newConnection)
          connectionSuccessCount++
        }
        else {
          connectionFailCount++
        }
      }
      catch (err) {
        console.error('Failed to paste one connection:', err)
        connectionFailCount++
      }
    })
    await Promise.all(connectionPastePromises)
  }

  let message = t('editor.menu.paste_message.pasted', { nodeSuccessCount, connectionSuccessCount })
  if (nodeFailCount > 0 || connectionFailCount > 0) {
    message += t('editor.menu.paste_message.failed', { nodeFailCount, connectionFailCount })
    proxy?.$notify({ type: 'warning', message, duration: 0 })
  }
  else {
    proxy?.$notify({ type: 'success', message })
  }
}
</script>

<template>
  <div flex="~" class="h-screen overflow-hidden">
    <!-- Editor Main page -->
    <div flex="grow" class="relative">
      <!-- Overlay -->
      <div v-if="isLoading" flex="center" bg="white dark:gray-100" class="absolute inset-0 z-10">
        <!-- Is loading -->
        <div i-carbon-circle-dash animate-spin text="icon-size-2 blue-60" />
        <span text="blue-60 body01" class="ml-2">{{ t('editor.loading') }}</span>
      </div>
      <!-- API Error -->
      <div v-else-if="apiError" flex="center" bg="red-10 dark:red-90" text="red-60 dark:red-30" class="absolute inset-0 z-10">
        <div i-carbon-warning text="icon-size-2" />
        <span class="ml-2 body01">Error: {{ apiError.message }}</span>
      </div>
      <!-- v-network-graph -->
      <div v-else flex="~ col" class="h-full w-full select-none">
        <VNetworkGraph
          ref="graph"
          v-model:layouts="layouts"
          v-model:selected-nodes="selectedNodes"
          v-model:selected-edges="selectedEdges"
          v-model:selected-paths="selectedPaths"
          tabindex="0"
          class="h-full w-full focus:outline-none"
          :nodes="nodes"
          :edges="edges"
          :paths="paths"
          :configs="configs"
          :event-handlers="eventHandlers"
          @keyup.delete="deleteSelected"
        />

        <!-- --- 节点右键菜单 --- -->
        <div
          ref="nodeMenu"
          class="visibility-hidden fixed w-[180px] border border-gray-30 rounded-md bg-gray-10 p-2 body02 font-sans shadow-md dark:border-gray-70 dark:bg-gray-90 dark:ring-1 dark:ring-gray-70"
          @contextmenu.prevent=""
        >
          <div class="mb-2 px-3 py-1.5 label01 text-gray-100 dark:text-gray-10">
            {{ t('editor.menu.node_menu') }}
          </div>
          <div class="menu-target-display mb-2 caption01 text-gray-80 dark:text-gray-20">
            {{ menuTargetNode }}
          </div>
          <div class="interactive-item inline-flex items-center gap-2 px-3 py-1.5 hover:bg-gray-20 dark:hover:bg-gray-80" @click="handleCopyCutNode(false);hideAllMenus()">
            <div class="i-carbon-copy inline-block text-gray-80 dark:text-gray-20" />
            <span class="body01 text-gray-100 dark:text-gray-10">{{ t('editor.menu.copy') }}</span>
          </div>
          <div class="interactive-item inline-flex items-center gap-2 px-3 py-1.5 hover:bg-gray-20 dark:hover:bg-gray-80" @click="handleCopyCutNode(true);hideAllMenus()">
            <div class="i-carbon-cut inline-block text-gray-80 dark:text-gray-20" />
            <span class="body01 text-gray-100 dark:text-gray-10">{{ t('editor.menu.cut') }}</span>
          </div>
          <div class="my-2 border-t border-gray-30 dark:border-gray-70" />
          <div class="interactive-item inline-flex items-center gap-2 px-3 py-1.5 text-red-60 hover:bg-red-10 dark:text-red-40 dark:hover:bg-red-90" @click="deleteSelected();hideAllMenus()">
            <div class="i-carbon-trash-can inline-block" />
            <span class="body01">{{ t('editor.menu.delete') }}</span>
          </div>
          <div class="my-2 border-t border-gray-30 dark:border-gray-70" />
          <div class="interactive-item inline-flex items-center gap-2 px-3 py-1.5 hover:bg-gray-20 dark:hover:bg-gray-80">
            <div class="i-carbon-settings inline-block text-gray-80 dark:text-gray-20" />
            <span class="body01 text-gray-100 dark:text-gray-10">{{ t('editor.menu.properties') }}</span>
          </div>
        </div>

        <!-- --- 边右键菜单 --- -->
        <div
          ref="edgeMenu"
          class="visibility-hidden fixed w-[180px] border border-gray-30 rounded-md bg-gray-10 p-2 body02 font-sans shadow-md dark:border-gray-70 dark:bg-gray-90 dark:ring-1 dark:ring-gray-70"
          @contextmenu.prevent=""
        >
          <div class="mb-2 px-3 py-1.5 label01 text-gray-100 dark:text-gray-10">
            {{ t('editor.menu.edge_menu') }}
          </div>
          <div class="menu-target-display mb-2 caption01 text-gray-80 dark:text-gray-20">
            {{ menuTargetEdges.join(", ") }}
          </div>
          <div class="my-2 border-t border-gray-30 dark:border-gray-70" />
          <div class="interactive-item inline-flex items-center gap-2 px-3 py-1.5 text-red-60 hover:bg-red-10 dark:text-red-40 dark:hover:bg-red-90" @click="deleteSelected();hideAllMenus()">
            <div class="i-carbon-trash-can inline-block" />
            <span class="body01">{{ t('editor.menu.delete') }}</span>
          </div>
          <div class="my-2 border-t border-gray-30 dark:border-gray-70" />
          <div class="interactive-item inline-flex items-center gap-2 px-3 py-1.5 hover:bg-gray-20 dark:hover:bg-gray-80">
            <div class="i-carbon-settings inline-block text-gray-80 dark:text-gray-20" />
            <span class="body01 text-gray-100 dark:text-gray-10">{{ t('editor.menu.properties') }}</span>
          </div>
        </div>

        <!-- --- 路径右键菜单 --- -->
        <div
          ref="pathMenu"
          class="visibility-hidden fixed w-[180px] border border-gray-30 rounded-md bg-gray-10 p-2 body02 font-sans shadow-md dark:border-gray-70 dark:bg-gray-90 dark:ring-1 dark:ring-gray-70"
          @contextmenu.prevent=""
        >
          <div class="mb-2 px-3 py-1.5 label01 text-gray-100 dark:text-gray-10">
            {{ t('editor.menu.service_menu') }}
          </div>
          <div class="menu-target-display mb-2 caption01 text-gray-80 dark:text-gray-20">
            {{ menuTargetEdges.join(", ") }}
          </div>
          <div class="my-2 border-t border-gray-30 dark:border-gray-70" />
          <div class="interactive-item inline-flex items-center gap-2 px-3 py-1.5 text-red-60 hover:bg-red-10 dark:text-red-40 dark:hover:bg-red-90" @click="deleteSelected();hideAllMenus()">
            <div class="i-carbon-trash-can inline-block" />
            <span class="body01">{{ t('editor.menu.delete') }}</span>
          </div>
          <div class="my-2 border-t border-gray-30 dark:border-gray-70" />
          <div class="interactive-item inline-flex items-center gap-2 px-3 py-1.5 hover:bg-gray-20 dark:hover:bg-gray-80">
            <div class="i-carbon-settings inline-block text-gray-80 dark:text-gray-20" />
            <span class="body01 text-gray-100 dark:text-gray-10">{{ t('editor.menu.properties') }}</span>
          </div>
        </div>

        <!-- --- 画布右键菜单 --- -->
        <div
          ref="viewMenu"
          class="visibility-hidden fixed w-[180px] border border-gray-30 rounded-md bg-gray-10 p-2 body02 font-sans shadow-md dark:border-gray-70 dark:bg-gray-90 dark:ring-1 dark:ring-gray-70"
          @contextmenu.prevent=""
        >
          <div class="mb-2 px-3 py-1.5 label01 text-gray-100 dark:text-gray-10">
            {{ t('editor.menu.view_menu') }}
          </div>
          <div class="menu-target-display mb-2 caption01 text-gray-80 dark:text-gray-20">
            {{ menuTargetEdges.join(", ") }}
          </div>
          <div class="interactive-item inline-flex items-center gap-2 px-3 py-1.5 hover:bg-gray-20 dark:hover:bg-gray-80" @click="addNodeAtMouse(); hideAllMenus()">
            <div class="i-carbon-add-alt inline-block text-gray-80 dark:text-gray-20" />
            <span class="body01 text-gray-100 dark:text-gray-10">{{ t('editor.menu.add_node') }}</span>
          </div>
          <div class="interactive-item inline-flex items-center gap-2 px-3 py-1.5 hover:bg-gray-20 dark:hover:bg-gray-80" @click="handlePasteNode();hideAllMenus()">
            <div class="i-carbon-paste inline-block text-gray-80 dark:text-gray-20" />
            <span class="body01 text-gray-100 dark:text-gray-10">{{ t('editor.menu.paste') }}</span>
          </div>
          <div class="my-2 border-t border-gray-30 dark:border-gray-70" />
          <div class="interactive-item inline-flex items-center gap-2 px-3 py-1.5 text-red-60 hover:bg-red-10 dark:text-red-40 dark:hover:bg-red-90" @click="deleteSelected();hideAllMenus()">
            <div class="i-carbon-trash-can inline-block" />
            <span class="body01">{{ t('editor.menu.delete') }}</span>
          </div>
          <div class="my-2 border-t border-gray-30 dark:border-gray-70" />
          <div class="interactive-item inline-flex items-center gap-2 px-3 py-1.5 hover:bg-gray-20 dark:hover:bg-gray-80">
            <div class="i-carbon-settings inline-block text-gray-80 dark:text-gray-20" />
            <span class="body01 text-gray-100 dark:text-gray-10">{{ t('editor.menu.properties') }}</span>
          </div>
        </div>
      </div>

      <!-- 操作按钮浮层 -->
      <div flex="~ col" bg="white dark:gray-100" class="absolute left-4 top-4 z-20 gap-2 rounded-md p-2 shadow-md">
        <button class="cds-btn--secondary cds-btn" @click="addNodeAtCenter">
          <div i-carbon-add-alt class="mr-1" /> {{ t('editor.toolbar.add_node') }}
        </button>
        <button v-if="!addConnectionMode" class="cds-btn cds-btn--secondary" @click="addConnectionMode = true">
          <div i-carbon-link class="mr-1" /> {{ t('editor.toolbar.add_connection') }}
        </button>
        <button v-else class="cds-btn cds-btn--primary" @click="addConnectionMode = false">
          <div i-carbon-checkmark class="mr-1" /> {{ t('editor.toolbar.finish_connection') }}
        </button>
      </div>

      <!-- Info -->
      <div
        flex="~" text="caption02" bg="white dark:gray-100"
        class="absolute bottom-0 border-r border-t border-gray-30 rounded-r px-3 py-1 dark:border-gray-70"
      >
        {{ statusBarInfo }}
      </div>
    </div>

    <div class="w-92 overflow-y-auto border-l border-gray-30 shadow-md dark:border-gray-70">
      <NetworkParameterPanel
        :is-loading="isLoading"
        :selected-nodes="selectedNodes"
        :network-detail="networkDetail"
        @update:element="handleElementUpdate"
        @update:global="handleGlobalUpdate"
      />
    </div>
  </div>
</template>

<style>
/* 交互项样式 */
.interactive-item {
  @apply cursor-pointer rounded motion-productive-standard-fast-01;
}
</style>

<route lang="yaml">
meta:
  layout: editor
</route>
