import type { UseFetchOptions } from '#app';
import { useFetch } from '#app';
import { ElMessage } from 'element-plus';
import { defu } from 'defu';

export function useApi<T>(
  url: string | (() => string) | ComputedRef<string>,  // 添加 ComputedRef<string>
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

  // Add response transformation
  const transform = (res: any): T => {
    // Basic validation - you can extend this with more complex validation
    if (!res) {
      throw new Error('Empty response from API');
    }
    
    // Here you can add your validation logic
    // For example, if you're using Zod for validation:
    // const validatedData = yourSchema.parse(res);
    // return validatedData;
    
    // For now, just type assertion
    return res as T;
  };
  const res = useFetch(url, {
    ...mergedOptions,
    transform,
  });
  // Return the typed response
  return res as ReturnType<typeof useFetch<T>>;
}

// Helper for non-GET requests with automatic body stringification
export function useApiPost<ReqT extends Record<string, any> | string | FormData | ArrayBuffer | Blob | ReadableStream, ResT>(
  url: string | (() => string),
  payload: ReqT,
  options: UseFetchOptions<any> = {}
) {
  return useApi<ResT>(url, {
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
  return useApi<ResT>(url, {
    method: 'PUT',
    body: payload,
    ...options,
  });
}


export function useApiDelete<ResT>(
  url: string | (() => string),
  options: UseFetchOptions<any> = {}
) {
  return useApi<ResT>(url, {
    method: 'DELETE',
    ...options,
  });
}
