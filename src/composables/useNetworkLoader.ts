import type { Edges, Layouts, Nodes, Paths } from 'v-network-graph'
import type { NetworkDetail } from '~/types/network'
import { networkApi } from '~/composables/networkApi'

export function useNetworkLoader(networkId: string, minimized: boolean) {
  const isLoading = ref<boolean>(true)
  const apiError = ref<Error | null>(null)
  const networkDetail = ref<NetworkDetail | null>(null)

  const nodes = computed<Nodes>(() => {
    if (!networkDetail.value)
      return {}
    return networkDetail.value.elements.reduce<Nodes>((acc, el) => {
      acc[el.element_id] = {
        name: el.name,
        type: el.type,
      }
      return acc
    }, {})
  })
  const edges = computed<Edges>(() => {
    if (!networkDetail.value)
      return {}
    return networkDetail.value.connections.reduce<Edges>((acc, conn) => {
      acc[conn.connection_id] = {
        source: conn.from_node,
        target: conn.to_node,
      }
      return acc
    }, {})
  })
  const paths = computed<Paths>(() => {
    if (networkDetail.value == null)
      return {}
    return networkDetail.value.services.reduce<Paths>((acc, service) => {
      const edgeIds: string[] = []
      if (service.path) {
        for (let i = 0; i < service.path.length - 1; i++) {
          const fromNodeId = service.path[i]
          const toNodeId = service.path[i + 1]
          const connection = networkDetail.value!.connections.find(
            conn =>
              (conn.from_node === fromNodeId && conn.to_node === toNodeId)
              || (conn.from_node === toNodeId && conn.to_node === fromNodeId),
          )
          if (connection) {
            edgeIds.push(connection.connection_id)
          }
          else {
            break
          }
        }
      }
      acc[service.service_id] = { edges: edgeIds }
      return acc
    }, {})
  })
  // 3. 特殊处理: Layouts 保持为 reactive 以保留用户交互状态
  const layouts = reactive<Layouts>({ nodes: {} })
  // 4. 使用 watch 来智能更新 layouts
  watch(networkDetail, (newDetail) => {
    if (!newDetail) {
      // 如果数据被清空，也清空布局
      layouts.nodes = {}
      return
    }
    const newLayoutsNodes: Layouts['nodes'] = {}
    const existingLayoutNodes = layouts.nodes
    newDetail.elements.forEach((el) => {
      // 如果 API 提供了位置，则使用它 (覆盖旧的)
      if (el.metadata?.location) {
        if (minimized) {
          newLayoutsNodes[el.element_id] = { x: el.metadata.location.x, y: -el.metadata.location.y }
        }
        else {
          newLayoutsNodes[el.element_id] = { x: el.metadata.location.x, y: el.metadata.location.y }
        }
      }
      // 如果节点已经存在布局（例如用户拖动过），则保留它
      else if (existingLayoutNodes[el.element_id]) {
        newLayoutsNodes[el.element_id] = existingLayoutNodes[el.element_id]
      }
      // 如果是全新节点，没有提供位置，则赋一个随机位置
      else {
        newLayoutsNodes[el.element_id] = { x: Math.random() * 800, y: Math.random() * 600 }
      }
    })
    // 直接用新计算的布局替换旧的，实现了节点的添加、保留和删除
    layouts.nodes = newLayoutsNodes
  }, { deep: true }) // deep watch 可以在 networkDetail 内部变化时触发

  // 加载数据
  async function load() {
    isLoading.value = true
    apiError.value = null
    try {
      if (minimized) {
        const response = await networkApi.getMinimizedNetwork(networkId)
        networkDetail.value = response
      }
      else {
        const response = await networkApi.getNetwork(networkId)
        networkDetail.value = response
      }
    }
    catch (error) {
      apiError.value = error as Error
    }
    finally {
      isLoading.value = false
    }
  }

  onMounted(() => {
    load()
  })

  return {
    isLoading,
    apiError,
    networkDetail,
    nodes,
    edges,
    paths,
    layouts,
  }
}
