<!-- src/pages/network-editor/[id].vue -->
<script setup lang="ts">
import type { WasmApi } from 'optiedit'
import type { DeviceType, NetworkElement, SimulationConfig, SpanParameters, SpectrumInformation } from '~/types/network'
import type { ContextMenuRequest, NodeMovementBatch } from '~/types/optiedit'
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

// WASM
const wasmApiReadyFlag = ref<boolean>(false)
const wasmApi = ref<WasmApi | null>(null)

// Info
const statusBarInfo = ref<string>('...')

// 添加连接模式
const addConnectionMode = ref(false)

watch((addConnectionMode), async () => {
  if (wasmApi.value) {
    await wasmApi.value.setConnectionMode(addConnectionMode.value)
  }
  if (addConnectionMode.value) {
    statusBarInfo.value = t('editor.status_bar.connect_mode')
  }
  else {
    statusBarInfo.value = t('editor.status_bar.view_mode')
  }
})

// Network graph data (v-network-graph)
const {
  isLoading,
  apiError,
  networkDetail,
} = useNetworkLoader(networkId, false)

// Selected components in graph
const selectedNodes = ref<string[]>([])

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
function showContextMenu(element: HTMLElement, leftPosition: number, rightPosition: number) {
  // 确保在显示新菜单之前，移除旧的监听器
  if (globalContextMenuCloseHandler) {
    document.removeEventListener('pointerdown', globalContextMenuCloseHandler, { capture: true })
    globalContextMenuCloseHandler = null
  }

  // 设置菜单位置和可见性
  element.style.left = `${leftPosition}px`
  element.style.top = `${rightPosition}px`
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

// Component library integration
const {
  getAvailableVarieties,
} = useComponentLibrary()

async function addNodeAtWorld(worldPositionX: number, worldPositionY: number) {
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
    metadata: { location: { x: worldPositionX, y: worldPositionY } },
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

    await wasmApi.value?.createNodeAtPosition(
      worldPositionX,
      worldPositionY,
      res.type,
      res.name,
      res.element_id,
    )

    proxy?.$notify({
      type: 'success',
      message: t('editor.toolbar.add_node_success_message', { node_name: newNodeName, x: worldPositionX.toFixed(1), y: worldPositionY.toFixed(1) }),
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

const contextMenuRequest = ref<ContextMenuRequest | null>(null)

function addNodeAtContextMenu() {
  if (!contextMenuRequest.value) {
    return
  }
  const worldPositionX = contextMenuRequest.value.world_position[0]
  const worldPositionY = contextMenuRequest.value.world_position[1]
  addNodeAtWorld(worldPositionX, worldPositionY)
}

function handleNodeSelected(nodeId: string) {
  if (nodeId === '') {
    selectedNodes.value = []
  }
  else {
    selectedNodes.value = [nodeId]
  }
}

// --- 特定事件处理函数 ---
function handleContextMenuRequest(menuRequest: ContextMenuRequest) {
  // 记录菜单请求
  contextMenuRequest.value = {
    menu_type: menuRequest.menu_type,
    position: menuRequest.position,
    world_position: menuRequest.world_position,
    target_element_id: menuRequest.target_element_id,
    selected_elements: menuRequest.selected_elements,
  }

  if (menuRequest.menu_type === 'empty_space' && viewMenu.value) {
    const canvas = document.getElementById('canvas')
    if (canvas) {
      // WASM返回的屏幕物理像素坐标转换为CSS像素坐标
      const dpr = window.devicePixelRatio || 1
      const cssX = menuRequest.position[0] / dpr
      const cssY = menuRequest.position[1] / dpr

      // 获取Canvas在页面中的位置
      const canvasRect = canvas.getBoundingClientRect()
      const finalX = cssX + canvasRect.left
      const finalY = cssY + canvasRect.top

      showContextMenu(viewMenu.value, finalX, finalY)
    }
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

async function handleNodesMoved(movementBatch: NodeMovementBatch) {
  const validResponses: NetworkElement[] = []

  for (const nodeMove of movementBatch.moved_nodes) {
    const movement = {
      node_id: nodeMove.node_id,
      old_position: { x: nodeMove.old_position.x, y: nodeMove.old_position.y },
      new_position: { x: nodeMove.new_position.x, y: nodeMove.new_position.y },
    }
    try {
      const element = networkDetail.value?.elements.find(el => el.element_id === movement.node_id)
      if (element) {
        const payload = {
          ...element,
          metadata: {
            ...element.metadata,
            location: movement.new_position,
          },
        }
        const response = await elementApi.updateElement(networkId, movement.node_id, payload)
        if (response) {
          validResponses.push(response)
        }
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

  for (const response of validResponses) {
    const index = networkDetail.value?.elements.findIndex(elem => elem.element_id === response.element_id)
    if (networkDetail.value && index !== undefined && index !== -1) {
      networkDetail.value.elements[index].metadata = response.metadata
    }
  }
}

// 节点删除请求回调
async function handleNodeDeleteRequest(deleteRequest: { request_id: string, node_ids: string[], timestamp: number }) {
  const confirmed = await dialog.showConfirm(
    t('editor.delete.confirm_delete_title'),
    `Delete ${deleteRequest.node_ids.length} node(s)?`,
    { confirmButtonText: t('actions.delete_nodes') },
  )
  if (!confirmed) {
    return
  }

  let failedCount = 0
  const initialCount = deleteRequest.node_ids.length

  for (const nodeId of deleteRequest.node_ids) {
    try {
      await elementApi.deleteElement(networkId, nodeId)
      const index = networkDetail.value?.elements.findIndex(elem => elem.element_id === nodeId)
      if (index !== undefined && index !== -1) {
        networkDetail.value?.elements.splice(index, 1)
      }
      if (wasmApi.value) {
        wasmApi.value.confirmNodeDeletion(nodeId)
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

// 连接删除请求回调
async function handleConnectionDeleteRequest(deleteRequest: { request_id: string, connection_ids: string[], timestamp: number }) {
  const confirmed = await dialog.showConfirm(
    t('editor.delete.confirm_delete_title'),
    `Delete ${deleteRequest.connection_ids.length} connection(s)?`,
    { confirmButtonText: t('actions.delete_connections') },
  )
  if (!confirmed) {
    return
  }

  let failedCount = 0
  const initialCount = deleteRequest.connection_ids.length

  for (const edgeId of deleteRequest.connection_ids) {
    try {
      await connectionApi.deleteConnection(networkId, edgeId)
      const index = networkDetail.value?.connections.findIndex(conn => conn.connection_id === edgeId)
      if (index !== undefined && index !== -1) {
        networkDetail.value?.connections.splice(index, 1)
      }
      if (wasmApi.value) {
        wasmApi.value.confirmConnectionDeletion(edgeId)
      }
    }
    catch (err) {
      failedCount++
      console.error(`Failed to delete edge ${edgeId}:`, err)
    }
  }

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

// 连接创建请求回调
async function handleConnectionCreateRequest(createRequest: {
  request_id: string
  from_node_id: string
  to_node_id: string
  connection_type: string
  timestamp: number
}) {
  const payload = { from_node: createRequest.from_node_id, to_node: createRequest.to_node_id }
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
      if (wasmApi.value) {
        wasmApi.value.confirmConnectionCreation({
          created_connection_id: res.connection_id,
          from_node_id: res.from_node,
          to_node_id: res.to_node,
        })
      }
      statusBarInfo.value = t('editor.status_bar.connect_mode_continue')
    }
  }
  catch (err) {
    console.error('Failed to create connection:', err)
    proxy?.$notify({
      type: 'error',
      message: `Failed to create connection`,
    })
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

watch((isLoading), async () => {
  if (isLoading.value) {
    return
  }
  try {
    const wasmEntry = await import('optiedit')
    try {
      wasmEntry.run_web()
    }
    catch (e) {
      // This catch is usually for 'call run_web multiple times', safe to ignore or log
      console.warn('wdmview.run_web called:', e)
    }
    wasmApi.value = await wasmEntry.getWasmApiAsync()
    await wasmApi.value.attachCanvasToDom('canvas')

    // 注册回调函数
    wasmApi.value.registerNodeSelectedCallback(handleNodeSelected)
    wasmApi.value.registerNodesMovedCallback(handleNodesMoved)
    wasmApi.value.registerNodeDeleteRequestCallback(handleNodeDeleteRequest)
    wasmApi.value.registerConnectionDeleteRequestCallback(handleConnectionDeleteRequest)
    wasmApi.value.registerConnectionCreateRequestCallback(handleConnectionCreateRequest)
    wasmApi.value.registerContextMenuRequestCallback(handleContextMenuRequest)

    // if (isDark.value) {
    //   wasmApi.value.setTheme(1)
    // }
    // else {
    //   wasmApi.value.setTheme(0)
    // }

    wasmApi.value.importTopologyFromJson(JSON.stringify(networkDetail.value))

    wasmApiReadyFlag.value = true
  }
  catch (e) {
    console.error('Vue: Error initializing WASM:', e)
  }

  hideAllMenus()
})

// watch((isDark), async () => {
//   if (wasmApi.value) {
//     if (isDark.value) {
//       wasmApi.value.setTheme(1)
//     }
//     else {
//       wasmApi.value.setTheme(0)
//     }
//   }
// })

// --- 组件卸载时清理事件监听器 ---
onUnmounted(() => {
  if (globalContextMenuCloseHandler) {
    document.removeEventListener('pointerdown', globalContextMenuCloseHandler, { capture: true })
  }

  wasmApi.value?.destroyView()
})
</script>

<template>
  <div flex="~" class="h-screen overflow-hidden">
    <!-- Editor Main page -->
    <div flex="grow" class="relative">
      <!-- Overlay -->
      <div
        v-if="isLoading"
        class="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-100"
      >
        <div i-carbon-circle-dash animate-spin text="icon-size-2 blue-60" />
        <span text="blue-60 body01" class="ml-2">{{ t('editor.loading') }}</span>
      </div>

      <!-- API Error -->
      <div
        v-else-if="apiError"
        class="absolute inset-0 flex items-center justify-center bg-red-10 text-red-60 dark:bg-red-90 dark:text-red-30"
      >
        <div i-carbon-warning text="icon-size-2" />
        <span class="ml-2 body01">Error: {{ apiError.message }}</span>
      </div>

      <!-- v-network-graph -->
      <div v-else flex="~ col" class="h-full w-full select-none">
        <div style="flex: 1; position: relative; height: calc(100vh);">
          <canvas id="canvas" style="width: 100%; height: 100%;" />
        </div>

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
          <div class="interactive-item inline-flex items-center gap-2 px-3 py-1.5 hover:bg-gray-20 dark:hover:bg-gray-80" @click="hideAllMenus()">
            <div class="i-carbon-copy inline-block text-gray-80 dark:text-gray-20" />
            <span class="body01 text-gray-100 dark:text-gray-10">{{ t('editor.menu.copy') }}</span>
          </div>
          <div class="interactive-item inline-flex items-center gap-2 px-3 py-1.5 hover:bg-gray-20 dark:hover:bg-gray-80" @click="hideAllMenus()">
            <div class="i-carbon-cut inline-block text-gray-80 dark:text-gray-20" />
            <span class="body01 text-gray-100 dark:text-gray-10">{{ t('editor.menu.cut') }}</span>
          </div>
          <div class="my-2 border-t border-gray-30 dark:border-gray-70" />
          <div class="interactive-item inline-flex items-center gap-2 px-3 py-1.5 text-red-60 hover:bg-red-10 dark:text-red-40 dark:hover:bg-red-90" @click="hideAllMenus()">
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
          <div class="interactive-item inline-flex items-center gap-2 px-3 py-1.5 text-red-60 hover:bg-red-10 dark:text-red-40 dark:hover:bg-red-90" @click="hideAllMenus()">
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
          <div class="interactive-item inline-flex items-center gap-2 px-3 py-1.5 text-red-60 hover:bg-red-10 dark:text-red-40 dark:hover:bg-red-90" @click="hideAllMenus()">
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
          <div class="interactive-item inline-flex items-center gap-2 px-3 py-1.5 hover:bg-gray-20 dark:hover:bg-gray-80" @click="addNodeAtContextMenu();hideAllMenus()">
            <div class="i-carbon-add-alt inline-block text-gray-80 dark:text-gray-20" />
            <span class="body01 text-gray-100 dark:text-gray-10">{{ t('editor.menu.add_node') }}</span>
          </div>
          <div class="interactive-item inline-flex items-center gap-2 px-3 py-1.5 hover:bg-gray-20 dark:hover:bg-gray-80" @click="hideAllMenus()">
            <div class="i-carbon-paste inline-block text-gray-80 dark:text-gray-20" />
            <span class="body01 text-gray-100 dark:text-gray-10">{{ t('editor.menu.paste') }}</span>
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
        <button v-if="!addConnectionMode" class="cds-btn--secondary cds-btn" @click="addConnectionMode = true">
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
