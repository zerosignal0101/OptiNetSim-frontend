<!-- src/pages/network-editor/[id].vue -->
<script setup lang="ts">
import type * as vNG from 'v-network-graph'
import type { EventHandlers } from 'v-network-graph' // 导入类型
import type { WatchHandle } from 'vue'
import type { DeviceType } from '~/types/network'
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

// Network graph data (v-network-graph)
const configs = computed(() => getGraphConfig(isDark.value))
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
  getSupportedDeviceTypes,
  getAvailableVarieties,
} = useComponentLibrary()

// Info
const actionInfo = ref<string>('...')

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

  const payload = {
    name: newNodeName,
    type: deviceType,
    type_variety: selectedVariety,
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
      message: `${newNodeName} added at (${svgCoords.x.toFixed(0)}, ${svgCoords.y.toFixed(0)})`,
    })
  }
  catch (err: any) {
    console.error('Failed to add new node:', err)
    proxy?.$notify({
      type: 'error',
      message: `Failed to add node: ${err.message || 'Unknown error'}`,
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
  'node:dragend': (event) => {
    Object.entries(event).forEach(([nodeId, { x, y }]) => {
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
          console.error('Failed to update element location', err)
          proxy?.$notify({
            type: 'error',
            message: 'Failed to update element location',
          })
        }
      }
    })
  },
  'view:load': () => {
    // 隐藏所有菜单项
    hideAllMenus()
  },
  'view:pan': ({ x, y }) => {
    actionInfo.value = `View position: ${x.toFixed(2)}, ${y.toFixed(2)}`
  },
  'view:zoom': (zoomLevel) => {
    actionInfo.value = `Zoom: ${zoomLevel.toFixed(2)}`
  },
  'view:click': () => {
    // Click background
  },
  'view:contextmenu': showViewContextMenu,
  'node:contextmenu': showNodeContextMenu,
  'edge:contextmenu': showEdgeContextMenu,
  'path:contextmenu': showPathContextMenu,
}

// 添加连接模式
const addConnectionMode = ref(false)
const connectionNodeId = ref<string | null>()

let connectionWatch: WatchHandle | null = null

watch(addConnectionMode, (newMode) => {
  // 无论进入或退出连接模式，都先清空所有选择
  selectedNodes.value = []
  selectedEdges.value = []
  selectedPaths.value = []
  connectionNodeId.value = null // 也清空 connectionNodes
  if (newMode) {
    actionInfo.value = 'Enter connect mode.'
    // 进入连接模式时，启动对 selectedNodes 的监听
    connectionWatch = watch(selectedNodes, async (newSelection) => {
      if (newSelection.length !== 1) {
        connectionNodeId.value = null
        actionInfo.value = 'Enter connect mode.'
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
            actionInfo.value = 'Connection created. Continue connect.'
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
        actionInfo.value = 'Get first node. Select next.'
      }
    })
  }
  else {
    // 退出连接模式时，停止对 selectedNodes 的监听
    if (connectionWatch) {
      connectionWatch() // 执行停止函数
      connectionWatch = null // 将其设置为 null，方便下次判断
    }
    actionInfo.value = 'Enter view mode.'
  }
}, { immediate: true })

async function deleteSelected() {
  if (selectedNodes.value.length > 0) {
    const confirmed = await dialog.showConfirm(t('editor.toolbar.confirm_delete_title'), 'delete') // <-- 使用 dialog.showConfirm
    if (!confirmed) {
      return
    }
    for (const nodeId of selectedNodes.value) {
      try {
        await elementApi.deleteElement(networkId, nodeId)
        const index = networkDetail.value?.elements.findIndex(elem => elem.element_id === nodeId)
        if (index && index !== -1) {
          networkDetail.value?.elements.splice(index, 1)
        }
      }
      catch (err) {
        console.error(`Failed to delete node ${nodeId}:`, err)
      }
    }
    selectedNodes.value = [] // 清空选中
  }
  else if (selectedEdges.value.length > 0) {
    const confirmed = await dialog.showConfirm(t('editor.toolbar.confirm_delete_title'), 'delete') // <-- 使用 dialog.showConfirm
    if (!confirmed) {
      return
    }
    for (const edgeId of selectedEdges.value) {
      try {
        await connectionApi.deleteConnection(networkId, edgeId)
        const index = networkDetail.value?.connections.findIndex(conn => conn.connection_id === edgeId)
        if (index && index !== -1) {
          networkDetail.value?.connections.splice(index, 1)
        }
      }
      catch (err) {
        console.error(`Failed to delete edge ${edgeId}:`, err)
      }
    }
    selectedEdges.value = [] // 清空选中
  }
  else if (selectedPaths.value.length > 0) {
    const confirmed = await dialog.showConfirm(t('editor.toolbar.confirm_delete_title'), 'delete') // <-- 使用 dialog.showConfirm
    if (!confirmed) {
      return
    }
    for (const serviceId of selectedPaths.value) {
      try {
        await serviceApi.deleteService(networkId, serviceId)
        const index = networkDetail.value?.services.findIndex(serv => serv.service_id === serviceId)
        if (index && index !== -1) {
          networkDetail.value?.services.splice(index, 1)
        }
      }
      catch (err) {
        console.error(`Failed to delete service ${serviceId}:`, err)
      }
    }
    selectedPaths.value = [] // 清空选中
  }
}
</script>

