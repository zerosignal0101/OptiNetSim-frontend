<!-- src/components/parameter-panels/services/DefragPanel.vue -->
<script setup lang="ts">
// SelectField is not strictly needed for display-only, but kept for consistency if needed later
// import SelectField from '~/components/common/SelectField.vue'
import type { WasmApi } from 'wdmview'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import InputField from '~/components/common/InputField.vue'

// Type definitions for defrag timeline events

interface ServiceData {
  service_id: number
  source_id: string
  destination_id: string
  arrival_time: number
  departure_time: number
  bit_rate: number // Assuming Mbps from sample JSON values (e.g., 110.0)
  power: number
  path: string[]
  wavelength: number
  snr_requirement: number
  gsnr: number
  utilization: number
}

// 1. ALLOCATION 事件的类型
interface AllocationEvent {
  timestamp: number
  event_type: 'ALLOCATION'
  service_id: number // 被分配的服务ID
  details: ServiceData // 详细信息就是 ServiceData
}

// 2. REALLOCATION 事件的类型
interface ReallocationEvent {
  timestamp: number
  event_type: 'REALLOCATION'
  service_id: number // 被重新分配的服务ID (注意这与 details.defrag_service_id 不同)
  details: ServiceData & {
    defrag_service_id: number // 标示这次重新分配是为哪个碎片整理后的最终分配服务
  }
}

// 3. RELEASE_EXPIRED 事件的类型
interface ReleaseExpiredEvent {
  timestamp: number
  event_type: 'RELEASE_EXPIRED'
  service_id: number // 被释放的服务ID
  details: {
    departure_time: number
  }
}

// 所有事件类型的联合
type DefragTimelineEvent = AllocationEvent | ReallocationEvent | ReleaseExpiredEvent

interface DefragResults {
  blocknum1: number
  blocknum2: number
}

// The parent's defragData structure
interface DefragTimelineData {
  result: DefragResults
  defrag_timeline_events: DefragTimelineEvent[] // 包含所有事件类型
}

const props = defineProps<{
  defragData: DefragTimelineData | null
  wasmApi: WasmApi | null
  isLoading: boolean // Passed from parent's `isDefragResultLoading`
  error: Error | null // Passed from parent's `defragError`
}>()

const { t } = useI18n()

// 计算阻塞数量的差值 (前 - 后)
const blocknumDiff = computed(() => {
  if (!props.defragData) {
    return 0
  }
  return props.defragData.result.blocknum1 - props.defragData.result.blocknum2
})

// (可选) 计算优化率
const improvementRate = computed(() => {
  if (!props.defragData) {
    return 0
  }
  if (props.defragData.result.blocknum1 === 0)
    return 0 // 避免除以0
  const rate = (blocknumDiff.value / props.defragData.result.blocknum1) * 100
  // 保留一位小数
  return Math.abs(Number(rate.toFixed(1)))
})

const selectedDefragServiceId = ref<number | null>(null)

// Group Reallocation events by defrag_service_id
const allocationData = computed(() => {
  if (!props.defragData?.defrag_timeline_events) {
    return {
      allocationMap: new Map<number, ServiceData>(),
      DefragAllocations: new Map<number, ServiceData[]>(),
    }
  }

  // 1. 构建 ALLOCATION Map
  const allocationMap = new Map<number, ServiceData>()
  for (const event of props.defragData.defrag_timeline_events) {
    if (event.event_type === 'ALLOCATION') {
      allocationMap.set(event.service_id, event.details)
    }
  }

  // 2. 构建 REALLOCATION Map
  const DefragAllocations = new Map<number, ServiceData[]>()
  for (const event of props.defragData.defrag_timeline_events) {
    if (event.event_type === 'REALLOCATION') {
      const defragId = event.details.defrag_service_id

      if (!DefragAllocations.has(defragId)) {
        DefragAllocations.set(defragId, [])
      }
      DefragAllocations.get(defragId)!.push(event.details)
    }
  }

  return {
    allocationMap,
    DefragAllocations,
  }
})

// Extract unique defrag_service_ids for the list, sorted for consistent display
const uniqueDefragServiceIds = computed(() => {
  return Array.from(allocationData.value.DefragAllocations.keys()).sort((a, b) => a - b)
})

// Current selected defrag service's details
const currentDefragServiceDetails = computed(() => {
  if (selectedDefragServiceId.value === null)
    return null
  const serviceData = allocationData.value.allocationMap.get(selectedDefragServiceId.value)
  // For simplicity, we display details from the first event found for this defrag_service_id.
  // In a real scenario, you might want to consider how to handle multiple reallocation events
  // for the same defrag_service_id if that's a possibility and requires aggregating information.
  return serviceData || null
})

