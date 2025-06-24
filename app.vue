<template>
  <el-config-provider :locale="elementPlusLocale">
    <div>
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </div>
  </el-config-provider>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// 1. 导入 Element Plus 的语言包
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import en from 'element-plus/es/locale/lang/en'

// 2. 获取 @nuxtjs/i18n 的响应式 locale
const { locale, t } = useI18n()

// 3. 创建一个计算属性，用于根据 i18n 的 locale 动态返回对应的 Element Plus 语言包
const elementPlusLocale = computed(() => {
  // 这里的 locale.value 就是你在 nuxt.config.ts 中定义的 `locales` 数组里的 `code`
  switch (locale.value) {
    case 'en':
      return en
    case 'zh':
      return zhCn
    default:
      // 提供一个默认回退
      return zhCn
  }
})
</script>
