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
    grid="~ cols-1 md:cols-2"
    text="gray-700 dark:gray-200"
    class="mx-auto max-w-screen-xl gap-8 px-4 py-10 lg:gap-12"
  >
    <!-- 左侧内容：项目标题和文档指引 -->
    <div
      flex="~ col"
      items="center md:start"
      text="center md:left"
    >
      <!-- 主标题 -->
      <h1
        mb="4"
        text="6xl teal-700 dark:teal-500"
        font="bold"
      >
        {{ t('app.name') }}
      </h1>

      <!-- 项目描述 -->
      <p
        mb="8"
        max-w="sm"
        text="3xl gray-700"
      >
        <em text="sm" opacity="90">{{ t('app.desc') }}</em>
      </p>

      <!-- 文档链接 -->
      <router-link
        :to="docsPath"
        class="gap-2 text-xl text-teal-600 font-medium underline transition duration-200 ease-in-out hover:text-teal-700"
      >
        <span>{{ t('nav.docs') }}</span>
      </router-link>
    </div>

    <!-- 右侧内容：模块导航列表 -->
    <div grid="~ cols-1 gap-y-6">
      <!-- 模块列表标题 -->
      <h2
        mb="4"
        text="center 3xl gray-800 md:left dark:gray-200"
      >
        {{ t('nav.explore_modules') }}
      </h2>

      <!-- 循环渲染模块卡片 -->
      <div
        v-for="module in modules"
        :key="module.path"
        flex="~"
        cursor="pointer"
        items="center"
        rounded="lg"
        bg="white dark:gray-800"
        p="4"
        text="left"
        shadow="md hover:lg"
        transition="duration-100"
        @click="router.push(module.path)"
      >
        <!-- 模块图标 -->
        <div
          mr="4"
          flex="shrink-0"
          text="4xl teal-600"
          :class="[module.icon]"
        />
        <div>
          <!-- 模块标题 -->
          <h3
            mb="1"
            text="xl gray-800 dark:gray-100"
            font="medium"
          >
            {{ t(module.title) }}
          </h3>
          <!-- 模块描述 -->
          <p
            text="sm gray-600 dark:gray-400"
          >
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
