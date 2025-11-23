<!-- src/pages/defrag/[id].vue -->
<script setup lang="ts">
import type { WasmApi } from 'wdmview'
import { networkApi } from '~/composables/networkApi'
import { useNetworkLoader } from '~/composables/useNetworkLoader'

// // Dialog
// const dialog = useDialog()

// Router
const route = useRoute('/defrag/[id]')
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

const isDefragResultLoading = ref<boolean>(false)
const defragError = ref<Error | null>(null)
const defragData = ref<any | null>(null) // **改为 ref 以使其响应式**

// Simulation parameters
const simulationParameters = ref({
  avg_arrival_interval: 1.0,
  avg_holding_time: 400.0,
  service_arrival_time_max: 1000,
})

// Flag to track if user has triggered defrag manually
const hasRunDefrag = ref(false)

// Flag to track if defrag has been initialized (network loaded but no defrag yet)
const isDefragInitialized = ref(false)

// Watch for networkDetail loading to mark as initialized (no automatic request)
watch(isNetworkDetailLoading, async (newVal) => {
  if (!newVal && !isDefragInitialized.value) { // Once network details are loaded and not yet initialized
    isDefragInitialized.value = true
    isDefragResultLoading.value = false
    // console.log('Network details loaded, waiting for user to trigger defrag.')
  }
}, { immediate: true }) // 立即执行一次，以防 networkDetail 已经加载

// Function to handle parameter updates and defrag run
async function handleDefragRun() {
  isDefragResultLoading.value = true
  defragError.value = null
  hasRunDefrag.value = true

  try {
    const payload = { ...simulationParameters.value }
    const response = await networkApi.defragNetwork(networkId, payload)

    if (!response) {
      defragError.value = new Error(`Failed to load defrag data`)
      isDefragResultLoading.value = false
      return
    }

    defragData.value = response
    isDefragResultLoading.value = false
  }
  catch (error) {
    defragError.value = error instanceof Error ? error : new Error('Unknown error occurred')
    isDefragResultLoading.value = false
  }
}

// 管理当前时间的状态
const currentTime = ref<number>(0)

// 计算时间轴的范围 (min/max)
const timeRange = computed(() => {
  if (!defragData.value?.defrag_timeline_events || defragData.value.defrag_timeline_events.length === 0)
    return { min: 0, max: 100 } // 默认值

  const timestamps = defragData.value.defrag_timeline_events.map((event: any) => event.timestamp)
  // const departureTimes = defragData.value.defrag_timeline_events.map((event: any) => event.details.departure_time)
  const min = Math.min(...timestamps)
  const max = Math.max(...timestamps) + 1e-5

  return { min, max }
})

// 监听时间变化并通知 WASM
watch(currentTime, (newTime) => {
  if (wasmApi.value) {
    // console.log(`Setting WASM time selection to: ${newTime}`)
    wasmApi.value.setTimeSelection(newTime)
  }
})

// 处理从 DefragPanel 发来的事件
function handleServiceSelection(arrivalTime: number) {
  currentTime.value = arrivalTime
}

// Watch for network initialization to initialize WASM (Canvas exists)
watch(isDefragInitialized, async (newVal) => {
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
      defragError.value = new Error(`Failed to initialize WASM: ${e instanceof Error ? e.message : String(e)}`)
    }
  }
}, { immediate: true }) // 立即执行一次，以防 isDefragInitialized 初始状态已经为 true

// WatchEffect to set up topology in WASM once all data and API are ready
watchEffect(async () => {
  if (
    !isNetworkDetailLoading.value
    && wasmApiReadyFlag.value
    && networkDetail.value
    && defragData.value
    && wasmApi.value
  ) {
    // console.log('All data and WASM ready, setting full topology...')
    try {
      const topologyData = {
        elements: networkDetail.value.elements,
        connections: networkDetail.value.connections,
        defrag_timeline_events: defragData.value.defrag_timeline_events,
      }
      const jsonString = JSON.stringify(topologyData)
      wasmApi.value.setFullTopology(jsonString)
      // console.log('Topology set in WASM.')
    }
    catch (err) {
      console.error('Error setting full topology in WASM:', err)
      // Potentially set a defragError here as well if this is critical
      defragError.value = new Error(`Error visualizing topology: ${err instanceof Error ? err.message : String(err)}`)
    }
  }
})

