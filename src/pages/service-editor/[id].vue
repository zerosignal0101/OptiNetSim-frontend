<!-- src/pages/network-editor/[id].vue -->
<script setup lang="ts">
import type * as vNG from 'v-network-graph'
import type { EventHandlers } from 'v-network-graph' // 导入类型
import type { WatchHandle } from 'vue'
import type { NetworkService } from '~/types/network'
import { VNetworkGraph } from 'v-network-graph'
import { useDialog } from '~/composables/useDialog'
import { useNetworkLoader } from '~/composables/useNetworkLoader'

const dialog = useDialog()

// Router
const route = useRoute('/service-editor/[id]')
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
const configs = computed(() => getGraphConfig(isDark.value, true))
const minimized = true
const {
  isLoading,
  apiError,
  networkDetail,
  nodes,
  edges,
  paths,
  layouts,
} = useNetworkLoader(networkId, minimized)

const graph = ref<vNG.Instance | null>(null) // 新增：VNetworkGraph 组件的引用

// Selected components in graph
const selectedNodes = ref<string[]>([])
const selectedEdges = ref<string[]>([])
const selectedPaths = ref<string[]>([])

// Info
const statusBarInfo = ref<string>('...')

// --- 菜单refs ---
const viewMenu = ref<HTMLDivElement>()
const nodeMenu = ref<HTMLDivElement>()
const edgeMenu = ref<HTMLDivElement>()
const pathMenu = ref<HTMLDivElement>()

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

// --- 特定事件处理函数 ---
function showViewContextMenu(params: vNG.ViewEvent<MouseEvent>) {
  const { event } = params
  event.stopPropagation()
  event.preventDefault() // 禁用浏览器默认上下文菜单
  if (viewMenu.value) {
    showContextMenu(viewMenu.value, event)
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
    selectedPaths.value = [path]
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
        const source_id = connectionNodeId.value
        const destination_id = newSelection[0]
        const name = await dialog.showPrompt('Add service', 'Service name')
        if (!name)
          return
        const payload = { name, source_id, destination_id }
        try {
          const res = await serviceApi.createService(networkId, payload)
          if (res === null) {
            proxy?.$notify({
              type: 'error',
              message: 'Failed to create connection: Null resp.',
            })
          }
          else {
            networkDetail.value?.services.push(res)
            connectionNodeId.value = newSelection[0]
            selectedPaths.value = [res.service_id]
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

async function handleServiceUpdate(service: NetworkService) {
  try {
    const updatedService = await serviceApi.updateService(networkId, service.service_id, service)
    if (updatedService && networkDetail) {
      const index = networkDetail.value?.services.findIndex(srv => srv.service_id === updatedService.service_id)
      if (index && index !== -1) {
        networkDetail.value!.services[index] = updatedService
      }
    }
  }
  catch (err) {
    console.error(`Failed to update service ${service.service_id}:`, err)
  }
}

function handleServiceSelect(serviceId: string) {
  selectedPaths.value = [serviceId]
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
        />

        <!-- 操作按钮浮层 -->
        <div flex="~ col" bg="white dark:gray-100" class="absolute left-4 top-4 z-20 gap-2 rounded-md p-2 shadow-md">
          <button v-if="!addConnectionMode" class="cds-btn cds-btn--secondary" @click="addConnectionMode = true">
            <div i-carbon-ibm-private-path-services class="mr-1" /> {{ t('editor.toolbar.add_connection') }}
          </button>
          <button v-else class="cds-btn cds-btn--primary" @click="addConnectionMode = false">
            <div i-carbon-checkmark class="mr-1" /> {{ t('editor.toolbar.finish_connection') }}
          </button>
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
          <div class="my-2 border-t border-gray-30 dark:border-gray-70" />
          <div class="interactive-item inline-flex items-center gap-2 px-3 py-1.5 text-red-60 hover:bg-red-10 dark:text-red-40 dark:hover:bg-red-90" @click="deleteSelectedPaths();hideAllMenus()">
            <div class="i-carbon-trash-can inline-block" />
            <span class="body01">{{ t('editor.menu.delete') }}</span>
          </div>
          <div class="my-2 border-t border-gray-30 dark:border-gray-70" />
          <div class="interactive-item inline-flex items-center gap-2 px-3 py-1.5 hover:bg-gray-20 dark:hover:bg-gray-80">
            <div class="i-carbon-settings inline-block text-gray-80 dark:text-gray-20" />
            <span class="body01 text-gray-100 dark:text-gray-10">{{ t('editor.menu.properties') }}</span>
          </div>
        </div>

        <!-- Info -->
        <div
          flex="~" text="caption02" bg="white dark:gray-100"
          class="absolute bottom-0 border-r border-t border-gray-30 rounded-r px-3 py-1 dark:border-gray-70"
        >
          {{ statusBarInfo }}
        </div>
      </div>
    </div>
    <div class="w-92 overflow-y-auto border-l border-gray-30 shadow-md dark:border-gray-70">
      <ServiceParameterPanel
        :is-loading="isLoading"
        :selected-paths="selectedPaths"
        :network-detail="networkDetail"
        @update:service="handleServiceUpdate"
        @update:selection="handleServiceSelect"
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
