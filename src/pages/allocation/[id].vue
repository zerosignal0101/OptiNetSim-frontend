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

const isAllocationResultLoading = ref<boolean>(false)
const allocationError = ref<Error | null>(null)
const allocationData = ref<any | null>(null) // **改为 ref 以使其响应式**

// Simulation parameters
const simulationParameters = ref({
  avg_arrival_interval: 1.0,
  avg_holding_time: 400.0,
  service_arrival_time_max: 100,
  service_max_bitrate: 600,
  num_channels: 80,
})

// Flag to track if user has triggered allocation manually
const hasRunAllocation = ref(false)

// Flag to track if allocation has been initialized (network loaded but no allocation yet)
const isAllocationInitialized = ref(false)

// Watch for networkDetail loading to mark as initialized (no automatic request)
watch(isNetworkDetailLoading, async (newVal) => {
  if (!newVal && !isAllocationInitialized.value) { // Once network details are loaded and not yet initialized
    isAllocationInitialized.value = true
    isAllocationResultLoading.value = false
    // console.log('Network details loaded, waiting for user to trigger allocation.')
  }
}, { immediate: true }) // 立即执行一次，以防 networkDetail 已经加载

// Function to handle parameter updates and allocation
async function handleAllocationRun() {
  isAllocationResultLoading.value = true
  allocationError.value = null
  hasRunAllocation.value = true

  try {
    wasmApi.value?.setNumChannels(simulationParameters.value.num_channels)

    const payload = { ...simulationParameters.value }
    const response = await networkApi.allocateKSPNetwork(networkId, payload)

    if (!response) {
      allocationError.value = new Error(`Failed to load allocation data: ${response.status} ${response.statusText}`)
      isAllocationResultLoading.value = false
      return
    }

    allocationData.value = response
    isAllocationResultLoading.value = false
  }
  catch (error) {
    allocationError.value = error instanceof Error ? error : new Error('Unknown error occurred')
    isAllocationResultLoading.value = false
  }
}

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

// Watch for network initialization to initialize WASM (Canvas exists)
watch(isAllocationInitialized, async (newVal) => {
  if (newVal && !wasmApi.value) { // Once network is loaded AND Canvas exists AND WASM not yet initialized
    // console.log('Canvas ready, initializing WASM...')
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
}, { immediate: true }) // 立即执行一次，以防 isAllocationInitialized 初始状态已经为 true

// WatchEffect to set up topology in WASM once all data and API are ready
watchEffect(async () => {
  if (
    !isNetworkDetailLoading.value
    && wasmApiReadyFlag.value
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
      // Potentially set a allocationError here as well if this is critical
      allocationError.value = new Error(`Error visualizing topology: ${err instanceof Error ? err.message : String(err)}`)
    }
  }
})

// WatchEffect to set up network topology in WASM when network is ready but allocation hasn't run yet
watchEffect(async () => {
  if (
    !isNetworkDetailLoading.value
    && wasmApiReadyFlag.value
    && networkDetail.value
    && !allocationData.value
    && wasmApi.value
  ) {
    // console.log('Network and WASM ready, setting network topology only...')
    try {
      const topologyData = {
        elements: networkDetail.value.elements,
        connections: networkDetail.value.connections,
        defrag_timeline_events: [], // Empty timeline events when no allocation data
      }
      const jsonString = JSON.stringify(topologyData)
      wasmApi.value.setFullTopology(jsonString)
      // console.log('Network topology set in WASM (no allocation data).')
    }
    catch (err) {
      console.error('Error setting network topology in WASM:', err)
      allocationError.value = new Error(`Error visualizing network topology: ${err instanceof Error ? err.message : String(err)}`)
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
        v-else-if="allocationError"
        class="absolute inset-0 flex items-center justify-center bg-red-10 text-red-60 dark:bg-red-90 dark:text-red-30"
      >
        <div i-carbon-warning text="icon-size-2" />
        <span class="ml-2 body01">Error: {{ allocationError.message }}</span>
      </div>

      <!-- Canvas -->
      <div
        v-else-if="isAllocationInitialized"
        flex="~ col"
        class="relative h-full w-full select-none"
      >
        <canvas id="canvas" class="wdmview-canvas" />

        <!-- Loading overlay (shown during allocation) -->
        <div
          v-if="isAllocationResultLoading"
          class="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 dark:bg-gray-100"
        >
          <div class="flex flex-col items-center">
            <div i-carbon-circle-dash animate-spin text="icon-size-2 blue-60 mb-2" />
            <span text="blue-60 body01">{{ t('editor.allocation_panel.running') }}</span>
          </div>
        </div>

        <!-- Show configuration overlay when no allocation data and not loading -->
        <div
          v-else-if="!allocationData"
          class="absolute inset-0 flex flex-col items-center justify-center bg-gray-10 dark:bg-gray-90"
        >
          <div i-carbon-settings text="icon-size-4 text-gray-60 dark:text-gray-40 mb-4" />
          <h3 class="text-heading-03 mb-2 text-gray-100 dark:text-gray-10">
            {{ t('simulation.parameter_config.ready_to_allocate') }}
          </h3>
          <p class="text-body-01 text-center text-gray-60 max-w-md dark:text-gray-40">
            {{ t('simulation.parameter_config.configure_and_run') }}
          </p>
        </div>

        <!-- Time slider (only show when allocation data exists and not loading) -->
        <div v-if="allocationData && !isAllocationResultLoading" class="absolute bottom-4 left-4 right-4 z-10">
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

    <!-- Sidebar for Allocation Panel -->
    <div class="w-96 overflow-y-auto border-l border-gray-30 shadow-md dark:border-gray-70">
      <!-- Parameter Configuration -->
      <div class="border-b border-gray-30 p-4 dark:border-gray-70">
        <AllocationParameterConfig
          v-model:parameters="simulationParameters"
          :is-loading="isAllocationResultLoading"
          @apply="handleAllocationRun"
        />
      </div>

      <!-- Allocation Panel -->
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
