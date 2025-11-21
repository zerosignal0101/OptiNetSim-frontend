<script setup lang="ts">
import type { WasmApi } from 'wdmview'
import { networkApi } from '~/composables/networkApi'
import { useNetworkLoader } from '~/composables/useNetworkLoader'

// // Dialog
// const dialog = useDialog()

// Router
const route = useRoute('/allocation/[id]')
const networkId = route.params.id

// I18n
const { t } = useI18n()

// Network graph data (v-network-graph)
const minimized = true
const {
  isLoading: isNetworkDetailLoading,
  apiError,
  networkDetail,
} = useNetworkLoader(networkId, minimized)

const wasmApiReadyFlag = ref<boolean>(false)
const wasmApi = ref<WasmApi | null>(null)

const isAllocationResultLoading = ref<boolean>(true)
const allocationError = ref<Error | null>(null)
const allocationData = ref<any | null>(null) // **改为 ref 以使其响应式**

// Watch for networkDetail loading to fetch defrag data
watch(isNetworkDetailLoading, async (newVal) => {
  if (!newVal) { // Once network details are loaded
    // console.log('Network details loaded, fetching defrag data...')
    const payload = {
      avg_arrival_interval: 1.0,
      avg_holding_time: 400.0,
      service_arrival_time_max: 1000,
    }
    const response = await networkApi.allocateKSPNetwork(networkId, payload)

    if (!response) {
      allocationError.value = new Error(`Failed to load defrag sample data: ${response.status} ${response.statusText}`)
      isAllocationResultLoading.value = false
      return
    }

    allocationData.value = response
    isAllocationResultLoading.value = false
    // console.log('Defrag data loaded.')
  }
}, { immediate: true }) // 立即执行一次，以防 networkDetail 已经加载

// 计算时间轴的范围 (min/max) - 扩展到所有业务完成
const timeRange = computed(() => {
  if (!allocationData.value?.defrag_timeline_events || allocationData.value.defrag_timeline_events.length === 0)
    return { min: 0, max: 100 } // 默认值

  // 收集所有时间相关数据
  const allTimestamps: number[] = []
  const allDepartureTimes: number[] = []

  for (const event of allocationData.value.defrag_timeline_events) {
    allTimestamps.push(event.timestamp)

    if (event.event_type === 'ALLOCATION') {
      // ALLOCATION 事件的 details 包含完整的 ServiceData
      allDepartureTimes.push(event.details.departure_time)
    }
    else if (event.event_type === 'RELEASE_EXPIRED') {
      // RELEASE_EXPIRED 事件的 details 只包含 departure_time
      allDepartureTimes.push(event.details.departure_time)
    }
  }

  // 计算真正的最小和最大时间
  const min = Math.min(...allTimestamps)
  // 确保覆盖所有业务时间，添加一点余量
  const max = Math.max(...allTimestamps, ...allDepartureTimes) + 0.1

  return { min, max }
})

// 管理当前时间的状态
const currentTime = ref<number>(0) // 用于 WASM 连续更新
const panelTime = ref<number>(0) // 用于 AllocationPanel 批量更新

// 监听时间轴范围变化，初始化时间值
watch(timeRange, (newRange) => {
  if (newRange && (currentTime.value === 0 && panelTime.value === 0)) {
    const startTime = newRange.min
    currentTime.value = startTime
    panelTime.value = startTime
  }
}, { immediate: true })

// 监听时间变化并通知 WASM（连续更新）
watch(currentTime, (newTime) => {
  if (wasmApi.value) {
    // console.log(`Setting WASM time selection to: ${newTime}`)
    wasmApi.value.setTimeSelection(newTime)
  }
})

// 处理连续更新（WASM）
function handleTimeUpdate(newTime: number) {
  currentTime.value = newTime
  if (wasmApi.value) {
    wasmApi.value.setTimeSelection(newTime) // 连续更新 WASM
  }
}

// 处理批量更新（服务列表）
function handleTimeChange(newTime: number) {
  panelTime.value = newTime // 只在松手时更新面板
}

