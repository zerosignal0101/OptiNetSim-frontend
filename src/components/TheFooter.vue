<script setup lang="ts">
import { isAuthenticated, logout } from '~/composables/auth'
import { toggleDark } from '~/composables/dark'
import { availableLocales, loadLanguageAsync } from '~/modules/i18n'

const { t, locale } = useI18n()
const dialog = useDialog()
const proxy = getCurrentInstance()?.proxy
const router = useRouter()

// Check if user is authenticated
const isAuthenticatedUser = computed(() => isAuthenticated())

async function toggleLocales() {
  // change to some real logic
  const locales = availableLocales
  const newLocale = locales[(locales.indexOf(locale.value) + 1) % locales.length]
  await loadLanguageAsync(newLocale)
  locale.value = newLocale
}

async function handleLogout() {
  // Show confirmation dialog before logging out
  const confirmed = await dialog.showConfirm(
    t('auth.sign_out'),
    t('auth.logout_confirm_message'),
    { confirmButtonText: t('auth.sign_out') },
  )

  if (!confirmed) {
    return
  }

  try {
    logout()
    // Show success notification
    proxy?.$notify({
      type: 'success',
      message: t('auth.logout_success'),
    })

    // Redirect to home page after logout
    await router.push('/')
  }
  catch (error) {
    // Show error notification
    proxy?.$notify({
      type: 'error',
      message: t('auth.logout_error'),
    })
    console.error('Logout error:', error)
  }
}
</script>

<template>
  <nav flex="~ gap-4" mt-6 justify-center text-gray-60>
    <RouterLink to="/" :title="t('footer.button.home')">
      <div i-carbon-campsite icon-size-2 />
    </RouterLink>

    <div :title="t('footer.button.toggle_dark')" @click="toggleDark()">
      <div i="carbon-sun dark:carbon-moon" icon-size-2 dark:icon-size-2 />
    </div>

    <a :title="t('footer.button.toggle_langs')" @click="toggleLocales()">
      <div i-carbon-language icon-size-2 />
    </a>

    <RouterLink to="/about" :title="t('pages.about')" data-test-id="about">
      <div i-carbon-dicom-overlay icon-size-2 />
    </RouterLink>

    <a rel="noreferrer" href="https://github.com/zerosignal0101/OptiNetSim-frontend" target="_blank" title="GitHub">
      <div i-carbon-logo-github icon-size-2 />
    </a>

    <!-- Only show logout button when user is authenticated -->
    <a v-if="isAuthenticatedUser" :title="t('auth.sign_out')" @click="handleLogout()">
      <div i-carbon-logout icon-size-2 />
    </a>
  </nav>
</template>
