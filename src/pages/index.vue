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
  <!-- 分栏 -->
  <div grid="~ cols-1 md:cols-2" class="px-4 py-2">
    <div items="center md:start" text="center md:left">
      <!-- 主标题 -->
      <h1 text="5xl gray-800 dark:slate-200" font="serif bold" class="mb-6">
        {{ t('app.name') }}
      </h1>
      <!-- 项目描述 -->
      <p text="base gray-600 dark:slate-400" class="mb-10">
        <em> {{ t('app.desc') }}</em>
      </p>
      <!-- 文档链接 -->
      <router-link :to="docsPath">
        <span text="teal-600 hover:underline dark:teal-400">{{ t('nav.docs') }}</span>
      </router-link>
    </div>

    <!-- 右侧内容：模块导航列表 -->
    <div>
      <!-- 模块列表标题 -->
      <h2 text="3xl gray-800 dark:slate-200" class="my-4">
        {{ t('nav.explore_modules') }}
      </h2>
      <!-- 循环渲染模块卡片 -->
      <div
        v-for="module in modules" :key="module.path"
        flex="~"
        items="center"
        cursor="pointer"
        rounded="~"
        shadow="~ dark:white/5 hover:lg"
        class="mb-2 px-4 py-2 dark:ring-white/20"
        @click="router.push(module.path)"
      >
        <div text="xl" class="mr-4" :class="[module.icon]" />
        <div>
          <h3 text="base" class="mb-1">
            {{ t(module.title) }}
          </h3>
          <p text="sm gray-600 dark:slate-400">
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
