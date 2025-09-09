// src/types/api.ts (更新或创建)

import type { LibraryListItem } from '~/types/library'
import type { NetworkConnection, NetworkElement, NetworkListItem, NetworkService, SimulationConfig, SpanParameters, SpectrumInformation } from '~/types/network'

// --- 通用 API 类型 ---

// API 错误响应的详细结构
export interface ApiErrorDetail {
  code: string
  message: string
  details?: Record<string, any> // 可选：提供更多错误细节
}

// 统一的 API 错误响应格式
export interface ApiErrorResponse {
  detail: ApiErrorDetail
}

// 在应用中使用的错误对象，更简洁
export interface CustomApiError {
  code: string
  message: string
  details?: Record<string, any>
  httpStatus?: number // 增加HTTP状态码以便调试
}

// --- 业务响应类型 ---

export interface NetworkListResponse {
  networks: NetworkListItem[]
  total_count: number
  page: number
  limit: number
}

export interface LibraryListResponse extends Array<LibraryListItem> {} // API returns array directly

// --- 请求 Payload 类型 ---

export interface CreateNetworkPayload {
  network_name: string
}

export interface UpdateNetworkPayload {
  network_name?: string // PATCH 请求，所以都是可选的
}

export interface AddElementPayload {
  name: string
  type: NetworkElement['type']
  type_variety?: string
  params: Record<string, any>
  operational: Record<string, any>
  metadata?: Record<string, any>
}

export interface UpdateElementPayload {
  name?: string
  type?: NetworkElement['type']
  type_variety?: string
  params: Record<string, any>
  operational: Record<string, any>
  metadata?: Record<string, any>
}

export interface CreateConnectionPayload {
  from_node: string
  to_node: string
}

export interface UpdateSimulationConfigPayload {
  raman_params?: SimulationConfig['raman_params']
  nli_params?: SimulationConfig['nli_params']
}

export interface UpdateSpectrumInformationPayload extends Partial<SpectrumInformation> {}

export interface UpdateSpanParametersPayload extends Partial<SpanParameters> {}

export interface CreateServicePayload {
  name: string
  path: string[] // Element IDs
  service_requirements?: NetworkService['service_requirements']
  service_constraints?: NetworkService['service_constraints']
}

export interface UpdateServicePayload extends Partial<CreateServicePayload> {
  status?: NetworkService['status']
}

export interface ImportNetworkPayload {
  network_name: string
  elements: Array<Partial<NetworkElement>> // elements 的 element_id 可能是临时ID
  connections: Array<Partial<NetworkConnection>> // from_node/to_node 引用临时ID
  services: Array<Partial<NetworkService>> // services 结构可能需要更具体
  SI?: SpectrumInformation
  Span?: SpanParameters
  simulation_config?: SimulationConfig
  // equipment_libraries?: EquipmentLibraryDetail[]; // 如果导出包含设备库，导入也可能需要
}

export interface InsertTopologyPayload {
  elements: Array<Partial<NetworkElement>>
  connections: Array<Partial<NetworkConnection>>
  strategy?: 'generate_new_id' | 'error' // ID 冲突解决策略
}

// --- 响应数据类型别名 (方便函数签名) ---
export type NetworkID = string
export type ElementID = string
export type ConnectionID = string
export type ServiceID = string
