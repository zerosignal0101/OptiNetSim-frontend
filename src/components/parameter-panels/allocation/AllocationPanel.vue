<!-- src/components/parameter-panels/defrag/DefragPanel.vue -->
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

// ALLOCATION 事件的类型
interface AllocationEvent {
  timestamp: number
  event_type: 'ALLOCATION'
  service_id: number // 被分配的服务ID
  details: ServiceData // 详细信息就是 ServiceData
}

// RELEASE_EXPIRED 事件的类型
interface ReleaseExpiredEvent {
  timestamp: number
  event_type: 'RELEASE_EXPIRED'
  service_id: number // 被释放的服务ID
  details: {
    departure_time: number
  }
}

// 所有事件类型的联合
type AllocationTimelineEvent = AllocationEvent | ReleaseExpiredEvent

interface AllocationResults {
  blocknum1: number
  blocknum2: number
}

// The parent's allocationData structure
interface AllocationTimelineData {
  result: AllocationResults
  defrag_timeline_events: AllocationTimelineEvent[] // 包含所有事件类型（保持原字段名）
}

const props = defineProps<{
  allocationData: AllocationTimelineData | null
  wasmApi: WasmApi | null
  isLoading: boolean // Passed from parent's `isAllocationResultLoading`
  error: Error | null // Passed from parent's `allocationError`
  currentTime: number // 当前时间轴上的时间
}>()

// const emit = defineEmits(['serviceSelected'])  // 暂时不使用，避免时间跳转

const { t } = useI18n()

const selectedAllocationServiceId = ref<number | null>(null)

// 预处理：按时间排序的事件列表（缓存）
const sortedTimelineEvents = computed(() => {
  if (!props.allocationData?.defrag_timeline_events) {
    return []
  }
  return [...props.allocationData.defrag_timeline_events]
    .sort((a, b) => a.timestamp - b.timestamp)
})

// 基于当前时间计算服务状态
const servicesAtCurrentTime = computed(() => {
  const activeServices = new Map<number, ServiceData>()
  const releasedServices = new Set<number>()

  for (const event of sortedTimelineEvents.value) {
    // 只处理当前时间点之前的事件
    if (event.timestamp > props.currentTime) {
      break
    }

    if (event.event_type === 'ALLOCATION') {
      // 服务在当前时间活跃
      activeServices.set(event.service_id, event.details)
    }
    else if (event.event_type === 'RELEASE_EXPIRED') {
      // 服务被释放
      activeServices.delete(event.service_id)
      releasedServices.add(event.service_id)
    }
  }

  return {
    activeServices,
    releasedServices,
  }
})

// Extract unique service IDs for the list, sorted for consistent display
const uniqueServiceIds = computed(() => {
  return Array.from(servicesAtCurrentTime.value.activeServices.keys()).sort((a, b) => a - b)
})

// Current selected allocation service's details
const currentAllocationServiceDetails = computed(() => {
  if (selectedAllocationServiceId.value === null)
    return null
  return servicesAtCurrentTime.value.activeServices.get(selectedAllocationServiceId.value) || null
})

// Watch for changes in selectedAllocationServiceId (不再自动更新时间轴)
watch(selectedAllocationServiceId, (newId) => {
  if (newId) {
    const details = servicesAtCurrentTime.value.activeServices.get(newId)
    if (details) {
      // 只高亮服务，不改变时间轴位置
      // 用户点击服务时不应该跳转时间
    }
  }
})

function clearAllocationSelection() {
  // 只是清除选择，不改变时间轴位置
  selectedAllocationServiceId.value = null
}
</script>

