import type { UseFetchOptions } from '#app';
import { useFetch } from '#app';
import { ElMessage } from 'element-plus';
import { defu } from 'defu';

export function useApi(
  url: string | (() => string),
  options: UseFetchOptions<any> = {}
) {
  const config = useRuntimeConfig();
  const defaultOptions: UseFetchOptions<any> = {
    baseURL: config.public.apiBase as string,
    //credentials: 'include', // Include if your API needs cookies/auth headers
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },

    // Centralized error handling
    async onResponseError({ request, response, options }) {
      console.error('API Error:', response.status, response._data);
      ElMessage.error(`API Error ${response.status}: ${response._data?.message || response._data?.detail || 'Request failed'}`);
      // You could potentially throw an error here to be caught by the caller
      // throw new Error(`API Error ${response.status}`);
    },

    // You can add onRequest to log requests or add auth tokens automatically
    // onRequest({ request, options }) {
    //   const token = useCookie('auth_token'); // Example auth token
    //   if (token.value) {
    //     options.headers = options.headers || {};
    //     (options.headers as Record<string, string>).Authorization = `Bearer ${token.value}`;
    //   }
    // }
  };

  // Merge default options with provided options
  const mergedOptions = defu(options, defaultOptions);

  return useFetch(url, defaultOptions);
}

// Helper for non-GET requests with automatic body stringification
export function useApiPost<ReqT extends Record<string, any> | string | FormData | ArrayBuffer | Blob | ReadableStream, ResT>(
  url: string | (() => string),
  payload: ReqT,
  options: UseFetchOptions<any> = {}
) {
  return useApi(url, {
    method: 'POST',
    body: payload,
    ...options,
  });
}


export function useApiPut<ReqT extends Record<string, any> | string | FormData | ArrayBuffer | Blob | ReadableStream, ResT>(
  url: string | (() => string),
  payload: ReqT,
  options: UseFetchOptions<any> = {}
) {
  return useApi(url, {
    method: 'PUT',
    body: payload,
    ...options,
  });
}


export function useApiDelete<ResT>(
  url: string | (() => string),
  options: UseFetchOptions<any> = {}
) {
  return useApi(url, {
    method: 'DELETE',
    ...options,
  });
}
