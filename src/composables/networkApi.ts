// src/composables/networkApi.ts

import type {
  CreateNetworkPayload,
  ImportNetworkPayload,
  InsertTopologyPayload,
  NetworkID,
  NetworkListResponse,
  UpdateNetworkPayload,
  UpdateSimulationConfigPayload,
  UpdateSpanParametersPayload,
  UpdateSpectrumInformationPayload,
} from '~/types/api'
import type {
  NetworkDetail,
  NetworkListItem, // 用于导入响应
  SimulationConfig,
  SimulationResult, // 用于设置响应
  SpanParameters, // 用于设置响应
  SpectrumInformation, // 用于设置响应
} from '~/types/network'
import { del, get, patch, post } from './apiClient'

// 光网络管理
export const networkApi = {
  /**
   * 1. 光网络列表
   * @param params 查询参数
   * @param params.page 页码
   * @param params.limit 限制数量
   * @param params.name_contains 名称包含
   * @param params.sort_by 排序字段
   * @param params.order 排序顺序
   */
  getNetworks(params?: {
    page?: number
    limit?: number
    name_contains?: string
    sort_by?: 'created_at' | 'updated_at' | 'network_name'
    order?: 'asc' | 'desc'
  }) {
    const query = new URLSearchParams()
    if (params) {
      for (const key in params) {
        if (params[key as keyof typeof params] !== undefined) {
          query.append(key, String(params[key as keyof typeof params]))
        }
      }
    }
    const queryString = query.toString() ? `?${query.toString()}` : ''
    return get<NetworkListResponse>(`/networks${queryString}`)
  },

  /**
   * 2. 读取指定光网络
   * @param networkId 目标光网络的唯一标识符
   */
  getNetwork(networkId: NetworkID) {
    return get<NetworkDetail>(`/networks/${networkId}`)
  },

  getMinimizedNetwork(networkId: NetworkID) {
    return get<NetworkDetail>(`/networks/${networkId}/minimized`)
  },

  /**
   * 3. 创建新的光网络
   * @param payload 新光网络的名称
   */
  createNetwork(payload: CreateNetworkPayload) {
    return post<NetworkListItem, CreateNetworkPayload>('/networks', payload)
  },

  /**
   * 4. 修改指定光网络标题
   * @param networkId 目标光网络的唯一标识符
   * @param payload 新的光网络名称
   */
  updateNetwork(networkId: NetworkID, payload: UpdateNetworkPayload) {
    return patch<NetworkListItem, UpdateNetworkPayload>(`/networks/${networkId}`, payload)
  },

  /**
   * 5. 删除指定光网络
   * @param networkId 目标光网络的唯一标识符
   */
  deleteNetwork(networkId: NetworkID) {
    // Note: API returns 204 No Content on success, or a JSON error.
    // The apiClient handles this; data will be null on 204.
    return del<null>(`/networks/${networkId}`)
  },

  /**
   * 网络全局设定 - 修改仿真全局设定
   * @param networkId 目标光网络的唯一标识符
   * @param payload 仿真配置
   */
  updateSimulationConfig(networkId: NetworkID, payload: UpdateSimulationConfigPayload) {
    return patch<SimulationConfig, UpdateSimulationConfigPayload>(`/networks/${networkId}/simulation-config`, payload)
  },

  /**
   * 网络全局设定 - 修改频谱信息 (SI)
   * @param networkId 目标光网络的唯一标识符
   * @param payload 频谱信息
   */
  updateSpectrumInformation(networkId: NetworkID, payload: UpdateSpectrumInformationPayload) {
    return patch<SpectrumInformation, UpdateSpectrumInformationPayload>(`/networks/${networkId}/spectrum-information`, payload)
  },

  /**
   * 网络全局设定 - 修改跨段参数 (Span)
   * @param networkId 目标光网络的唯一标识符
   * @param payload 跨段参数
   */
  updateSpanParameters(networkId: NetworkID, payload: UpdateSpanParametersPayload) {
    return patch<SpanParameters, UpdateSpanParametersPayload>(`/networks/${networkId}/span-parameters`, payload)
  },

  /**
   * 导入与导出 - 网络导出
   * @param networkId 目标光网络的唯一标识符
   */
  exportNetwork(networkId: NetworkID) {
    // Note: The response structure is similar to NetworkDetail but might omit some internal fields.
    // Assuming it matches NetworkDetail for now, adjust if necessary.
    return get<NetworkDetail>(`/networks/${networkId}/export`)
  },

  /**
   * 导入与导出 - 网络导入
   * @param payload 导入的网络数据
   */
  importNetwork(payload: ImportNetworkPayload) {
    // API response is just basic network info for the newly created network
    return post<NetworkListItem, ImportNetworkPayload>('/networks/import', payload)
  },

  /**
   * 导入与导出 - 插入拓扑
   * @param networkId 目标光网络的唯一标识符
   * @param payload 要插入的拓扑数据
   */
  insertTopology(networkId: NetworkID, payload: InsertTopologyPayload) {
    // API response is basic network info for the updated target network
    return post<NetworkListItem, InsertTopologyPayload>(`/networks/${networkId}/import`, payload)
  },

  /**
   * 仿真 - 单链路仿真
   * @param networkId 目标光网络的唯一标识符
   * @param payload 仿真的节点对
   */
  simulateNetwork(networkId: NetworkID, payload: any) {
    // API response is basic network info for the updated target network
    return post<SimulationResult, any>(`/networks/${networkId}/single-link`, payload)
  },

  /**
   * 分配 - KSP + 随机分配业务
   * @param networkId 目标光网络的唯一标识符
   * @param payload 仿真的节点对
   */
  allocateKSPNetwork(networkId: NetworkID, payload: any) {
    // API response is basic network info for the updated target network
    return post<any, any>(`/networks/${networkId}/ksp_only`, payload)
  },

  /**
   * 碎片整理 - 网络碎片整理
   * @param networkId 目标光网络的唯一标识符
   * @param payload 碎片整理参数
   */
  defragNetwork(networkId: NetworkID, payload: any) {
    // API response is basic network info for the updated target network
    return post<any, any>(`/networks/${networkId}/defrag`, payload)
  },
}
