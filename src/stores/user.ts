import { acceptHMRUpdate, defineStore } from 'pinia'

export interface User {
  id: string
  username: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
}

export const useUserStore = defineStore('user', () => {
  // Initialize state from localStorage if available
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const isAuthenticated = computed(() => !!token.value && !!user.value)

  // Load auth state from localStorage on initialization
  const loadAuthState = () => {
    if (typeof window !== 'undefined') {
      const savedToken = localStorage.getItem('auth_token')
      const savedUser = localStorage.getItem('auth_user')

      if (savedToken && savedUser) {
        token.value = savedToken
        try {
          user.value = JSON.parse(savedUser)
        }
        catch (e) {
          console.error('Failed to parse saved user data:', e)
          localStorage.removeItem('auth_user')
          localStorage.removeItem('auth_token')
        }
      }
    }
  }

  // Save auth state to localStorage
  const saveAuthState = () => {
    if (typeof window !== 'undefined') {
      if (token.value && user.value) {
        localStorage.setItem('auth_token', token.value)
        localStorage.setItem('auth_user', JSON.stringify(user.value))
      }
      else {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
      }
    }
  }

  // Login action
  const login = (accessToken: string, userData: User) => {
    token.value = accessToken
    user.value = userData
    saveAuthState()
  }

  // Logout action
  const logout = () => {
    token.value = null
    user.value = null
    saveAuthState()
  }

  // Update user info
  const updateUser = (userData: User) => {
    user.value = userData
    saveAuthState()
  }

  // Initialize on store creation
  loadAuthState()

  return {
    user: readonly(user),
    token: readonly(token),
    isAuthenticated,
    login,
    logout,
    updateUser,
    loadAuthState,
  }
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useUserStore as any, import.meta.hot))
