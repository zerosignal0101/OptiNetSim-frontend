import type { UserModule } from '~/types'
import { isAuthenticated } from '~/composables/auth'
import { useUserStore } from '~/stores/user'

// Protected routes that require authentication
const PROTECTED_ROUTES = [
  '/network-management',
  '/network-editor',
  '/service-editor',
  '/simulation-editor',
  '/defrag',
]

export const install: UserModule = ({ router, isClient }: { router: any, isClient: boolean }) => {
  // Global navigation guard
  router.beforeEach((to: any, from: any, next: any) => {
    // Only run on client-side
    if (!isClient) {
      next()
      return
    }

    const isUserAuthenticated = isAuthenticated()

    // Check if current route is protected
    const isProtectedRoute = PROTECTED_ROUTES.some(route =>
      to.path.startsWith(route),
    )

    // Check if current route is public (auth pages)
    const isAuthRoute = to.path.startsWith('/auth/')

    // Redirect logic
    if (isProtectedRoute && !isUserAuthenticated) {
      // Redirect to login page if trying to access protected route without auth
      next('/auth/login')
    }
    else if (isAuthRoute && isUserAuthenticated) {
      // Redirect to home if already authenticated and trying to access auth pages
      next('/')
    }
    else {
      // Proceed to destination
      next()
    }
  })

  // Handle API errors (401 Unauthorized)
  if (isClient) {
    // Create a response interceptor to handle 401 errors
    const originalFetch = window.fetch
    window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
      const response = await originalFetch(input, init)

      // Check if response is 401 Unauthorized
      if (response.status === 401) {
        const userStore = useUserStore()
        userStore.logout()

        // Redirect to login page if not already there
        if (window.location.pathname !== '/auth/login') {
          window.location.href = '/auth/login'
        }
      }

      return response
    }
  }
}
