<script setup lang="ts">
import type { NetworkListResponse } from '~/types/api'
import { networkApi } from '~/composables/networkApi' // 导入 networkApi

const router = useRouter()

const networks = ref<NetworkListResponse>()
const isLoadingNetworks = ref<boolean>(true)
const networksError = ref<Error | null>(null)

// 定义获取网络数据的函数
async function fetchNetworks() {
  try {
    const response = await networkApi.getNetworks()
    if (response === null) {
      throw new Error('Received null response')
    }
    networks.value = response
  }
  catch (err) {
    if (err instanceof SyntaxError) {
      networksError.value = new Error('Failed to parse JSON response')
    }
    else {
      networksError.value = err as Error
    }
    networks.value = undefined // 明确设置为 undefined
  }
  finally {
    isLoadingNetworks.value = false
  }
}

// 在组件挂载时自动获取网络列表
onMounted(() => {
  fetchNetworks()
})

// --- 功能按键的空函数 ---
function handleRename(networkId: string) {
  console.warn(`重命名网络 ID: ${networkId}`)
  // TODO: 实现重命名逻辑，例如打开一个模态框
}

function handleEdit(networkId: string) {
  router.push(`/network-editor/${networkId}`)
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
  <section class="border border-gray-200 rounded-lg p-6 dark:border-slate-700">
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
    <div v-else-if="networks?.networks.length" grid="~ cols-1 gap-6 md:cols-2" class="gap-2">
      <div
        v-for="network in networks.networks" :key="network.network_id"
        flex="~ col" bg="gray-50 dark:slate-800" rounded="lg" shadow="sm"
        class="justify-between border border-gray-200 p-5 dark:border-slate-700"
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
          <div flex="~" text="sm" class="mt-auto flex gap-3 border-t border-gray-200 pt-4 dark:border-slate-700">
            <button class="btn-ghost flex-1" @click="handleRename(network.network_id)">
              {{ t('actions.rename') }}
            </button>
            <button class="btn-ghost flex-1" @click="handleSimulate(network.network_id)">
              {{ t('actions.simulate') }}
            </button>
            <button class="btn-primary flex-1" @click="handleEdit(network.network_id)">
              {{ t('actions.edit') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