// Watch for defragResultLoading to initialize WASM
watch(isAllocationResultLoading, async (newVal) => {
  if (!newVal && !wasmApi.value) { // Once defrag result is loaded AND WASM not yet initialized
    // console.log('Defrag data ready, initializing WASM...')
    try {
      const wdmview = await import('wdmview')
      try {
        wdmview.run_web()
      }
      catch (e) {
        // This catch is usually for 'call run_web multiple times', safe to ignore or log
        console.warn('wdmview.run_web called:', e)
      }
      await wdmview.getWasmReadyPromise() // Wait for WASM to be fully ready
      wasmApi.value = wdmview.getWasmApi()
      await wasmApi.value.attachCanvasToDom('canvas')
      wasmApiReadyFlag.value = true
      // console.log('WASM API initialized.')
    }
    catch (e) {
      console.error('Error initializing WASM:', e)
      allocationError.value = new Error(`Failed to initialize WASM: ${e instanceof Error ? e.message : String(e)}`)
    }
  }
}, { immediate: true }) // 立即执行一次，以防 defragResultLoading 初始状态已经为 false

// WatchEffect to set up topology in WASM once all data and API are ready
watchEffect(async () => {
  if (
    !isNetworkDetailLoading.value
    && wasmApiReadyFlag.value
    && !isAllocationResultLoading.value
    && networkDetail.value
    && allocationData.value
    && wasmApi.value
  ) {
    // console.log('All data and WASM ready, setting full topology...')
    try {
      const topologyData = {
        elements: networkDetail.value.elements,
        connections: networkDetail.value.connections,
        defrag_timeline_events: allocationData.value.defrag_timeline_events,
      }
      const jsonString = JSON.stringify(topologyData)
      wasmApi.value.setFullTopology(jsonString)
      // console.log('Topology set in WASM.')
    }
    catch (err) {
      console.error('Error setting full topology in WASM:', err)
      // Potentially set a defragError here as well if this is critical
      allocationError.value = new Error(`Error visualizing topology: ${err instanceof Error ? err.message : String(err)}`)
    }
  }
})

onUnmounted(() => {
  wasmApi.value?.destroyView()
})
</script>

<template>
  <div flex="~" class="h-screen overflow-hidden">
    <!-- Editor Main page -->
    <div flex="grow" class="relative">
      <!-- Loading/Error Overlays -->
      <div
        v-if="isNetworkDetailLoading"
        class="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-100"
      >
        <div i-carbon-circle-dash animate-spin text="icon-size-2 blue-60" />
        <span text="blue-60 body01" class="ml-2">{{ t('editor.loading') }}</span>
      </div>

      <div
        v-else-if="apiError"
        class="absolute inset-0 flex items-center justify-center bg-red-10 text-red-60 dark:bg-red-90 dark:text-red-30"
      >
        <div i-carbon-warning text="icon-size-2" />
        <span class="ml-2 body01">Error: {{ apiError.message }}</span>
      </div>

      <div
        v-else-if="isAllocationResultLoading"
        class="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-100"
      >
        <div i-carbon-circle-dash animate-spin text="icon-size-2 blue-60" />
        <span text="blue-60 body01" class="ml-2">{{ t('editor.allocation_panel.running') }}</span>
      </div>

      <div
        v-else-if="allocationError"
        class="absolute inset-0 flex items-center justify-center bg-red-10 text-red-60 dark:bg-red-90 dark:text-red-30"
      >
        <div i-carbon-warning text="icon-size-2" />
        <span class="ml-2 body01">Error: {{ allocationError.message }}</span>
      </div>

      <!-- Canvas -->
      <div v-else flex="~ col" class="h-full w-full select-none">
        <canvas id="canvas" class="wdmview-canvas" />
        <!-- ++ 新增：时间轴滑块，浮动在 Canvas 底部 -->
        <div class="absolute bottom-4 left-4 right-4 z-10">
          <TimeSlider
            :model-value="currentTime"
            :min="timeRange.min"
            :max="timeRange.max"
            @update:model-value="handleTimeUpdate"
            @change="handleTimeChange"
          />
        </div>
      </div>
    </div>

    <!-- Sidebar for DefragPanel -->
    <div class="w-96 border-l border-gray-30 shadow-md dark:border-gray-70">
      <AllocationPanel
        :allocation-data="allocationData"
        :wasm-api="wasmApiReadyFlag ? wasmApi : null"
        :is-loading="isAllocationResultLoading"
        :error="allocationError"
        :current-time="panelTime"
      />
    </div>
  </div>
</template>

<style>
/* 交互项样式 */
.interactive-item {
  @apply cursor-pointer rounded motion-productive-standard-fast-01;
}

.wdmview-canvas {
  width: 100%;
  height: calc(100vh);
  display: block;
  background-color: #000;
}
</style>

<route lang="yaml">
meta:
  layout: editor
</route>
