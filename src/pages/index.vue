<script setup lang="ts">
defineOptions({
  name: 'IndexPage',
})

const router = useRouter()
const { t } = useI18n()

useHead({
  title: () => t('pages.home'),
})

// 定义模块数据
const modules = [
  {
    title: 'module.network_management.title',
    description: 'module.network_management.desc',
    icon: 'i-carbon-network-3',
    path: '/network-management',
  },
  {
    title: 'module.simulation.title',
    description: 'module.simulation.desc',
    icon: 'i-carbon-text-link-analysis',
    path: '/simulation',
  },
  {
    title: 'module.large_scale_scheduling.title',
    description: 'module.large_scale_scheduling.desc',
    icon: 'i-carbon-cloud',
    path: '/large-scale-scheduling',
  },
  {
    title: 'module.bandwidth_defragmentation.title',
    description: 'module.bandwidth_defragmentation.desc',
    icon: 'i-carbon-clean',
    path: '/bandwidth-defragmentation',
  },
]

const docsPath = '/docs'
</script>

<template>
  <!-- 主容器使用 Carbon Grid 系统 -->
  <div class="px-4 py-2 cds--grid">
    <!-- 左侧内容区域 -->
    <div items="center md:start" text="center md:left" class="lg:col-span-6 md:col-span-4 sm:col-span-4">
      <!-- 主标题 -->
      <h1 class="my-5 heading07">
        {{ t('app.name') }}
      </h1>
      <!-- 项目描述 -->
      <p class="mb-9 body02">
        {{ t('app.desc') }}
      </p>
      <!-- 文档链接 -->
      <Link
        render-icon="i-carbon-arrow-right"
        :href="docsPath"
        class="text-blue-60 font-semibold dark:text-blue-40 hover:text-blue-80 dark:hover:text-blue-30"
      >
        Docs
      </Link>
    </div>

    <!-- 右侧 2x2 卡片网格 -->
    <div class="lg:col-span-10 md:col-span-4 sm:col-span-4">
      <h2 text="gray-800 dark:slate-200" class="my-5 heading04">
        {{ t('nav.explore_modules') }}
      </h2>

      <!-- 2x2 网格容器 -->
      <div class="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <!-- 循环渲染模块卡片 -->
        <div
          v-for="module in modules"
          :key="module.path"
          class="group flex flex-col"
          cursor="pointer"
          bg="white dark:gray-100"
          border="1 solid gray-20 dark:gray-80"
          p="5"
          shadow="sm"
          hover:shadow="md"
          hover:border="blue-40 dark:blue-60"
          transition="all duration-200 motion-productive-standard-fast-01"
          h="full"
          @click="router.push(module.path)"
        >
          <!-- 卡片内容 - 使用 flex-grow 确保内容区域扩展 -->
          <div flex="~" items="start" class="flex-grow">
            <!-- 图标容器 -->
            <div
              flex="~ center"
              bg="blue-10 dark:blue-90"
              p="3"
              class="mr-4 flex-shrink-0 transition-colors group-hover:bg-blue-20 dark:group-hover:bg-blue-80"
            >
              <div text="2xl" :class="[module.icon]" class="text-blue-60 dark:text-blue-40" />
            </div>

            <!-- 文本内容 -->
            <div class="flex-grow">
              <h3
                class="mb-1 heading02 text-gray-90 transition-colors dark:text-gray-10 group-hover:text-blue-70 dark:group-hover:text-blue-30"
              >
                {{ t(module.title) }}
              </h3>
              <p
                text="body01"
                class="line-clamp-3 text-gray-90 dark:text-gray-30"
              >
                {{ t(module.description) }}
              </p>
            </div>
          </div>

          <!-- 底部箭头指示器 - 固定在底部 -->
          <div
            flex="~ justify-end"
            mt="3"
            class="text-gray-400 transition-colors group-hover:text-blue-60 dark:group-hover:text-blue-40"
          >
            <div class="i-carbon-arrow-right icon-size-2" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<route lang="yaml">
meta:
  layout: home
</route>
