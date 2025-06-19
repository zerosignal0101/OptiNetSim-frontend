<template>
  <div class="relative">
    <button @click="toggleDropdown" class="flex items-center space-x-2 p-2 bg-gray-200 dark:bg-gray-700 rounded-md">
      <span>{{ currentLocale.name }}</span>
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
    </button>
    
    <div v-if="isOpen" class="absolute top-full right-0 mt-2 w-40 bg-white dark:bg-gray-800 border rounded-md shadow-lg z-10">
      <ul>
        <li v-for="locale in availableLocales" :key="locale.code">
          <!-- 
            使用 NuxtLink 和 switchLocalePath 来创建正确的本地化链接。
            这对于 SPA 导航和 SEO 至关重要。
          -->
          <NuxtLink 
            :to="switchLocalePath(locale.code)"
            @click="closeDropdown"
            class="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
            :class="{ 'font-bold': locale.code === currentLocaleCode }"
          >
            {{ locale.name }}
          </NuxtLink>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

// useI18n() 返回当前语言环境、可用语言列表等
// switchLocalePath() 是一个辅助函数，用于获取切换到指定语言的路由路径
const { locale, locales } = useI18n()
const switchLocalePath = useSwitchLocalePath()

const isOpen = ref(false)

// 获取当前语言的 code
const currentLocaleCode = computed(() => locale.value)

// 获取当前语言的完整对象 (包含 name, iso 等)
const currentLocale = computed(() => {
  return locales.value.find(l => l.code === locale.value) || { name: 'Language' }
})

// 获取除当前语言外的其他可用语言
const availableLocales = computed(() => {
  return locales.value
})

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}

const closeDropdown = () => {
  isOpen.value = false
}
</script>