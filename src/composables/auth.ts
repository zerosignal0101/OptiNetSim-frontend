import type { User } from '~/stores/user'
import { useUserStore } from '~/stores/user'
import { post } from './apiClient'

export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  username: string
  password: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
}

export interface AuthResponse {
  id: string
  username: string
}

/**
 * Authenticate user with username and password
 */
export async function login(credentials: LoginRequest): Promise<void> {
  const response = await post<LoginResponse, LoginRequest>('/auth/login', credentials, false)

  if (response?.access_token) {
    // Get user info after successful login
    const userInfo = await getCurrentUser(response.access_token)
    if (userInfo) {
      const userStore = useUserStore()
      userStore.login(response.access_token, userInfo)
    }
  }
  else {
    throw new Error('Login failed: No access token received')
  }
}

/**
 * Register a new user account
 */
export async function register(userData: RegisterRequest): Promise<void> {
  const response = await post<AuthResponse, RegisterRequest>('/auth/register', userData, false)

  if (response) {
    // Auto-login after successful registration
    await login({
      username: userData.username,
      password: userData.password,
    })
  }
  else {
    throw new Error('Registration failed')
  }
}

/**
 * Get current user information
 */
export async function getCurrentUser(token?: string): Promise<User | null> {
  try {
    // If token is provided, we need to make a manual request since our API client
    // automatically gets token from localStorage
    if (token) {
      const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'
      const response = await fetch(`${BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const userData = await response.json()
        return {
          id: userData.id.toString(),
          username: userData.username,
        }
      }
      return null
    }
    else {
      // Use the API client for authenticated requests
      const response = await get<AuthResponse>('/auth/me')
      if (response) {
        return {
          id: response.id.toString(),
          username: response.username,
        }
      }
      return null
    }
  }
  catch (error) {
    console.error('Failed to get current user:', error)
    return null
  }
}

/**
 * Delete user account
 */
export async function deleteAccount(): Promise<void> {
  const response = await del<string>('/auth/delete')

  if (response !== null) {
    const userStore = useUserStore()
    userStore.logout()
  }
  else {
    throw new Error('Failed to delete account')
  }
}

/**
 * Logout user and clear stored data
 */
export function logout(): void {
  const userStore = useUserStore()
  userStore.logout()
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  const userStore = useUserStore()
  return userStore.isAuthenticated
}

/**
 * Validate current token by attempting to get user info
 */
export async function validateToken(): Promise<boolean> {
  try {
    const userInfo = await getCurrentUser()
    if (userInfo) {
      const userStore = useUserStore()
      userStore.updateUser(userInfo)
      return true
    }
    return false
  }
  catch (error) {
    console.error('Token validation failed:', error)
    // Token is invalid, logout user
    logout()
    return false
  }
}

/**
 * Initialize authentication state on app startup
 */
export async function initializeAuth(): Promise<void> {
  if (typeof window !== 'undefined') {
    const userStore = useUserStore()

    // If we have a token stored, validate it
    if (userStore.token) {
      await validateToken()
    }
  }
}