<template>
  <div flex="~" class="h-screen overflow-hidden">
    <!-- Editor Main page -->
    <div flex="grow" class="relative">
      <!-- Overlay -->
      <div v-if="isLoading" flex="center" bg="white/80 dark:slate-900/80" class="absolute inset-0 z-10">
        <!-- Is loading -->
        <div i-carbon-circle-dash animate-spin text="4xl teal-600" />
        <span text="teal-600" class="ml-2">{{ t('info.loading') }}</span>
      </div>
      <!-- API Error -->
      <div v-else-if="apiError" flex="center" bg="red-100/80 dark:red-900/80" text="red-700 dark:red-300" class="abosolute inset-0 z-10">
        <div i-carbon-warning text="4xl" />
        <span class="ml-2">Error: {{ apiError.message }}</span>
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
          class="visibility-hidden fixed w-180px border border-gray-200 rounded-lg bg-gray-50 p-2 text-sm font-sans shadow-lg dark:border-slate-700 dark:bg-slate-800 dark:ring-1 dark:ring-slate-700"
          @contextmenu.prevent=""
        >
          <div class="mb-2 p-x-3 p-y-1.5 text-sm text-gray-800 font-semibold dark:text-slate-200">
            节点菜单
          </div>
          <div class="mb-2 menu-target-display">
            {{ menuTargetNode }}
          </div>
          <div class="inline-flex items-center gap-2 interactive-item">
            <div class="i-carbon-copy inline-block" />复制
          </div>
          <div class="inline-flex items-center gap-2 interactive-item">
            <div class="i-carbon-cut inline-block" />剪切
          </div>
          <div class="inline-flex items-center gap-2 interactive-item">
            <div class="i-carbon-paste inline-block" />粘贴
          </div>
          <div class="my-2 border-t border-gray-200 dark:border-slate-700" />
          <div class="inline-flex items-center gap-2 text-red-600 hover:bg-red-50 dark:text-red-500 interactive-item dark:hover:bg-red-900/50" @click="deleteSelected();hideAllMenus()">
            <div class="i-carbon-trash-can inline-block" />删除
          </div>
          <div class="my-2 border-t border-gray-200 dark:border-slate-700" />
          <div class="inline-flex items-center gap-2 interactive-item">
            <div class="i-carbon-settings inline-block" />属性
          </div>
        </div>

        <!-- --- 边右键菜单 --- -->
        <div
          ref="edgeMenu"
          class="visibility-hidden fixed w-180px border border-gray-200 rounded-lg bg-gray-50 p-2 text-sm font-sans shadow-lg dark:border-slate-700 dark:bg-slate-800 dark:ring-1 dark:ring-slate-700"
          @contextmenu.prevent=""
        >
          <div class="mb-2 p-x-3 p-y-1.5 text-sm text-gray-800 font-semibold dark:text-slate-200">
            边菜单
          </div>
          <div class="mb-2 menu-target-display">
            {{ menuTargetEdges.join(", ") }}
          </div>
          <div class="my-2 border-t border-gray-200 dark:border-slate-700" />
          <div class="inline-flex items-center gap-2 text-red-600 hover:bg-red-50 dark:text-red-500 interactive-item dark:hover:bg-red-900/50" @click="deleteSelected();hideAllMenus()">
            <div class="i-carbon-trash-can inline-block" />删除
          </div>
          <div class="my-2 border-t border-gray-200 dark:border-slate-700" />
          <div class="inline-flex items-center gap-2 interactive-item">
            <div class="i-carbon-settings inline-block" />属性
          </div>
        </div>

        <!-- --- 路径右键菜单 --- -->
        <div
          ref="pathMenu"
          class="visibility-hidden fixed w-180px border border-gray-200 rounded-lg bg-gray-50 p-2 text-sm font-sans shadow-lg dark:border-slate-700 dark:bg-slate-800 dark:ring-1 dark:ring-slate-700"
          @contextmenu.prevent=""
        >
          <div class="mb-2 p-x-3 p-y-1.5 text-sm text-gray-800 font-semibold dark:text-slate-200">
            路径菜单
          </div>
          <div class="mb-2 menu-target-display">
            {{ menuTargetEdges.join(", ") }}
          </div>
          <div class="my-2 border-t border-gray-200 dark:border-slate-700" />
          <div class="inline-flex items-center gap-2 text-red-600 hover:bg-red-50 dark:text-red-500 interactive-item dark:hover:bg-red-900/50" @click="deleteSelected();hideAllMenus()">
            <div class="i-carbon-trash-can inline-block" />删除
          </div>
          <div class="my-2 border-t border-gray-200 dark:border-slate-700" />
          <div class="inline-flex items-center gap-2 interactive-item">
            <div class="i-carbon-settings inline-block" />属性
          </div>
        </div>

        <!-- --- 画布右键菜单 --- -->
        <div
          ref="viewMenu"
          class="visibility-hidden fixed w-180px border border-gray-200 rounded-lg bg-gray-50 p-2 text-sm font-sans shadow-lg dark:border-slate-700 dark:bg-slate-800 dark:ring-1 dark:ring-slate-700"
          @contextmenu.prevent=""
        >
          <div class="mb-2 p-x-3 p-y-1.5 text-sm text-gray-800 font-semibold dark:text-slate-200">
            画布菜单
          </div>
          <div class="mb-2 menu-target-display">
            {{ menuTargetEdges.join(", ") }}
          </div>
          <div class="inline-flex items-center gap-2 interactive-item" @click="addNodeAtMouse(); hideAllMenus()">
            <div class="i-carbon-add-alt inline-block" />节点
          </div>
          <div class="inline-flex items-center gap-2 interactive-item">
            <div class="i-carbon-paste inline-block" />粘贴
          </div>
          <div class="my-2 border-t border-gray-200 dark:border-slate-700" />
          <div class="inline-flex items-center gap-2 text-red-600 hover:bg-red-50 dark:text-red-500 interactive-item dark:hover:bg-red-900/50" @click="deleteSelected();hideAllMenus()">
            <div class="i-carbon-trash-can inline-block" />删除
          </div>
          <div class="my-2 border-t border-gray-200 dark:border-slate-700" />
          <div class="inline-flex items-center gap-2 interactive-item">
            <div class="i-carbon-settings inline-block" />属性
          </div>
        </div>
      </div>

      <!-- 操作按钮浮层 -->
      <div flex="~ col" bg="white/80 dark:slate-800" class="absolute left-4 top-4 z-20 gap-2 rounded-lg p-2 shadow-md">
        <button class="icon-btn-secondary" @click="addNodeAtCenter">
          <div i-carbon-add-alt /> {{ t('editor.toolbar.add_node') }}
        </button>
        <button v-if="!addConnectionMode" class="icon-btn-secondary" @click="addConnectionMode = true">
          <div i-carbon-link /> {{ t('editor.toolbar.add_connection') }}
        </button>
        <button v-else class="icon-btn-primary" @click="addConnectionMode = false">
          <div i-carbon-checkmark /> Finish
        </button>
      </div>

      <!-- Info -->
      <div flex="~" text="sm" bg="white/80 dark:slate-800" class="absolute bottom-0 border-r border-t border-gray-200 rounded-r px-2 dark:border-slate-700">
        {{ actionInfo }}
      </div>
    </div>

    <div class="w-96 overflow-y-auto border-l border-gray-200 bg-gray-50 p-4 shadow-lg dark:border-slate-700 dark:bg-slate-800">
      <NetworkParameterPanel />
    </div>
  </div>
</template>

<route lang="yaml">
meta:
  layout: editor
</route>
