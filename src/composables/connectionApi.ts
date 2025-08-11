// src/composables/connectionApi.ts

import type {
  ConnectionID,
  CreateConnectionPayload,
  NetworkID,
} from '~/types/api'
import type {
  NetworkConnection,
} from '~/types/network'
import { del, get, post } from './apiClient'

// 拓扑节点连接关系管理
export const connectionApi = {
  /**
   * 1. 创建连接
   * @param networkId 目标光网络的唯一标识符
   * @param payload 连接起点和终点节点ID
   */
  createConnection(networkId: NetworkID, payload: CreateConnectionPayload) {
    return post<NetworkConnection, CreateConnectionPayload>(`/networks/${networkId}/connections`, payload)
  },

  /**
   * 2. 读取指定连接
   * @param networkId 目标光网络的唯一标识符
   * @param connectionId 目标连接的唯一标识符
   */
  getConnection(networkId: NetworkID, connectionId: ConnectionID) {
    return get<NetworkConnection>(`/networks/${networkId}/connections/${connectionId}`)
  },

  /**
   * 3. 删除连接
   * @param networkId 目标光网络的唯一标识符
   * @param connectionId 目标连接的唯一标识符
   */
  deleteConnection(networkId: NetworkID, connectionId: ConnectionID) {
    return del<null>(`/networks/${networkId}/connections/${connectionId}`)
  },
}