<template>
  <div class="h-full w-full flex flex-col p-4">
    <h3 class="mb-3 heading03 text-teal-70 dark:text-teal-30">
      {{ t('editor.allocation_panel.title') }}
    </h3>

    <!-- 当前时间状态显示 -->
    <div class="dark:bg-blue-95 mb-3 border border-gray-30 p-3 dark:border-gray-70">
      <div class="flex items-center justify-between">
        <div class="body01 text-teal-80 font-medium dark:text-teal-30">
          {{ t('editor.allocation_panel.current_time') }}: {{ props.currentTime.toFixed(2) }}s
        </div>
        <div class="flex gap-4 body01">
          <div class="flex items-center gap-1">
            <div class="h-2 w-2 rounded-full bg-green-60 dark:bg-green-40" />
            <span class="text-gray-70 dark:text-gray-30">
              {{ t('editor.allocation_panel.status_active') }}: {{ servicesAtCurrentTime.activeServices.size }}
            </span>
          </div>
          <div class="flex items-center gap-1">
            <div class="h-2 w-2 rounded-full bg-orange-60 dark:bg-orange-40" />
            <span class="text-gray-70 dark:text-gray-30">
              {{ t('editor.allocation_panel.status_released') }}: {{ servicesAtCurrentTime.releasedServices.size }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="props.isLoading" class="flex flex-col items-center justify-center p-4">
      <div i-carbon-circle-dash animate-spin text="icon-size-2 blue-60" />
      <span text="blue-60 body01" class="ml-2">{{ t('editor.loading') }}</span>
    </div>

    <!-- Error State -->
    <div v-else-if="props.error" class="flex flex-col items-center justify-center p-4 text-red-60 dark:text-red-30">
      <div i-carbon-warning text="icon-size-2" />
      <span class="ml-2 body01">{{ t('editor.allocation_panel.error') }}: {{ props.error.message }}</span>
    </div>

    <!-- No Data State -->
    <div v-else-if="!props.allocationData || uniqueServiceIds.length === 0" class="p-4 text-gray-70 dark:text-gray-30">
      {{ t('editor.allocation_panel.no_data') }}
    </div>

    <!-- Main Content -->
    <div v-else class="flex flex-grow flex-col overflow-hidden">
      <div v-if="!currentAllocationServiceDetails" class="mb-4 h-full flex flex-col">
        <h4 class="mb-2 heading02">
          {{ t('editor.allocation_panel.service_list') }}
          <span class="ml-2 text-sm text-gray-60 font-normal dark:text-gray-40">
            ({{ uniqueServiceIds.length }} services active)
          </span>
        </h4>

        <!-- 滚动列表容器 -->
        <div class="min-h-0 flex-grow overflow-y-auto border border-gray-30 dark:border-gray-60">
          <ul class="divide-y divide-gray-20 dark:divide-gray-70">
            <li
              v-for="id in uniqueServiceIds"
              :key="id"
              class="cursor-pointer px-3 py-2 dark:bg-gray-80"
              :class="{
                'bg-blue-10 dark:bg-blue-90 text-blue-80 dark:text-blue-10': selectedAllocationServiceId === id,
                'hover:bg-white-hover dark:hover:bg-gray-70': selectedAllocationServiceId !== id,
              }"
              @click="selectedAllocationServiceId = id"
            >
              <!-- 显示分配事件ID和到达时间 -->
              <div class="flex items-center justify-between">
                <div>
                  {{ t('editor.allocation_panel.list_item', { serviceId: id }) }}
                  <div class="text-xs text-gray-60 dark:text-gray-40">
                    {{ t('editor.allocation_panel.arrived_time', { time: servicesAtCurrentTime.activeServices.get(id)?.arrival_time.toFixed(2) }) }}s
                  </div>
                </div>
                <span class="rounded-full bg-green-10 px-2 py-0.5 text-xs text-green-80 dark:bg-green-90 dark:text-green-30">
                  {{ t('editor.allocation_panel.status_active') }}
                </span>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <!-- 详情页 -->
      <div v-else class="mt-4 flex flex-grow flex-col overflow-hidden">
        <!-- 详情标题 -->
        <div class="flex flex-shrink-0">
          <h4 class="mb-3 heading02">
            {{ t('editor.allocation_panel.details_for_service', { serviceId: selectedAllocationServiceId }) }}
          </h4>
          <div i-carbon-close icon-size-2 class="ml-auto mr-3 mt-1 cursor-pointer" @click="clearAllocationSelection" />
        </div>

        <!-- 滚动内容容器 -->
        <div class="min-h-0 flex-grow overflow-y-auto pr-2">
          <div class="mt-4">
            <h5 class="mb-3 heading01 text-gray-80 dark:text-gray-20">
              {{ t('editor.allocation_panel.parameters_for_service') }}
            </h5>
            <!-- ... 原有的 InputField 保持不变 ... -->
            <InputField
              id="original-service-id"
              :model-value="currentAllocationServiceDetails.service_id"
              :label="t('editor.allocation_panel.original_service_id')"
              type="number"
              :readonly="true"
              class="mb-2"
            />
            <!-- ... 其他 InputField ... -->
            <InputField
              id="source-node-id"
              :model-value="currentAllocationServiceDetails.source_id"
              :label="t('editor.service_params.source_id')"
              type="text"
              :readonly="true"
              class="mb-2"
            />
            <InputField
              id="destination-node-id"
              :model-value="currentAllocationServiceDetails.destination_id"
              :label="t('editor.service_params.destination_id')"
              type="text"
              :readonly="true"
              class="mb-2"
            />
            <InputField
              id="arrival-time"
              :model-value="currentAllocationServiceDetails.arrival_time"
              :label="t('editor.allocation_panel.arrival_time')"
              type="number"
              step="any"
              unit="s"
              :readonly="true"
              class="mb-2"
            />
            <InputField
              id="departure-time"
              :model-value="currentAllocationServiceDetails.departure_time"
              :label="t('editor.allocation_panel.departure_time')"
              type="number"
              step="any"
              unit="s"
              :readonly="true"
              class="mb-2"
            />
            <InputField
              id="bit-rate"
              :model-value="currentAllocationServiceDetails.bit_rate"
              :label="t('editor.allocation_panel.bit_rate')"
              type="number"
              unit="Gbit/s"
              step="any"
              :readonly="true"
              class="mb-2"
            />
            <InputField
              id="wavelength"
              :model-value="currentAllocationServiceDetails.wavelength"
              :label="t('editor.allocation_panel.wavelength')"
              type="number"
              :readonly="true"
              class="mb-2"
            />
            <InputField
              id="snr-requirement"
              :model-value="currentAllocationServiceDetails.snr_requirement"
              :label="t('editor.allocation_panel.snr_requirement')"
              type="number"
              unit="dB"
              step="any"
              :readonly="true"
              class="mb-2"
            />
            <InputField
              id="gsnr"
              :model-value="currentAllocationServiceDetails.gsnr"
              :label="t('editor.allocation_panel.gsnr')"
              type="number"
              unit="dB"
              step="any"
              :readonly="true"
              class="mb-2"
            />
            <InputField
              id="utilization"
              :model-value="currentAllocationServiceDetails.utilization"
              :label="t('editor.allocation_panel.utilization')"
              type="number"
              unit="%"
              step="any"
              :readonly="true"
              class="mb-2"
            />
          </div>
          <div class="mb-4">
            <label class="mb-1 block text-sm text-gray-70 font-medium dark:text-gray-30">
              {{ t('editor.allocation_panel.path') }}
            </label>
            <div class="break-words border border-gray-30 rounded px-3 py-2 text-sm dark:border-gray-60">
              {{ currentAllocationServiceDetails.path.join(' → \n') }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 可以在这里添加滚动条样式等 */
.pr-2 {
  padding-right: 0.5rem;
}
</style>
