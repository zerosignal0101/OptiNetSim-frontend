import type { UserModule } from '~/types'
import { initializeAuth } from '~/composables/auth'

export const install: UserModule = async ({ isClient }: { isClient: boolean }) => {
  if (isClient) {
    // Initialize authentication state on app startup
    await initializeAuth()
  }
}
