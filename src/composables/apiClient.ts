// src/composables/apiClient.ts

import type { UseFetchOptions } from '@vueuse/core'
import type { ApiErrorResponse, CustomApiError } from '~/types/api'

// API 基础 URL
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

// 定义一个通用的响应类型，包含数据和可能的错误
interface ApiResponse<T> {
  data: Ref<T | null>
  isFetching: Ref<boolean>
  error: Ref<CustomApiError | null>
  execute: (throwOnFailedFetch?: boolean) => Promise<void>
  response: Ref<Response | null> // 暴露原始响应，可能有用
}

/**
 * 封装 VueUse 的 useFetch，用于处理通用 API 请求。
 * 自动处理 JSON 序列化、错误解析和基本请求配置。
 *
 * @param url API 路径，不包含 BASE_URL
 * @param options useFetch 的配置项
 * @returns 包含 data, isFetching, error, execute 的响应对象
 */
export function useApiFetch<T>(
  url: string,
  options?: UseFetchOptions,
): ApiResponse<T> {
  const fullUrl = `${BASE_URL}${url}`
  const customError = ref<CustomApiError | null>(null) // 自定义错误对象

  // 使用 useFetch 获取原始响应数据 (通常是文本)
  const {
    data: rawData, // 原始响应数据，Ref<string | null>
    isFetching,
    error: fetchError, // useFetch 自身的错误 Ref (网络错误、超时等)
    execute,
    response, // 原始 Response 对象
  } = useFetch<string>(fullUrl, { // 明确指定 useFetch 接收的类型为 string
    immediate: false, // 默认不立即执行
    refetch: true, // 默认允许重新请求
    // 移除 responseType: 'json'，我们自己手动解析
    ...options, // 覆盖默认配置

    // 请求拦截器
    beforeFetch({ options, url }) {
      if (!options.headers) {
        options.headers = {}
      }
      // 确保发送的 Content-Type 是 application/json
      ;(options.headers as Record<string, string>)['Content-Type'] = 'application/json'

      // 处理 POST/PUT/PATCH 请求体，自动 JSON 序列化
      if (options.body && typeof options.body === 'object') {
        options.body = JSON.stringify(options.body)
      }

      console.warn(`[API] Fetching ${options.method || 'GET'}: ${url}`)
      return { options, url }
    },
    // 移除 afterFetch 和 onFetchError，改为通过 watcher 处理更灵活的逻辑
  })

  // 创建一个计算属性来手动解析 rawData
  const parsedData = computed<T | null>(() => {
    if (isFetching.value || rawData.value === null) {
      return null // 数据还在加载中或为空
    }
    if (typeof rawData.value === 'string') {
      try {
        const parsed = JSON.parse(rawData.value)
        // 成功解析后，清除可能的 JSON_PARSE_ERROR
        if (customError.value?.code === 'CLIENT_JSON_PARSE_ERROR') {
          customError.value = null
        }
        return parsed as T
      }
      catch (e) {
        console.error('Failed to parse raw data as JSON:', e, rawData.value)
        // 设置一个自定义的 JSON 解析错误
        customError.value = {
          code: 'CLIENT_JSON_PARSE_ERROR',
          message: `Failed to parse API response as JSON: ${(e as Error).message}`,
          httpStatus: response.value?.status,
        }
        return null // 返回 null 表示数据解析失败
      }
    }
    // 如果 rawData 已经是对象类型（例如，useFetch 在某些情况下自行解析了）
    return rawData.value as T
  })

  // 监听 useFetch 的原始错误 (网络中断, CORS, 超时等)
  watch(fetchError, (newError) => {
    if (newError) {
      customError.value = {
        code: 'FETCH_ERROR',
        message: newError.message || 'An unknown network error occurred.',
        httpStatus: response.value?.status, // 如果有 HTTP 状态，也带上
      }
    }
    else if (!newError && response.value?.ok) {
      // 如果 fetchError 消失且响应成功，清除此类型的错误
      if (customError.value?.code === 'FETCH_ERROR') {
        customError.value = null
      }
    }
  }, { immediate: true }) // 立即运行一次以处理初始状态

  // 监听原始 Response 对象，处理 HTTP 状态码错误和 API 统一错误格式
  watch(response, async (newResponse) => {
    if (!newResponse)
      return

    if (newResponse.ok) {
      // 响应成功，清除所有自定义错误
      customError.value = null
    }
    else {
      // 处理非 2xx 状态码
      console.error(`[API Error] HTTP Status: ${newResponse.status}, URL: ${newResponse.url}`)
      const errorDetails: CustomApiError = {
        code: 'HTTP_ERROR',
        message: newResponse.statusText || 'An unknown HTTP error occurred.',
        httpStatus: newResponse.status,
      }

      try {
        // 尝试解析错误响应体为 JSON (使用 .clone() 避免流被消耗)
        const errorBody = await newResponse.clone().json() as ApiErrorResponse
        if (errorBody?.detail) {
          // 符合统一错误格式
          errorDetails.code = errorBody.detail.code || 'API_ERROR'
          errorDetails.message = errorBody.detail.message
          errorDetails.details = errorBody.detail.details
        }
        else {
          // 不符合统一格式但有 JSON 体，使用其 message
          errorDetails.message = (errorBody as any)?.message || newResponse.statusText || 'An API error occurred.'
        }
      }
      catch (e) {
        // 如果错误响应体不是有效的 JSON，使用 HTTP 状态文本
        console.warn('Could not parse error response as JSON:', e)
        errorDetails.message = newResponse.statusText || 'An API error occurred (could not parse error response).'
      }
      customError.value = errorDetails
    }
  }, { immediate: true }) // 立即运行一次以处理初始状态

  return {
    data: parsedData, // 返回我们手动解析后的数据
    isFetching,
    error: customError, // 返回自定义的错误对象
    execute,
    response,
  }
}

// 辅助函数（post, get, patch, del）保持不变，它们会调用 useApiFetch
export function post<TResponse, TPayload>(url: string, payload: TPayload, options?: UseFetchOptions): ApiResponse<TResponse> {
  return useApiFetch<TResponse>(url, { method: 'POST', body: payload, ...options })
}

export function get<TResponse>(url: string, options?: UseFetchOptions): ApiResponse<TResponse> {
  return useApiFetch<TResponse>(url, { method: 'GET', ...options })
}

export function patch<TResponse, TPayload>(url: string, payload: TPayload, options?: UseFetchOptions): ApiResponse<TResponse> {
  return useApiFetch<TResponse>(url, { method: 'PATCH', body: payload, ...options })
}

export function del<TResponse>(url: string, options?: UseFetchOptions): ApiResponse<TResponse> {
  return useApiFetch<TResponse>(url, { method: 'DELETE', ...options })
}
