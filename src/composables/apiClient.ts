import { useFetch } from '@vueuse/core'

// 定义 BASE_URL，从环境变量中获取，如果没有设置则使用默认值 '/api/v1'
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

/**
 * 这是一个通用的 API 客户端函数，用于执行 HTTP 请求。
 * 它利用 VueUse 的 `useFetch` 模块，自动处理 JSON 数据解析，
 * 并在请求失败或响应状态码非 2xx 时抛出错误。
 *
 * @template T 预期成功响应数据的类型。
 * @template U POST、PATCH 等带有请求体的请求的 payload 类型。
 * @param endpoint API 服务的端点 URL（不包括基础 URL）。
 * @param method HTTP 方法 (例如: 'GET', 'POST', 'DELETE', 'PATCH')。
 * @param payload 请求体数据，适用于 POST、PATCH 方法。该数据会被自动 JSON.stringify 处理。
 * @returns 一个 Promise，它将解析为类型 T 的响应数据。
 *          对于 204 No Content 响应，它将解析为 `null`。
 * @throws 如果网络请求失败或 API 返回非 2xx 状态码，或者 2xx 状态码但 JSON 解析失败，则会抛出错误。
 */
async function executeFetch<T, U = any>(endpoint: string, method: 'GET' | 'POST' | 'DELETE' | 'PATCH', payload?: U): Promise<T | null> {
  // 构建完整的 URL
  const url = `${BASE_URL}${endpoint}`
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      // 可在此处添加其他通用头部，例如认证 token
    },
  }
  // 对于需要请求体的 HTTP 方法 (如 POST, PATCH)，将 payload 转换为 JSON 字符串
  if (payload !== undefined && ['POST', 'PATCH'].includes(method)) {
    options.body = JSON.stringify(payload)
  }
  // 使用 useFetch 发起请求。
  // 注意：这里我们不再直接链式调用 .json<T>()，而是先获取原始响应。
  const { data: _rawResponseRef, error, statusCode, response } = await useFetch(url, options)
  // 1. 检查 useFetch 捕获的错误 (网络问题、非 2xx 状态码等)
  if (error.value) {
    console.error(`API 请求失败 [${method} ${url}, 状态码: ${statusCode.value || 'N/A'}]:`, error.value)
    throw error.value
  }
  // 2. 特殊处理 204 No Content 响应
  // 对于 204 No Content，没有响应体，直接返回 null 表示成功但无数据
  if (statusCode.value === 204) {
    return null as T // 或直接返回 null
  }
  // 3. 处理其他成功的 2xx 响应 (例如 200 OK, 201 Created)，预期有 JSON 响应体
  // 确保 response.value 是一个有效的 Response 对象
  if (response.value instanceof Response) {
    try {
      // 检查响应的 Content-Type 确保它是 JSON
      const contentType = response.value.headers.get('Content-Type')
      if (contentType && contentType.includes('application/json')) {
        // 手动解析 JSON
        const parsedData = await response.value.json()
        return parsedData as T
      }
      else {
        // 如果状态码是 2xx 但不是 204 且 Content-Type 不是 JSON
        // 这表示一个意料之外的响应格式，通常应视为错误或警告
        console.warn(`API 响应成功但内容类型非 JSON [${method} ${url}, 状态码: ${statusCode.value}, Content-Type: ${contentType || 'N/A'}]`)
        // 根据你的业务逻辑，你可以选择：
        // a) 抛出错误，因为预期是 JSON
        throw new Error(`Expected JSON response, but received '${contentType || 'N/A'}' for status ${statusCode.value}`)
        // b) 返回 null 或一个默认值（如果这种情况是可接受的）
        // return null as T;
      }
    }
    catch (jsonParseError: any) {
      // 捕获 JSON 解析过程中可能发生的错误 (例如，响应体不是有效的 JSON)
      console.error(`API 响应 JSON 解析失败 [${method} ${url}, 状态码: ${statusCode.value}]:`, jsonParseError)
      throw new Error(`Failed to parse JSON response: ${jsonParseError.message}`)
    }
  }
  else {
    // 理论上，如果 error.value 已经处理过，这里不应该被触发
    // 这可能意味着 useFetch 完成了，但 response 对象不可用
    console.error(`API 请求完成但未获得有效的响应对象 [${method} ${url}, 状态码: ${statusCode.value}]`)
    throw new Error('No valid response object received after successful fetch.')
  }
}

/**
 * 执行 GET 请求。
 * @template T 预期响应数据的类型。
 * @param endpoint API 端点 URL（不包括基础 URL）。
 * @returns 包含响应数据的 Promise。
 */
export function get<T>(endpoint: string): Promise<T | null> {
  return executeFetch<T>(endpoint, 'GET')
}

/**
 * 执行 POST 请求。
 * @template T 预期响应数据的类型。
 * @template U 请求体的类型。
 * @param endpoint API 端点 URL（不包括基础 URL）。
 * @param payload 请求体数据。
 * @returns 包含响应数据的 Promise。
 */
export function post<T, U>(endpoint: string, payload: U): Promise<T | null> {
  return executeFetch<T, U>(endpoint, 'POST', payload)
}

/**
 * 执行 DELETE 请求。
 * @template T 预期响应数据的类型 (通常是空或一个表示成功的对象)。
 * @param endpoint API 端点 URL（不包括基础 URL）。
 * @returns 包含响应数据的 Promise。
 */
export function del<T>(endpoint: string): Promise<T | null> {
  return executeFetch<T>(endpoint, 'DELETE')
}

/**
 * 执行 PATCH 请求。
 * @template T 预期响应数据的类型。
 * @template U 请求体的类型。
 * @param endpoint API 端点 URL（不包括基础 URL）。
 * @param payload 请求体数据。
 * @returns 包含响应数据的 Promise。
 */
export function patch<T, U>(endpoint: string, payload: U): Promise<T | null> {
  return executeFetch<T, U>(endpoint, 'PATCH', payload)
}
