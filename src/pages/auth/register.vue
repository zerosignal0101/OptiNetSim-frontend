<script setup lang="ts">
import type { RegisterRequest } from '~/composables/auth'
import { register } from '~/composables/auth'

const router = useRouter()
const { t } = useI18n()

// Set page title
useHead({
  title: `${t('pages.register')} - OptiNetSim`,
})

// Form data
const formData = reactive<RegisterRequest>({
  username: '',
  password: '',
})

// Form state
const isLoading = ref(false)
const error = ref('')
const acceptTerms = ref(true) // Default accepted

// Password strength calculation
const passwordStrength = computed(() => {
  const password = formData.password
  if (password.length < 6) {
    return { text: '', color: '', bgClass: '', width: '0%' }
  }

  let strength = 0
  // Length check
  if (password.length >= 8)
    strength += 1
  if (password.length >= 12)
    strength += 1

  // Complexity checks
  if (/[a-z]/.test(password))
    strength += 1
  if (/[A-Z]/.test(password))
    strength += 1
  if (/\d/.test(password))
    strength += 1
  if (/[^a-z0-9]/i.test(password))
    strength += 1

  if (strength <= 2) {
    return {
      text: t('auth.strength_weak'),
      color: 'text-red-60',
      bgClass: 'bg-red-60',
      width: '33%',
    }
  }
  else if (strength <= 4) {
    return {
      text: t('auth.strength_medium'),
      color: 'text-yellow-60',
      bgClass: 'bg-yellow-60',
      width: '66%',
    }
  }
  else {
    return {
      text: t('auth.strength_strong'),
      color: 'text-green-60',
      bgClass: 'bg-green-60',
      width: '100%',
    }
  }
})

// Validation
const isValid = computed(() => {
  return formData.username.trim().length >= 3 && formData.password.length >= 6 && acceptTerms.value
})

// Handle registration
async function handleRegister() {
  if (!isValid.value)
    return

  isLoading.value = true
  error.value = ''

  try {
    await register(formData)
    // Redirect to home page on successful registration (auto-login)
    await router.push('/')
  }
  catch (err) {
    console.error('Registration error:', err)
    error.value = err instanceof Error ? err.message : t('auth.registration_failed')
  }
  finally {
    isLoading.value = false
  }
}

// Handle form submission
function handleSubmit(e: Event) {
  e.preventDefault()
  handleRegister()
}
</script>

<template>
  <!-- Carbon Design background with proper spacing -->
  <div class="min-h-screen flex items-center justify-center bg-coolGray-10 p-6">
    <!-- Main content container using Carbon spacing -->
    <div class="w-160">
      <!-- Register card with Carbon design -->
      <div class="rounded-lg bg-white p-8 shadow-lg">
        <!-- Sign up heading -->
        <div class="mb-8 text-center">
          <h2 class="mb-3 heading04 text-gray-100">
            {{ t('auth.create_account') }}
          </h2>
          <p class="body02 text-coolGray-60">
            {{ t('auth.already_have_account') }}
            <RouterLink
              to="/auth/login"
              class="text-blue-60 font-medium transition-colors duration-150 hover:text-blue-70"
            >
              {{ t('auth.sign_in_existing') }}
            </RouterLink>
          </p>
        </div>

        <!-- Register form -->
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
                minlength="3"
                class="w-full border border-coolGray-30 rounded-md bg-white px-4 py-3 text-gray-100 transition-all duration-150 disabled:cursor-not-allowed focus:border-transparent disabled:bg-coolGray-10 focus:outline-none focus:ring-2 focus:ring-blue-60 placeholder-coolGray-50"
                :placeholder="t('auth.choose_username')"
                :disabled="isLoading"
                :class="{ 'border-red-50 focus:ring-red-60': error }"
              >
              <!-- Username icon -->
              <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <svg class="h-5 w-5 text-coolGray-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
            <p class="caption01 text-coolGray-50">
              {{ t('auth.must_be_3_chars') }}
            </p>
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
                minlength="6"
                class="w-full border border-coolGray-30 rounded-md bg-white px-4 py-3 text-gray-100 transition-all duration-150 disabled:cursor-not-allowed focus:border-transparent disabled:bg-coolGray-10 focus:outline-none focus:ring-2 focus:ring-blue-60 placeholder-coolGray-50"
                :placeholder="t('auth.choose_password')"
                :disabled="isLoading"
                :class="{ 'border-red-50 focus:ring-red-60': error }"
              >
              <!-- Password icon -->
              <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <svg class="h-5 w-5 text-coolGray-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>
            <p class="caption01 text-coolGray-50">
              {{ t('auth.must_be_6_chars') }}
            </p>
          </div>

          <!-- Password strength indicator -->
          <div v-if="formData.password.length >= 6" class="space-y-2">
            <div class="flex items-center justify-between">
              <span class="caption01 text-coolGray-60">{{ t('auth.password_strength') }}</span>
              <span class="caption01" :class="passwordStrength.color">
                {{ passwordStrength.text }}
              </span>
            </div>
            <div class="h-2 w-full rounded-full bg-coolGray-20">
              <div
                class="h-2 rounded-full transition-all duration-300"
                :class="passwordStrength.bgClass"
                :style="{ width: passwordStrength.width }"
              />
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
                {{ t('auth.registration_error') }}
              </h3>
              <p class="mt-1 text-sm text-red-80">
                {{ error }}
              </p>
            </div>
          </div>

          <!-- Terms and conditions -->
          <!-- <div class="flex items-start">
            <div class="h-5 flex items-center">
              <input
                id="terms"
                v-model="acceptTerms"
                name="terms"
                type="checkbox"
                required
                class="h-4 w-4 border-coolGray-30 rounded text-blue-60 focus:ring-blue-60"
                :disabled="isLoading"
              >
            </div>
            <div class="ml-3">
              <label for="terms" class="text-sm text-coolGray-60">
                {{ t('auth.agree_terms') }}
                <a href="#" class="text-blue-60 font-medium hover:text-blue-70">{{ t('auth.terms_service') }}</a>
                {{ t('auth.and') }}
                <a href="#" class="text-blue-60 font-medium hover:text-blue-70">{{ t('auth.privacy_policy') }}</a>
              </label>
            </div>
          </div> -->

          <!-- Submit button with Carbon design -->
          <button
            type="submit"
            :disabled="!isValid || isLoading || !acceptTerms"
            class="w-full flex items-center justify-center border border-transparent rounded-md bg-blue-60 px-6 py-3 text-base text-white font-medium transition-all duration-150 disabled:cursor-not-allowed disabled:bg-coolGray-40 hover:bg-green-70 disabled:text-coolGray-20 disabled:shadow-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-60"
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
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              {{ t('auth.create_account') }}
            </span>
            <span v-else>
              {{ t('auth.creating_account') }}
            </span>
          </button>
        </form>

        <!-- Footer with additional info -->
        <div class="mt-8 text-center">
          <p class="caption01 text-coolGray-60">
            {{ t('auth.secure_info') }}
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