// WatchEffect to set up network topology in WASM when network is ready but defrag hasn't run yet
watchEffect(async () => {
  if (
    !isNetworkDetailLoading.value
    && wasmApiReadyFlag.value
    && networkDetail.value
    && !defragData.value
    && wasmApi.value
  ) {
    // console.log('Network and WASM ready, setting network topology only...')
    try {
      const topologyData = {
        elements: networkDetail.value.elements,
        connections: networkDetail.value.connections,
        defrag_timeline_events: [], // Empty timeline events when no defrag data
      }
      const jsonString = JSON.stringify(topologyData)
      wasmApi.value.setFullTopology(jsonString)
      // console.log('Network topology set in WASM (no defrag data).')
    }
    catch (err) {
      console.error('Error setting network topology in WASM:', err)
      defragError.value = new Error(`Error visualizing network topology: ${err instanceof Error ? err.message : String(err)}`)
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
        v-else-if="defragError"
        class="absolute inset-0 flex items-center justify-center bg-red-10 text-red-60 dark:bg-red-90 dark:text-red-30"
      >
        <div i-carbon-warning text="icon-size-2" />
        <span class="ml-2 body01">Error: {{ defragError.message }}</span>
      </div>

      <!-- Canvas -->
      <div
        v-else-if="isDefragInitialized"
        flex="~ col"
        class="relative h-full w-full select-none"
      >
        <canvas id="canvas" class="wdmview-canvas" />

        <!-- Loading overlay (shown during defrag) -->
        <div
          v-if="isDefragResultLoading"
          class="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 dark:bg-gray-100"
        >
          <div class="flex flex-col items-center">
            <div i-carbon-circle-dash animate-spin text="icon-size-2 blue-60 mb-2" />
            <span text="blue-60 body01">{{ t('editor.defrag_running') }}</span>
          </div>
        </div>

        <!-- Show configuration overlay when no defrag data and not loading -->
        <div
          v-else-if="!defragData"
          class="absolute inset-0 flex flex-col items-center justify-center bg-gray-10 dark:bg-gray-90"
        >
          <div i-carbon-settings text="icon-size-4 text-gray-60 dark:text-gray-40 mb-4" />
          <h3 class="text-heading-03 mb-2 text-gray-100 dark:text-gray-10">
            {{ t('simulation.parameter_config.ready_to_defrag') }}
          </h3>
          <p class="text-body-01 text-center text-gray-60 max-w-md dark:text-gray-40">
            {{ t('simulation.parameter_config.configure_and_run_defrag') }}
          </p>
        </div>

        <!-- Time slider (only show when defrag data exists and not loading) -->
        <div v-if="defragData && !isDefragResultLoading" class="absolute bottom-4 left-4 right-4 z-10">
          <TimeSlider
            v-model="currentTime"
            :min="timeRange.min"
            :max="timeRange.max"
          />
        </div>
      </div>
    </div>

    <!-- Sidebar for Defrag Panel -->
    <div class="w-96 overflow-y-auto border-l border-gray-30 shadow-md dark:border-gray-70">
      <!-- Parameter Configuration -->
      <div class="border-b border-gray-30 p-4 dark:border-gray-70">
        <SimulationParameterConfig
          v-model:parameters="simulationParameters"
          :is-loading="isDefragResultLoading"
          @apply="handleDefragRun"
        />
      </div>

      <!-- Defrag Panel -->
      <DefragPanel
        :defrag-data="defragData"
        :wasm-api="wasmApiReadyFlag ? wasmApi : null"
        :is-loading="isDefragResultLoading"
        :error="defragError"
        @service-selected="handleServiceSelection"
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