// Function to send highlight command to WASM
function setHighlightOnWasm(serviceId: number | null) {
  if (props.wasmApi && serviceId !== null) {
    // The WASM API expects `number` for service_id.
    props.wasmApi.setHighlightDefragService(serviceId)
  }
  // Optional: If there's a requirement to "un-highlight" when nothing is selected,
  // you might need a specific API call or a 'null' service_id handling in WASM.
  // For now, we only highlight when a valid ID is available.
}

// Watch for changes in selectedDefragServiceId to update WASM
watch(selectedDefragServiceId, (newId) => {
  if (newId && allocationData.value.allocationMap.has(newId)) {
    setHighlightOnWasm(newId)
  }
})

// Automatically select the first defrag service when data loads or becomes available
watch(
  uniqueDefragServiceIds,
  (newIds) => {
    if (newIds.length > 0 && selectedDefragServiceId.value === null) {
      selectedDefragServiceId.value = newIds[0]
    }
  },
  { immediate: true }, // Run immediately if data is already present on initial render
)
</script>

<template>
  <div class="h-full flex flex-col overflow-y-auto p-4">
    <h3 class="mb-3 heading03 text-teal-70 dark:text-teal-30">
      {{ t('editor.defrag_panel.title') }}
    </h3>

    <!-- Loading State -->
    <div v-if="props.isLoading" class="flex flex-col items-center justify-center p-4">
      <div i-carbon-circle-dash animate-spin text="icon-size-2 blue-60" />
      <span text="blue-60 body01" class="ml-2">{{ t('editor.loading') }}</span>
    </div>

    <!-- Error State -->
    <div v-else-if="props.error" class="flex flex-col items-center justify-center p-4 text-red-60 dark:text-red-30">
      <div i-carbon-warning text="icon-size-2" />
      <span class="ml-2 body01">Error: {{ props.error.message }}</span>
    </div>

    <!-- No Data State -->
    <div v-else-if="!props.defragData || uniqueDefragServiceIds.length === 0" class="p-4 text-gray-70 dark:text-gray-30">
      {{ t('editor.defrag_panel.no_data') }}
    </div>

    <!-- Main Content -->
    <div v-else class="flex flex-grow flex-col">
      <div class="mb-4">
        <h4 class="mb-2 heading04">
          {{ t('editor.defrag_panel.service_list') }}
        </h4>

        <div class="flex items-center justify-between border border-gray-20 p-4">
          <!-- 整理前 -->
          <div class="text-center">
            <div class="heading01 text-gray-50 font-medium dark:text-gray-40">
              {{ t('editor.defrag_panel.before_defrag') }}
            </div>
            <div class="mt-1 expressiveHeading03 font-bold">
              {{ props.defragData.result.blocknum1 }}
            </div>
          </div>

          <!-- 中间的箭头和变化值 -->
          <div class="mx-2 flex flex-col items-center justify-center">
            <!-- 动态图标：成功为向下箭头，失败为向上箭头 -->
            <div
              class="mb-1 h-8 w-8 flex items-center justify-center rounded-full"
              :class="{
                'bg-green-10 text-green-50 dark:bg-green-90 dark:text-green-30': blocknumDiff > 0, // 阻塞减少是好的
                'bg-red-10 text-red-60 dark:bg-red-90 dark:text-red-30': blocknumDiff <= 0, // 阻塞增加是坏的
              }"
            >
              <!-- 使用 Heroicons 或其他图标库的内联 SVG -->
              <div v-if="blocknumDiff <= 0" i-carbon-arrow-up icon-size-2 />
              <div v-else i-carbon-arrow-down icon-size-2 />
            </div>
            <div
              v-if="blocknumDiff !== 0"
              class="mt-3 text-center label02"
              :class="{
                'text-green-60 dark:text-green-40': blocknumDiff > 0,
                'text-red-60 dark:text-red-40': blocknumDiff < 0,
              }"
            >
              {{ blocknumDiff > 0 ? '-' : blocknumDiff < 0 ? '+' : '' }}{{ Math.abs(blocknumDiff) }} ({{ improvementRate }} %)
            </div>
          </div>

          <!-- 整理后 -->
          <div class="text-center">
            <div class="heading01 text-gray-50 font-medium dark:text-gray-40">
              {{ t('editor.defrag_panel.after_defrag') }}
            </div>
            <div
              class="mt-1 expressiveHeading03 font-bold"
              :class="{
                'text-green-60 dark:text-green-40': blocknumDiff > 0,
                'text-gray-90 dark:text-white': blocknumDiff === 0,
                'text-red-60 dark:text-red-40': blocknumDiff < 0,
              }"
            >
              {{ props.defragData.result.blocknum2 }}
            </div>
          </div>
        </div>

        <div class="overflow-y-auto border border-gray-30 max-h-60 dark:border-gray-60">
          <ul class="divide-y divide-gray-20 dark:divide-gray-70">
            <li
              v-for="id in uniqueDefragServiceIds"
              :key="id"
              class="bg-white-10 cursor-pointer px-3 py-2 dark:bg-gray-80"
              :class="{
                'bg-blue-10 dark:bg-blue-90 text-blue-80 dark:text-blue-10': selectedDefragServiceId === id,
                'hover:bg-gray-50 dark:hover:bg-gray-70': selectedDefragServiceId !== id,
              }"
              @click="selectedDefragServiceId = id"
            >
              {{ t('editor.defrag_panel.list_item', { defragId: id }) }} {{ allocationData.allocationMap.has(id) ? 'Success' : 'Failed' }}
            </li>
          </ul>
        </div>
      </div>

      <!-- Divider -->
      <div class="mt-3 h-px w-full bg-gray-30 dark:bg-gray-70" />

      <!-- Details of selected Defrag Service -->
      <div v-if="currentDefragServiceDetails" class="mt-4 flex-grow">
        <h4 class="mb-3 heading04">
          {{ t('editor.defrag_panel.details') }}
        </h4>

        <InputField
          id="original-service-id"
          :model-value="currentDefragServiceDetails.service_id"
          :label="t('editor.defrag_panel.original_service_id')"
          type="number"
          :readonly="true"
          class="mb-2"
        />

        <InputField
          id="source-node-id"
          :model-value="currentDefragServiceDetails.source_id"
          :label="t('editor.service_params.source_id')"
          type="text"
          :readonly="true"
          class="mb-2"
        />

        <InputField
          id="destination-node-id"
          :model-value="currentDefragServiceDetails.destination_id"
          :label="t('editor.service_params.destination_id')"
          type="text"
          :readonly="true"
          class="mb-2"
        />

        <InputField
          id="arrival-time"
          :model-value="currentDefragServiceDetails.arrival_time"
          :label="t('editor.defrag_panel.arrival_time')"
          type="number"
          step="any"
          unit="s"
          :readonly="true"
          class="mb-2"
        />

        <InputField
          id="departure-time"
          :model-value="currentDefragServiceDetails.departure_time"
          :label="t('editor.defrag_panel.departure_time')"
          type="number"
          step="any"
          unit="s"
          :readonly="true"
          class="mb-2"
        />

        <InputField
          id="bit-rate"
          :model-value="currentDefragServiceDetails.bit_rate"
          :label="t('editor.defrag_panel.bit_rate')"
          type="number"
          unit="Gbit/s"
          step="any"
          :readonly="true"
          class="mb-2"
        />

        <InputField
          id="wavelength"
          :model-value="currentDefragServiceDetails.wavelength"
          :label="t('editor.defrag_panel.wavelength')"
          type="number"
          :readonly="true"
          class="mb-2"
        />

        <InputField
          id="snr-requirement"
          :model-value="currentDefragServiceDetails.snr_requirement"
          :label="t('editor.defrag_panel.snr_requirement')"
          type="number"
          unit="dB"
          step="any"
          :readonly="true"
          class="mb-2"
        />

        <InputField
          id="gsnr"
          :model-value="currentDefragServiceDetails.gsnr"
          :label="t('editor.defrag_panel.gsnr')"
          type="number"
          unit="dB"
          step="any"
          :readonly="true"
          class="mb-2"
        />

        <InputField
          id="utilization"
          :model-value="currentDefragServiceDetails.utilization"
          :label="t('editor.defrag_panel.utilization')"
          type="number"
          unit="%"
          step="any"
          :readonly="true"
          class="mb-2"
        />

        <!-- Path display -->
        <div class="mb-4">
          <label class="mb-1 block text-sm text-gray-70 font-medium dark:text-gray-30">
            {{ t('editor.defrag_panel.path') }}
          </label>
          <div class="break-words border border-gray-30 rounded bg-gray-50 px-3 py-2 text-sm dark:border-gray-60 dark:bg-gray-70">
            {{ currentDefragServiceDetails.path.join(' → \n') }}
          </div>
        </div>
      </div>
      <div v-else class="flex flex-grow items-center justify-center text-gray-50 dark:text-gray-40">
        {{ t('editor.defrag_panel.select_service_to_view') }}
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Add any specific styles for this component if needed */
.heading03 {
  @apply text-2xl font-semibold;
}
.heading04 {
  @apply text-xl font-medium;
}
.body01 {
  @apply text-base;
}
</style>
