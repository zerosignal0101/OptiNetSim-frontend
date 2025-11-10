<script setup lang="ts">
import { isAuthenticated, logout } from '~/composables/auth'
import { useUserStore } from '~/stores/user'

const { t } = useI18n()
const router = useRouter()

const userStore = useUserStore()
const isAuthenticatedUser = computed(() => isAuthenticated())

// Handle logout
async function handleLogout() {
  try {
    logout()
    // Redirect to login page
    await router.push('/auth/login')
  }
  catch (error) {
    console.error('Logout error:', error)
  }
}

// Navigate to login
function goToLogin() {
  router.push('/auth/login')
}

// Navigate to register
function goToRegister() {
  router.push('/auth/register')
}
</script>

<template>
  <div class="flex items-center">
    <!-- Authenticated user -->
    <div v-if="isAuthenticatedUser" class="flex items-center space-x-3">
      <!-- User avatar and info -->
      <div class="flex items-center space-x-3">
        <!-- User avatar with Carbon design -->
        <div class="relative">
          <div class="h-10 w-10 flex cursor-pointer items-center justify-center rounded-full bg-blue-60 text-sm text-white font-semibold transition-colors duration-150 hover:bg-blue-70">
            {{ userStore.user?.username?.charAt(0).toUpperCase() }}
          </div>
          <!-- Online status indicator -->
          <div class="absolute bottom-0 right-0 h-3 w-3 border-2 border-white rounded-full bg-green-50" />
        </div>

        <!-- User information -->
        <div class="hidden sm:block">
          <p class="text-sm text-gray-100 font-medium">
            {{ userStore.user?.username }}
          </p>
          <p class="caption01 text-coolGray-60">
            Online
          </p>
        </div>
      </div>

      <!-- Logout button with Carbon design -->
      <button
        class="inline-flex items-center border border-transparent rounded-md bg-red-60 px-4 py-2 text-sm text-white font-medium transition-all duration-150 hover:bg-red-70 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-60"
        title="Sign out"
        @click="handleLogout"
      >
        <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        <span class="hidden sm:inline">{{ t('auth.sign_out') }}</span>
        <span class="sm:hidden">Sign out</span>
      </button>
    </div>

    <!-- Unauthenticated user -->
    <div v-else class="flex items-center space-x-2">
      <!-- Login button with Carbon design -->
      <button
        class="inline-flex items-center border border-coolGray-30 rounded-md bg-white px-4 py-2 text-sm text-coolGray-80 font-medium transition-all duration-150 hover:bg-coolGray-10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-60"
        @click="goToLogin"
      >
        <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
        </svg>
        <span class="hidden sm:inline">{{ t('auth.sign_in') }}</span>
        <span class="sm:hidden">Sign in</span>
      </button>

      <!-- Register button with Carbon design -->
      <button
        class="inline-flex items-center border border-transparent rounded-md bg-blue-60 px-4 py-2 text-sm text-white font-medium transition-all duration-150 hover:bg-blue-70 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-60"
        @click="goToRegister"
      >
        <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
        <span class="hidden sm:inline">{{ t('auth.sign_up') }}</span>
        <span class="sm:hidden">Sign up</span>
      </button>
    </div>
  </div>
</template>
