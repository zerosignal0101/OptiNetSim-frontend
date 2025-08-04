// src/composables/serviceApi.ts

import type {
  CreateServicePayload,
  DeleteResponse,
  NetworkID,
  ServiceID,
  UpdateServicePayload,
} from '~/types/api'
import type {
  NetworkService,
} from '~/types/network'
import { del, get, patch, post } from './apiClient'

// 服务管理 (WIP)
export const serviceApi = {
  /**
   * 1. 列出指定网络的服务
   * @param networkId 目标光网络的唯一标识符
   */
  getServices(networkId: NetworkID) {
    return get<{ services: NetworkService[] }>(`/networks/${networkId}/services`)
  },

  /**
   * 2. 创建服务
   * @param networkId 目标光网络的唯一标识符
   * @param payload 服务数据
   */
  createService(networkId: NetworkID, payload: CreateServicePayload) {
    return post<NetworkService, CreateServicePayload>(`/networks/${networkId}/services`, payload)
  },

  /**
   * 3. 读取指定服务
   * @param networkId 目标光网络的唯一标识符
   * @param serviceId 目标服务的唯一标识符
   */
  getService(networkId: NetworkID, serviceId: ServiceID) {
    return get<NetworkService>(`/networks/${networkId}/services/${serviceId}`)
  },

  /**
   * 4. 更新指定服务
   * @param networkId 目标光网络的唯一标识符
   * @param serviceId 目标服务的唯一标识符
   * @param payload 要更新的服务数据
   */
  updateService(networkId: NetworkID, serviceId: ServiceID, payload: UpdateServicePayload) {
    return patch<NetworkService, UpdateServicePayload>(`/networks/${networkId}/services/${serviceId}`, payload)
  },

  /**
   * 5. 删除指定服务
   * @param networkId 目标光网络的唯一标识符
   * @param serviceId 目标服务的唯一标识符
   */
  deleteService(networkId: NetworkID, serviceId: ServiceID) {
    return del<DeleteResponse>(`/networks/${networkId}/services/${serviceId}`)
  },
}
