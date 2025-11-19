<script setup lang="ts">
import type { ImportNetworkPayload } from '~/types/api'
// 确保导入 Network 类型
import type { NetworkListItem } from '~/types/network' // 确保导入 Network 类型
import { networkApi } from '~/composables/networkApi'

const app = getCurrentInstance()!
const { proxy } = app

const { t, d } = useI18n()

function formatDateTime(isoString: string) {
  if (!isoString)
    return 'N/A'
  const date = new Date(isoString)
  return d(date, 'long')
}

const dialog = useDialog()
const router = useRouter()

// networksNow 存储实际展示的网络列表
const networksNow = ref<NetworkListItem[] | null>(null) // 直接存储数组，方便操作
const isLoadingNetworks = ref<boolean>(true)
const networksError = ref<Error | null>(null)

// 定义获取网络数据的函数
async function fetchNetworks() {
  isLoadingNetworks.value = true // 重新加载时设置为true
  networksError.value = null
  try {
    const response = await networkApi.getNetworks()
    if (response === null) {
      throw new Error('Received null response')
    }
    // 直接赋值新的数组，这将是初次加载和完全刷新时的行为
    networksNow.value = response.networks
  }
  catch (err) {
    if (err instanceof SyntaxError) {
      networksError.value = new Error('Failed to parse JSON response')
    }
    else {
      networksError.value = err as Error
    }
    networksNow.value = null // 明确设置为 null
  }
  finally {
    isLoadingNetworks.value = false
  }
}

// 在组件挂载时自动获取网络列表
onMounted(() => {
  fetchNetworks()
})

async function handleCreate() {
  const networkName = await dialog.showPrompt(
    t('network_management.create_network.title'),
    t('network_management.create_network.prompt'),
    { confirmButtonText: t('actions.create_network') },
  )

  if (!networkName)
    return

  const payload = {
    network_name: networkName,
  }

  try {
    const response = await networkApi.createNetwork(payload)

    if (response && response.network_id) { // 假设成功返回创建的网络对象
      proxy?.$notify({
        type: 'success',
        message: t('network_management.create_network.success', { networkName }),
      })
      // 关键：将新创建的网络添加到本地数组的开头，触发 TransitionGroup 的 enter 动画
      if (!networksNow.value) {
        networksNow.value = []
      }
      networksNow.value.unshift(response) // unshift 添加到开头
    }
    else {
      proxy?.$notify({
        type: 'error',
        message: 'Failed to create network: Unexpected response from API.',
      })
      // 如果API响应不符合预期，再执行一次完整刷新以同步状态
      fetchNetworks()
    }
  }
  catch (error) {
    proxy?.$notify({
      type: 'error',
      message: `Failed to create network: ${error instanceof Error ? error.message : String(error)}`,
    })
    // 失败也执行一次完整刷新以同步状态
    fetchNetworks()
  }
}

async function handleRename(networkId: string, oldNetworkName: string) {
  const networkName = await dialog.showPrompt(
    t('network_management.rename_network.title'),
    t('network_management.rename_network.prompt'),
    { initialValue: oldNetworkName, confirmButtonText: t('actions.rename_network') },
  )

  if (!networkName || networkName === oldNetworkName) // 如果名称未变，则不执行操作
    return

  const payload = {
    network_name: networkName,
  }

  try {
    const response = await networkApi.updateNetwork(networkId, payload)

    if (response && response.network_id) { // 假设成功返回更新后的网络对象
      proxy?.$notify({
        type: 'success',
        message: t('network_management.rename_network.success', { networkName, oldNetworkName }),
      })
      // 关键：更新本地数组中的网络名称，Vue 会响应式更新
      const index = networksNow.value?.findIndex(n => n.network_id === networkId)
      if (index !== undefined && index > -1) {
        // 创建一个新对象，避免直接修改props或state导致意外行为，虽然Vue的ref已经足够处理这里
        // 这里只是为了更明确地触发响应式更新，必要时可以直接修改 `networksNow.value[index].network_name = networkName`
        // 如果API返回了完整的更新对象，直接替换更可靠
        networksNow.value![index] = response
      }
    }
    else {
      proxy?.$notify({
        type: 'error',
        message: 'Failed to rename network: Unexpected response from API.',
      })
      // 如果API响应不符合预期，再执行一次完整刷新以同步状态
      fetchNetworks()
    }
  }
  catch (error) {
    proxy?.$notify({
      type: 'error',
      message: `Failed to rename network: ${error instanceof Error ? error.message : String(error)}`,
    })
    fetchNetworks()
  }
}

