<template>
  <header class="bg-white dark:bg-gray-800 shadow sticky top-0 z-50">
    <nav class="container mx-auto px-4 lg:px-6 py-3 flex justify-between items-center">
      <NuxtLink :to="homePath" class="text-xl font-bold text-blue-600 dark:text-blue-400">
        OptiNetSim
      </NuxtLink>

      <div class="flex items-center space-x-4">
        <!-- 所有导航链接使用 localePath 处理路径 -->
        <NuxtLink
          :to="networksPath"
          class="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
          active-class="text-blue-600 dark:text-blue-400 font-semibold"
        >
          {{ t('nav.networks') }}
        </NuxtLink>
        <NuxtLink
          :to="librariesPath"
          class="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
          active-class="text-blue-600 dark:text-blue-400 font-semibold"
        >
          {{ t('nav.libraries') }}
        </NuxtLink>
        <!-- 其他标题栏项目 -->
        <LanguageSwitcher />
      </div>
    </nav>
  </header>
</template>

<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
// 创建计算属性路径
const homePath = computed(() => localePath('/'))
const networksPath = computed(() => localePath('/networks'))
const librariesPath = computed(() => localePath('/libraries'))
</script>
