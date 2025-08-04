<!-- src/views/NetworkListView.vue -->
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
  // 注意：fetchNetworks() 是异步的，这些 console.log 可能会在数据实际到达之前执行
  // 更好的做法是 watch data 的变化
})

watch(networks, (newVal) => {
  if (newVal) {
    console.warn('networks.value.networks:', newVal.networks) // 现在应该能正确访问
  }
})

// 监听错误
watch(networksError, (err) => {
  if (err) {
    console.error('获取网络列表失败:', err.message)
    // 可以在这里显示一个用户友好的错误消息，例如使用Toast或Notification
  }
})
</script>

<template>
  <div>
    <h1>光网络拓扑管理</h1>

    <section>
      <h2>网络列表</h2>
      <p v-if="isLoadingNetworks">
        加载中...
      </p>
      <p v-else-if="networksError">
        错误: {{ networksError.message }}
      </p>
      <ul v-else-if="networks?.networks?.length">
        <!-- 使用可选链确保 networks 和 networks.networks 都存在 -->
        <li v-for="network in networks.networks" :key="network.network_id">
          {{ network.network_name }} (ID: {{ network.network_id }})
        </li>
      </ul>
      <p v-else>
        没有网络数据。
      </p>
    </section>
  </div>
</template>