async function handleDelete(networkId: string, networkName: string) {
  const confirmed = await dialog.showConfirm(
    t('network_management.delete_network.title'),
    t('network_management.delete_network.prompt', { networkName }),
    { confirmButtonText: t('actions.delete_network') },
  )

  if (!confirmed)
    return

  try {
    // networkApi.deleteNetwork 成功时返回 null，失败时抛出错误
    await networkApi.deleteNetwork(networkId) // 不检查返回值，因为成功就是null

    proxy?.$notify({
      type: 'success',
      message: t('network_management.delete_network.success', { networkName }),
    })
    // 关键：从本地数组中移除网络，触发 TransitionGroup 的 leave 动画
    if (networksNow.value) {
      const index = networksNow.value.findIndex(n => n.network_id === networkId)
      networksNow.value.splice(index, 1)
    }
  }
  catch (error) {
    proxy?.$notify({
      type: 'error',
      message: `Failed to delete network: ${error instanceof Error ? error.message : String(error)}`,
    })
    // 失败时执行一次完整刷新以同步状态
    fetchNetworks()
  }
}

function handleEdit(networkId: string) {
  router.push(`/network-editor/${networkId}`)
}

function handleDefrag(networkId: string) {
  router.push(`/defrag/${networkId}`)
}

function handleSimulation(networkId: string) {
  router.push(`/simulation-editor/${networkId}`)
}

