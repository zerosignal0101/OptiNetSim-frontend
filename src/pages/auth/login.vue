<script setup lang="ts">
import type { LoginRequest } from '~/composables/auth'
import { login } from '~/composables/auth'

const router = useRouter()
const { t } = useI18n()

// Set page title
useHead({
  title: `${t('pages.login')} - OptiNetSim`,
})

// Form data
const formData = reactive<LoginRequest>({
  username: '',
  password: '',
})

// Form state
const isLoading = ref(false)
const error = ref('')

// Validation
const isValid = computed(() => {
  return formData.username.trim() !== '' && formData.password.length >= 1
})

// Handle login
async function handleLogin() {
  if (!isValid.value)
    return

  isLoading.value = true
  error.value = ''

  try {
    await login(formData)
    // Redirect to home page on successful login
    await router.push('/')
  }
  catch (err) {
    console.error('Login error:', err)
    error.value = err instanceof Error ? err.message : t('auth.login_failed')
  }
  finally {
    isLoading.value = false
  }
}

// Handle form submission
function handleSubmit(e: Event) {
  e.preventDefault()
  handleLogin()
}
</script>

<template>
  <!-- Carbon Design background with proper spacing -->
  <div class="min-h-screen flex items-center justify-center">
    <!-- Main content container using Carbon spacing -->
    <div class="w-160">
      <!-- Login card with Carbon design -->
      <div class="border bg-white p-8 shadow-lg">
        <!-- Sign in heading -->
        <div class="mb-8 text-center">
          <h2 class="mb-3 heading04 text-gray-100">
            {{ t('auth.sign_in_to_account') }}
          </h2>
          <p class="body02 text-coolGray-60">
            {{ t('auth.dont_have_account') }}
            <RouterLink
              to="/auth/register"
              class="text-blue-60 font-medium transition-colors duration-150 hover:text-blue-70"
            >
              {{ t('auth.create_new_account') }}
            </RouterLink>
          </p>
        </div>

        <!-- Login form -->
        <form class="space-y-6" @submit="handleSubmit">
          <!-- Username field with Carbon design -->
          <div class="space-y-2">
            <label for="username" class="block label01 text-gray-100">
              {{ t('auth.username') }}
            </label>
            <div class="relative">
              <input
                id="username"
                v-model="formData.username"
                name="username"
                type="text"
                required
                class="w-full border border-coolGray-30 rounded-md bg-white px-4 py-3 text-gray-100 transition-all duration-150 disabled:cursor-not-allowed focus:border-transparent disabled:bg-coolGray-10 focus:outline-none focus:ring-2 focus:ring-blue-60 placeholder-coolGray-50"
                :placeholder="t('auth.enter_username')"
                :disabled="isLoading"
                :class="{ 'border-red-50 focus:ring-red-60': error }"
              >
            </div>
          </div>

          <!-- Password field with Carbon design -->
          <div class="space-y-2">
            <label for="password" class="block label01 text-gray-100">
              {{ t('auth.password') }}
            </label>
            <div class="relative">
              <input
                id="password"
                v-model="formData.password"
                name="password"
                type="password"
                required
                class="w-full border border-coolGray-30 rounded-md bg-white px-4 py-3 text-gray-100 transition-all duration-150 disabled:cursor-not-allowed focus:border-transparent disabled:bg-coolGray-10 focus:outline-none focus:ring-2 focus:ring-blue-60 placeholder-coolGray-50"
                :placeholder="t('auth.enter_password')"
                :disabled="isLoading"
                :class="{ 'border-red-50 focus:ring-red-60': error }"
              >
            </div>
          </div>

          <!-- Error message with Carbon design -->
          <div
            v-if="error"
            class="flex items-start border border-red-30 rounded-md bg-red-10 p-4 space-x-3"
          >
            <!-- Error icon -->
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-red-60" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="flex-1">
              <h3 class="text-sm text-red-90 font-medium">
                {{ t('auth.authentication_error_alt') }}
              </h3>
              <p class="mt-1 text-sm text-red-80">
                {{ error }}
              </p>
            </div>
          </div>

          <!-- Submit button with Carbon design -->
          <button
            type="submit"
            :disabled="!isValid || isLoading"
            class="w-full flex items-center justify-center border border-transparent rounded-md bg-blue-60 px-6 py-3 text-base text-white font-medium transition-all duration-150 disabled:cursor-not-allowed disabled:bg-coolGray-40 hover:bg-blue-70 disabled:text-coolGray-20 disabled:shadow-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-60"
          >
            <!-- Loading spinner -->
            <svg
              v-if="isLoading"
              class="mr-3 h-5 w-5 animate-spin text-white -ml-1"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>

            <!-- Button text -->
            <span v-if="!isLoading" class="flex items-center">
              <svg class="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              {{ t('auth.sign_in') }}
            </span>
            <span v-else>
              {{ t('auth.signing_in') }}
            </span>
          </button>
        </form>

        <!-- Footer with additional links -->
        <div class="mt-8 text-center">
          <p class="caption01 text-coolGray-60">
            {{ t('auth.terms_notice') }}
          </p>
        </div>
      </div>

      <!-- Back to home link -->
      <div class="mt-6 text-center">
        <RouterLink
          to="/"
          class="inline-flex items-center text-sm text-coolGray-60 transition-colors duration-150 hover:text-coolGray-100"
        >
          <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {{ t('auth.back_to_home') }}
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<route lang="yaml">
meta:
  layout: editor
</route>
