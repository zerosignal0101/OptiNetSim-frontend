// src/composables/elementApi.ts

import type {
  AddElementPayload,
  ElementID,
  NetworkID,
  UpdateElementPayload,
} from '~/types/api'
import type {
  NetworkElement,
} from '~/types/network'
import { del, get, patch, post } from './apiClient'

// 拓扑节点管理
export const elementApi = {
  /**
   * 1. 添加拓扑节点
   * @param networkId 目标光网络的唯一标识符
   * @param payload 节点数据
   */
  addElement(networkId: NetworkID, payload: AddElementPayload) {
    return post<NetworkElement, AddElementPayload>(`/networks/${networkId}/elements`, payload)
  },

  /**
   * 2. 读取指定拓扑节点
   * @param networkId 目标光网络的唯一标识符
   * @param elementId 目标拓扑节点的唯一标识符
   */
  getElement(networkId: NetworkID, elementId: ElementID) {
    return get<NetworkElement>(`/networks/${networkId}/elements/${elementId}`)
  },

  /**
   * 3. 修改拓扑节点
   * @param networkId 目标光网络的唯一标识符
   * @param elementId 目标拓扑节点的唯一标识符
   * @param payload 要更新的节点数据
   */
  updateElement(networkId: NetworkID, elementId: ElementID, payload: UpdateElementPayload) {
    return patch<NetworkElement, UpdateElementPayload>(`/networks/${networkId}/elements/${elementId}`, payload)
  },

  /**
   * 4. 删除拓扑节点
   * @param networkId 目标光网络的唯一标识符
   * @param elementId 目标拓扑节点的唯一标识符
   */
  deleteElement(networkId: NetworkID, elementId: ElementID) {
    return del<null>(`/networks/${networkId}/elements/${elementId}`)
  },
}