// 导出网络功能 - 针对特定网络
async function handleExportNetwork(networkId: string, networkName: string) {
  const confirmed = await dialog.showConfirm(
    t('network_management.export_network.title'),
    t('network_management.export_network.prompt', { networkName }),
    { confirmButtonText: t('actions.export_network') },
  )

  if (!confirmed)
    return

  try {
    const networkData = await networkApi.exportNetwork(networkId)

    // 下载JSON文件
    const jsonData = JSON.stringify(networkData, null, 2)
    const blob = new Blob([jsonData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${networkName}_topology_${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    proxy?.$notify({
      type: 'success',
      message: t('network_management.export_network.success', { networkName }),
    })
  }
  catch (error) {
    proxy?.$notify({
      type: 'error',
      message: t('network_management.export_network.error_export_failed', { error: error instanceof Error ? error.message : String(error) }),
    })
  }
}

// 导入网络功能
async function handleImportNetwork() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json,application/json'

  input.onchange = async (event) => {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (!file)
      return

    try {
      const text = await file.text()
      const networkData: ImportNetworkPayload = JSON.parse(text)

      // 验证必要的字段
      if (!networkData.network_name) {
        throw new Error('Network name is required in the imported file')
      }

      // 提示用户输入新的网络名称
      const networkName = await dialog.showPrompt(
        t('network_management.import_network.title'),
        t('network_management.import_network.prompt'),
        { initialValue: networkData.network_name, confirmButtonText: t('actions.import_network') },
      )

      if (!networkName)
        return

      // 创建导入载荷
      const payload: ImportNetworkPayload = {
        network_name: networkName,
        elements: networkData.elements || [],
        connections: networkData.connections || [],
        services: networkData.services || [],
        SI: networkData.SI,
        Span: networkData.Span,
        simulation_config: networkData.simulation_config,
      }

      // 调用导入API
      const response = await networkApi.importNetwork(payload)

      if (response && response.network_id) {
        proxy?.$notify({
          type: 'success',
          message: t('network_management.import_network.success', { networkName }),
        })

        // 添加到网络列表
        if (!networksNow.value) {
          networksNow.value = []
        }
        networksNow.value.unshift(response)
      }
      else {
        throw new Error('Failed to import network: Invalid response from API')
      }
    }
    catch (error) {
      if (error instanceof SyntaxError) {
        proxy?.$notify({
          type: 'error',
          message: t('network_management.import_network.error_invalid_json'),
        })
      }
      else {
        proxy?.$notify({
          type: 'error',
          message: t('network_management.import_network.error_import_failed', { error: error instanceof Error ? error.message : String(error) }),
        })
      }
    }
  }

  input.click()
}
</script>

<template>
  <!-- 页面主标题 -->
  <h1 class="mb-06 px-05 display01">
    {{ t('pages.networks') }}
  </h1>

  <!-- 网络列表区域 -->
  <section class="border border-gray-20 rounded rounded p-06 dark:border-coolGray-70">
    <!-- 加载中状态 -->
    <p v-if="isLoadingNetworks" class="flex items-center justify-center gap-02 py-08 body01">
      <i class="i-carbon-circle-dash mr-02 animate-spin heading01" />
      {{ t('network_management.loading') }}
    </p>
    <!-- 错误状态 -->
    <p v-else-if="networksError" class="flex items-center justify-center gap-02 py-08 body01 text-red-60 dark:text-red-50">
      <i class="i-carbon-warning heading01" />
      Error : {{ networksError.message }}
    </p>
    <!-- 有数据时显示列表 -->
    <div v-else-if="networksNow?.length">
      <div class="mb-6 flex items-center justify-between">
        <!-- 2. 次标题 -->
        <h2 class="expressiveHeading04">
          {{ t('network_management.list') }}
        </h2>

        <div class="flex gap-3">
          <button
            class="w-24 border border-gray-60 p-4 bodyCompact01 transition-colors motion-productive-standard-fast-01 dark:border-coolGray-50 active:bg-gray-20 hover:bg-gray-10 dark:hover:bg-coolGray-80"
            @click="handleImportNetwork()"
          >
            <i class="i-carbon-upload mr-1" />
            {{ t('network_management.import_network.action') }}
          </button>
          <button
            class="w-24 bg-blue-60 p-4 bodyCompact01 text-white transition-colors motion-productive-standard-fast-01 active:bg-blue-80 dark:bg-blue-70 hover:bg-blueH-60 dark:hover:bg-blueH-70"
            @click="handleCreate()"
          >
            <i class="i-carbon-add mr-1" />
            {{ t('network_management.create_network.action') }}
          </button>
        </div>
      </div>
      <!-- 使用 TransitionGroup 包裹列表 -->
      <TransitionGroup name="network-card" tag="div" class="grid grid-cols-1 gap-06 md:grid-cols-2">
        <div
          v-for="network in networksNow" :key="network.network_id"
          class="network-card-item flex flex-col justify-between border-2 border-gray-20 dark:border-coolGray-70 dark:bg-gray-90"
        >
          <div class="p-5">
            <div class="flex">
              <h3 class="mb-02 heading03">
                {{ network.network_name }}
              </h3>
              <i class="i-carbon-tag-edit px-4 text-gray-60 transition-colors motion-productive-standard-fast-01 dark:text-coolGray-40 hover:text-gray-80 dark:hover:text-coolGray-20" @click="handleRename(network.network_id, network.network_name)" />
            </div>
            <div class="flex align-middle text-gray-60 dark:text-coolGray-40">
              <i class="i-carbon-time mr-01" />
              <p class="mb-04 label01">
                {{ `${t('network_management.updated_time')}: ${formatDateTime(network.updated_at)}` }}
              </p>
            </div>
          </div>
          <div class="flex border-t border-gray-20 dark:border-coolGray-70">
            <!-- 组合次要操作 (Defrag, Simulate) -->
            <div class="flex flex-1">
              <button class="flex-1 border-gray-20 p-4 text-left bodyCompact01 transition-colors motion-productive-standard-fast-01 dark:border-coolGray-70 hover:bg-whiteHover dark:hover:bg-blackHover" @click="handleDefrag(network.network_id)">
                {{ t('actions.defrag') }}
              </button>
              <button class="flex-1 border-l border-gray-20 p-4 text-left bodyCompact01 transition-colors motion-productive-standard-fast-01 dark:border-coolGray-70 hover:bg-whiteHover dark:hover:bg-blackHover" @click="handleSimulation(network.network_id)">
                {{ t('actions.simulate') }}
              </button>
            </div>

            <!-- 主操作 (Edit) -->
            <button text="blue-60 active:blue-80 hover:blueH-60 left" class="w-24 border-2 border-blue-60 p-4 bodyCompact01 transition-colors motion-productive-standard-fast-01 active:border-blue-80 hover:border-blueH-60 hover:bg-whiteHover dark:hover:bg-blackHover" @click="handleEdit(network.network_id)">
              {{ t('actions.edit') }}
            </button>

            <!-- 导出操作 (Export) -->
            <button class="w-10 border-gray-20 p-4 text-center bodyCompact01 transition-colors motion-productive-standard-fast-01 dark:border-coolGray-70 hover:bg-whiteHover dark:hover:bg-blackHover" @click="handleExportNetwork(network.network_id, network.network_name)">
              <div class="i-carbon-download m-auto text-gray-60 dark:text-coolGray-40" />
            </button>

            <!-- 破坏性操作 (Delete) -->
            <button class="w-10 border-l border-gray-20 p-4 text-center bodyCompact01 transition-colors motion-productive-standard-fast-01 dark:border-coolGray-70 hover:bg-whiteHover dark:hover:bg-blackHover" @click="handleDelete(network.network_id, network.network_name)">
              <div class="i-carbon-trash-can m-auto text-red-60 dark:text-red-50" />
            </button>
          </div>
        </div>
      </TransitionGroup>
    </div>

    <!-- No data state -->
    <p v-else class="flex items-center justify-center gap-02 py-08 body01 text-gray-60 dark:text-coolGray-40">
      <i class="i-carbon-information heading01" />
      {{ t('network_management.no_networks_found') }}
    </p>
  </section>
</template>

<style scoped>
/* 进入过渡状态 */
.network-card-enter-active,
.network-card-leave-active {
  transition: all 0.5s ease; /* 应用于所有变化的属性 */
}

/* 进入动画的起始状态 */
.network-card-enter-from,
.network-card-leave-to {
  opacity: 0; /* 初始透明度为0 */
  transform: translateX(-30px); /* 元素从下方30px处滑入 */
}

/* 移动过渡状态（当有元素插入或删除导致其他元素位置变化时） */
.network-card-move {
  transition: transform 0.5s ease;
}
</style>
