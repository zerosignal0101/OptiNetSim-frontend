<script setup lang="ts">
import { networkApi } from '~/composables/networkApi' // 导入 networkApi

// --- 获取光网络列表示例 ---
const {
  data: networks, // networks 现在将是一个 Ref<NetworkListResponse | null>
  isFetching: isLoadingNetworks,
  error: networksError,
  execute: fetchNetworks,
} = networkApi.getNetworks({
  page: 1,
  limit: 10,
  sort_by: 'updated_at',
  order: 'desc',
})

// 在组件挂载时自动获取网络列表
onMounted(() => {
  fetchNetworks()
})

// 监听错误 (可选，主要用于调试和用户提示)
watch(networksError, (err) => {
  if (err) {
    console.error('获取光网络列表失败:', err.message)
    // 实际项目中，您可能在这里使用一个通知库来显示用户友好的错误消息
    // 例如：showToast('error', `加载网络列表失败: ${err.message}`)
  }
})

// --- 功能按键的空函数 ---
function handleRename(networkId: string) {
  console.warn(`重命名网络 ID: ${networkId}`)
  // TODO: 实现重命名逻辑，例如打开一个模态框
}

function handleEdit(networkId: string) {
  console.warn(`编辑网络 ID: ${networkId}`)
  // TODO: 实现编辑逻辑，例如跳转到编辑页面或打开模态框
}

function handleSimulate(networkId: string) {
  console.warn(`仿真网络 ID: ${networkId}`)
  // TODO: 实现仿真逻辑
}

// 导入 i18n 工具
const { t, d } = useI18n()

// --- 日期时间格式化辅助函数 ---
function formatDateTime(isoString: string) {
  if (!isoString)
    return 'N/A'
  const date = new Date(isoString)
  return d(date)
}
</script>

<template>
  <!-- 页面主标题 -->
  <h1 text="4xl" font="bold" class="mb-6">
    {{ t('pages.networks') }}
  </h1>

  <!-- 网络列表区域 -->
  <section class="border border-gray-200 rounded-lg p-6">
    <!-- 加载中状态 -->
    <p v-if="isLoadingNetworks" flex="center" class="gap-2 py-8">
      {{ t('info.loading') }}
    </p>
    <!-- 错误状态 -->
    <p v-else-if="networksError" flex="center" text="red-600 dark:red-500" class="gap-2 py-8">
      <i class="i-carbon-warning text-xl" />
      {{ t('errors.error') }} : {{ networksError.message }}
    </p>
    <!-- 有数据时显示列表 -->
    <div v-else-if="networks?.networks.length" grid="~ cols-1 gap-6 lg:cols-3 md:cols-2" class="gap-2">
      <div
        v-for="network in networks.networks" :key="network.network_id"
        flex="~ col" bg="gray-50" rounded="lg" shadow="sm"
        class="justify-between border border-gray-200 p-5"
      >
        <div>
          <!-- 网络名称 -->
          <h3 text="lg" font="semibold" class="mb-2">
            {{ network.network_name }}
          </h3>
          <!-- 更新时间 -->
          <p text="sm gray-600" class="mb-4">
            <i class="i-carbon-time mr-1 align-middle" />
            {{ `${t('network_management.updated_time')}: ${formatDateTime(network.updated_at)}` }}
          </p>
          <!-- 功能按键组 -->
          <div flex="~" text="sm" class="mt-auto flex gap-3 border-t border-gray-200 pt-4">
            <button class="flex-1 btn-ghost" @click="handleRename(network.network_id)">
              {{ t('actions.rename') }}
            </button>
            <button class="flex-1 btn-ghost" @click="handleSimulate(network.network_id)">
              {{ t('actions.simulate') }}
            </button>
            <button class="flex-1 btn-primary" @click="handleEdit(network.network_id)">
              {{ t('actions.edit') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
