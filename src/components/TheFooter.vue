<script setup lang="ts">
import { toggleDark } from '~/composables/dark'
import { availableLocales, loadLanguageAsync } from '~/modules/i18n'

const { t, locale } = useI18n()

async function toggleLocales() {
  // change to some real logic
  const locales = availableLocales
  const newLocale = locales[(locales.indexOf(locale.value) + 1) % locales.length]
  await loadLanguageAsync(newLocale)
  locale.value = newLocale
}
</script>

<template>
  <nav flex="~ gap-4" mt-6 justify-center text-gray-60>
    <RouterLink to="/" :title="t('footer.button.home')">
      <div i-carbon-campsite icon-size-2 />
    </RouterLink>

    <button :title="t('footer.button.toggle_dark')" @click="toggleDark()">
      <div i="carbon-sun dark:carbon-moon" icon-size-2 dark:icon-size-2 />
    </button>

    <a :title="t('footer.button.toggle_langs')" @click="toggleLocales()">
      <div i-carbon-language icon-size-2 />
    </a>

    <RouterLink to="/about" :title="t('pages.about')" data-test-id="about">
      <div i-carbon-dicom-overlay icon-size-2 />
    </RouterLink>

    <a rel="noreferrer" href="https://github.com/zerosignal0101/OptiNetSim-frontend" target="_blank" title="GitHub">
      <div i-carbon-logo-github icon-size-2 />
    </a>
  </nav>
</template>
