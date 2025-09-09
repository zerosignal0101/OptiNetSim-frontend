<script setup lang="ts">
import type { NetworkListResponse } from '~/types/api'
import { networkApi } from '~/composables/networkApi' // 导入 networkApi

// 在 setup 中获取当前组件实例的代理，以访问全局属性
const app = getCurrentInstance()! // 确保获取到实例
const { proxy } = app // 解构出 proxy

const dialog = useDialog()

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
async function handleRename(networkId: string, oldNetworkName: string) {
  const network_name = await dialog.showPrompt('Rename network', 'Network name', { initialValue: oldNetworkName })

  if (!network_name)
    return

  const payload = {
    network_name,
  }

  const response = await networkApi.updateNetwork(networkId, payload)

  if (response === null) {
    proxy?.$notify({
      type: 'error',
      message: 'Failed to rename network: Null response from API.',
    })
    return
  }

  fetchNetworks()
}

function handleEdit(networkId: string) {
  router.push(`/network-editor/${networkId}`)
}

function handleSimulate(networkId: string) {
  console.warn(`仿真网络 ID: ${networkId}`)
  proxy?.$notify({
    type: 'warning',
    message: `Simulation not implemented.`,
  })
  // TODO: 实现仿真逻辑
}

async function handleCreate() {
  const network_name = await dialog.showPrompt('Add network', 'Network name')

  if (!network_name)
    return

  const payload = {
    network_name,
  }

  const response = await networkApi.createNetwork(payload)

  if (response === null) {
    proxy?.$notify({
      type: 'error',
      message: 'Failed to create network: Null response from API.',
    })
    return
  }

  fetchNetworks()
}

// 导入 i18n 工具
const { t, d } = useI18n()

// --- 日期时间格式化辅助函数 ---
function formatDateTime(isoString: string) {
  if (!isoString)
    return 'N/A'
  const date = new Date(isoString)
  return d(date, 'long')
}
</script>

<template>
  <!-- 页面主标题 -->
  <!-- Using display01 for a prominent page title, and Carbon spacing for margin-bottom -->
  <h1 class="mb-06 px-05 display01">
    {{ t('pages.networks') }}
  </h1>

  <!-- 网络列表区域 -->
  <!-- Carbon-style border and padding, with dark mode considerations -->
  <section class="border border-gray-20 rounded rounded p-06 dark:border-coolGray-70">
    <!-- 加载中状态 -->
    <!-- Using body01 for text style, Carbon colors, and spacing -->
    <p v-if="isLoadingNetworks" class="flex items-center justify-center gap-02 py-08 body01">
      <i class="i-carbon-circle-dash mr-02 animate-spin heading01" /> <!-- Added a spin for loading clarity -->
      {{ t('network_management.loading') }}
    </p>
    <!-- 错误状态 -->
    <!-- Using body01 for text style, Carbon red for error, and spacing -->
    <p v-else-if="networksError" class="flex items-center justify-center gap-02 py-08 body01 text-red-60 dark:text-red-50">
      <i class="i-carbon-warning heading01" />
      Error : {{ networksError.message }}
    </p>
    <!-- 有数据时显示列表 -->
    <!-- Carbon spacing for grid gap -->
    <div v-else-if="networks?.networks.length">
      <div class="mb-6">
        <button class="flex-1 border p-4 text-left bodyCompact01 transition-colors motion-productive-standard-fast-01 hover:bg-whiteHover dark:hover:bg-blackHover" @click="handleCreate()">
          {{ t('network_management.create_network') }}
        </button>
      </div>
      <div class="grid grid-cols-1 gap-06 md:grid-cols-2">
        <div
          v-for="network in networks.networks" :key="network.network_id"
          class="flex flex-col justify-between border-2 border-gray-20 dark:border-coolGray-70 dark:bg-gray-90"
        >
          <div class="p-5">
            <!-- 网络名称 -->
            <!-- Using heading03 for card title, and Carbon spacing for margin-bottom -->
            <h3 class="mb-02 heading03">
              {{ network.network_name }}
            </h3>
            <!-- 更新时间 -->
            <!-- Using label01 for descriptive text, Carbon gray colors, and spacing -->
            <p class="mb-04 label01 text-gray-60 dark:text-coolGray-40">
              <i class="i-carbon-time mr-01 align-middle" />
              {{ `${t('network_management.updated_time')}: ${formatDateTime(network.updated_at)}` }}
            </p>
          </div>
          <!-- 功能按键组 -->
          <!-- Carbon spacing for gap, padding, and border -->
          <!-- 移除了 gap-03 以实现“紧密连接”的色块效果 -->
          <div class="flex border-t border-gray-20 dark:border-coolGray-70">
            <!-- Carbon Ghost Button -->
            <!-- text-label01 和 font-semibold 已经在 carbon-btn-base 中，这里只是作为一个示例加强说明 -->
            <button class="h-auto flex-1 p-4 text-left bodyCompact01 transition-colors motion-productive-standard-fast-01 hover:bg-whiteHover dark:hover:bg-blackHover" @click="handleRename(network.network_id, network.network_name)">
              {{ t('actions.rename') }}
            </button>
            <!-- Carbon Ghost Button -->
            <button class="flex-1 border-l p-4 text-left bodyCompact01 transition-colors motion-productive-standard-fast-01 hover:bg-whiteHover dark:hover:bg-blackHover" @click="handleSimulate(network.network_id)">
              {{ t('actions.simulate') }}
            </button>
            <!-- Carbon Primary Button -->
            <button text="blue-60 active:blue-80 hover:blueH-60 left" class="flex-1 border-2 border-blue-60 p-4 bodyCompact01 transition-colors motion-productive-standard-fast-01 active:border-blue-80 hover:border-blueH-60 hover:bg-whiteHover dark:hover:bg-blackHover" @click="handleEdit(network.network_id)">
              {{ t('actions.edit') }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <!-- No data state -->
    <p v-else class="flex items-center justify-center gap-02 py-08 body01 text-gray-60 dark:text-coolGray-40">
      <i class="i-carbon-information heading01" />
      {{ t('network_management.no_networks_found') }}
    </p>
  </section>
</template>
