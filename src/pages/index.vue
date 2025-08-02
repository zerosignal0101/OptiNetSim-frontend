# src/pages/index.vue
<script setup lang="ts">
defineOptions({
  name: 'IndexPage',
})

const router = useRouter()
const { t } = useI18n()

useHead({
  title: () => t('pages.home'),
})

// 定义右侧模块的导航数据
const modules = [
  {
    title: 'module.network_management.title',
    description: 'module.network_management.desc',
    icon: 'i-carbon-network-3', // 网络管理图标
    path: '/network-management', // 假设的路由路径
  },
  {
    title: 'module.simulation.title',
    description: 'module.simulation.desc',
    icon: 'i-carbon-text-link-analysis', // 仿真模块图标
    path: '/simulation',
  },
  {
    title: 'module.large_scale_scheduling.title',
    description: 'module.large_scale_scheduling.desc',
    icon: 'i-carbon-cloud', // 大规模资源调度图标
    path: '/large-scale-scheduling',
  },
  {
    title: 'module.bandwidth_defragmentation.title',
    description: 'module.bandwidth_defragmentation.desc',
    icon: 'i-carbon-clean', // 带宽碎片整理图标
    path: '/bandwidth-defragmentation',
  },
]

// 假设的文档页面路由
const docsPath = '/docs'
</script>

<template>
  <!-- 外层容器，限制最大宽度并居中，应用内边距 -->
  <div
    class="grid grid-cols-1 mx-auto max-w-screen-xl gap-8 px-4 py-10 text-gray-700 md:grid-cols-2 lg:gap-12 dark:text-gray-200"
  >
    <!-- 左侧内容：项目标题和文档指引 -->
    <div
      class="flex flex-col items-center text-center md:items-start md:text-left"
    >
      <!-- 主标题，使用 bold 字体，teal 主色 -->
      <h1 class="mb-4 text-6xl text-teal-700 font-bold tracking-tight lg:text-7xl">
        {{ t('app.name') }}
      </h1>
      <!-- 项目描述，稍小的字号和透明度 -->
      <p class="mb-8 max-w-sm text-lg text-gray-700">
        <em text-sm opacity-90>{{ t('app.desc') }}</em>
      </p>

      <!-- 文档链接，符合链接和图标按钮样式 -->
      <router-link
        :to="docsPath"
        class="inline-flex items-center gap-2 text-xl text-teal-600 font-medium underline transition duration-200 ease-in-out hover:text-teal-700"
      >
        <div i-carbon-document inline-block text-3xl />
        <span>{{ t('nav.docs') }}</span>
      </router-link>
    </div>

    <!-- 右侧内容：模块导航列表 -->
    <div class="grid grid-cols-1 gap-y-6">
      <!-- 模块列表标题 -->
      <h2
        class="mb-4 text-center text-3xl text-gray-800 font-sans md:text-left dark:text-gray-200"
      >
        {{ t('nav.explore_modules') }}
      </h2>

      <!-- 循环渲染各个模块卡片 -->
      <div
        v-for="module in modules"
        :key="module.path"
        class="flex cursor-pointer items-center rounded-lg bg-white p-4 text-left shadow-md transition duration-200 dark:bg-gray-800 hover:shadow-lg"
        @click="router.push(module.path)"
      >
        <!-- 模块图标，使用 teal 主色 -->
        <div class="mr-4 flex-shrink-0 text-4xl text-teal-600" :class="[module.icon]" />
        <div>
          <!-- 模块标题 -->
          <h3 class="mb-1 text-xl text-gray-800 font-medium dark:text-gray-100">
            {{ t(module.title) }}
          </h3>
          <!-- 模块描述 -->
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {{ t(module.description) }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<route lang="yaml">
meta:
  layout: home
</route>
