<!-- src/pages/defrag/[id].vue -->
<script setup lang="ts">
import type { WasmApi } from 'wdmview'
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

const isDefragResultLoading = ref<boolean>(true)
const defragError = ref<Error | null>(null)
const defragData = ref<any | null>(null) // **改为 ref 以使其响应式**

// Watch for networkDetail loading to fetch defrag data
watch(isNetworkDetailLoading, async (newVal) => {
  if (!newVal) { // Once network details are loaded
    // console.log('Network details loaded, fetching defrag data...')
    const response = await fetch('/data/sample_topology_defrag.json') // 使用你的本地 JSON 路径
    // const url = `http://localhost:8000/api/v1/networks/${networkId}/defrag`
    // const payload = {
    //   avg_arrival_interval: 1,
    //   avg_holding_time: 400,
    //   service_arrival_time_max: 100,
    // }
    // const response = await fetch(url, { method: 'POST', body: JSON.stringify(payload) })

    if (!response.ok) {
      defragError.value = new Error(`Failed to load defrag sample data: ${response.status} ${response.statusText}`)
      isDefragResultLoading.value = false
      return
    }

    defragData.value = await response.json()
    isDefragResultLoading.value = false
    // console.log('Defrag data loaded.')
  }
}, { immediate: true }) // 立即执行一次，以防 networkDetail 已经加载

// Watch for defragResultLoading to initialize WASM
watch(isDefragResultLoading, async (newVal) => {
  if (!newVal && !wasmApi.value) { // Once defrag result is loaded AND WASM not yet initialized
    // console.log('Defrag data ready, initializing WASM...')
    try {
      const wdmview = await import('wdmview')
      try {
        wdmview.run_web() // Attempt to run web, might warn if already called
      }
      catch (e) {
        // This catch is usually for 'call run_web multiple times', safe to ignore or log
        console.warn('wdmview.run_web possibly called multiple times:', e)
      }
      await wdmview.getWasmReadyPromise() // Wait for WASM to be fully ready
      wasmApi.value = wdmview.getWasmApi()
      wasmApiReadyFlag.value = true
      // console.log('WASM API initialized.')
    }
    catch (e) {
      console.error('Error initializing WASM:', e)
      defragError.value = new Error(`Failed to initialize WASM: ${e instanceof Error ? e.message : String(e)}`)
    }
  }
}, { immediate: true }) // 立即执行一次，以防 defragResultLoading 初始状态已经为 false

// WatchEffect to set up topology in WASM once all data and API are ready
watchEffect(async () => {
  if (
    !isNetworkDetailLoading.value
    && wasmApiReadyFlag.value
    && !isDefragResultLoading.value
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
        v-else-if="isDefragResultLoading"
        class="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-100"
      >
        <div i-carbon-circle-dash animate-spin text="icon-size-2 blue-60" />
        <span text="blue-60 body01" class="ml-2">{{ t('editor.defrag_running') }}</span>
      </div>

      <div
        v-else-if="defragError"
        class="absolute inset-0 flex items-center justify-center bg-red-10 text-red-60 dark:bg-red-90 dark:text-red-30"
      >
        <div i-carbon-warning text="icon-size-2" />
        <span class="ml-2 body01">Error: {{ defragError.message }}</span>
      </div>

      <!-- Canvas -->
      <div v-else flex="~ col" class="h-full w-full select-none">
        <canvas id="canvas" class="wdmview-canvas" />
      </div>
    </div>

    <!-- Sidebar for DefragPanel -->
    <div class="w-96 overflow-y-auto border-l border-gray-30 shadow-md dark:border-gray-70">
      <DefragPanel
        :defrag-data="defragData"
        :wasm-api="wasmApiReadyFlag ? wasmApi : null"
        :is-loading="isDefragResultLoading"
        :error="defragError"
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
  height: 100%;
  display: block;
  background-color: #000;
}
</style>

<route lang="yaml">
meta:
  layout: editor
</route>
