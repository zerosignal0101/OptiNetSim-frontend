<script setup lang="ts">
interface AllocationParameters {
  avg_arrival_interval: number
  avg_holding_time: number
  service_arrival_time_max: number
  service_max_bitrate: number
  num_channels: number
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
})

const emit = defineEmits<Emits>()

// 定义波段的数据结构
const BANDS = [
  { key: 'S', name: 'S Band', range: '1460–1530 nm', color: 'bg-purple-50', colorLight: 'bg-purple-10' },
  { key: 'C', name: 'C Band', range: '1530–1565 nm', color: 'bg-teal-50', colorLight: 'bg-teal-10' },
  { key: 'L', name: 'L Band', range: '1565–1625 nm', color: 'bg-orange-50', colorLight: 'bg-orange-10' },
  { key: 'U', name: 'U Band', range: '1625–1675 nm', color: 'bg-magenta-50', colorLight: 'bg-magenta-10' },
]

// 定义可选的通道配置
const CHANNEL_OPTIONS = [
  {
    value: 40,
    label: '40',
    subLabel: 'C Band Only',
    activeBands: ['C'],
  },
  {
    value: 80,
    label: '80',
    subLabel: 'C + L',
    activeBands: ['C', 'L'],
  },
  {
    value: 120,
    label: '120',
    subLabel: 'C + L + S',
    activeBands: ['S', 'C', 'L'],
  },
  {
    value: 160,
    label: '160',
    subLabel: 'Full Spectrum',
    activeBands: ['S', 'C', 'L', 'U'],
  },
]

interface Props {
  parameters: AllocationParameters
  isLoading?: boolean
}

interface Emits {
  (e: 'update:parameters', parameters: AllocationParameters): void
  (e: 'apply'): void
}

// I18n
const { t } = useI18n()

// Create separate refs for each parameter to avoid recursive updates
const avgHoldingTime = ref(props.parameters.avg_holding_time)
const serviceArrivalTimeMax = ref(props.parameters.service_arrival_time_max)
const numChannels = ref(props.parameters.num_channels)
const serviceMaxBitrate = ref(props.parameters.service_max_bitrate)

// Watch local changes and emit updates
watch([avgHoldingTime, serviceArrivalTimeMax, serviceMaxBitrate, numChannels], ([newHoldingTime, newArrivalTimeMax, serviceMaxBitrate, numChannels]) => {
  emit('update:parameters', {
    avg_arrival_interval: props.parameters.avg_arrival_interval,
    avg_holding_time: newHoldingTime,
    service_arrival_time_max: newArrivalTimeMax,
    service_max_bitrate: serviceMaxBitrate,
    num_channels: numChannels,
  })
}, { deep: true })

// Update local values when props change
watch(() => props.parameters, (newParams) => {
  avgHoldingTime.value = newParams.avg_holding_time
  serviceArrivalTimeMax.value = newParams.service_arrival_time_max
}, { deep: true })

// Validation functions
function validateHoldingTime(value: number) {
  return value > 0 && value <= 10000
}

function validateArrivalTimeMax(value: number) {
  return value > 0 && value <= 10000
}

function validateMaxBitrate(value: number) {
  return value >= 400 && value <= 800
}

// 计算当前激活的波段对象用于高亮显示
const activeBandsConfig = computed(() => {
  const option = CHANNEL_OPTIONS.find(opt => opt.value === numChannels.value)
  return option ? option.activeBands : []
})

// Handle apply button click
function handleApply() {
  if (validateHoldingTime(avgHoldingTime.value)
    && validateArrivalTimeMax(serviceArrivalTimeMax.value)
    && validateMaxBitrate(serviceMaxBitrate.value)) {
    emit('apply')
  }
}

// Check if parameters are valid
const isParametersValid = computed(() => {
  return validateHoldingTime(avgHoldingTime.value)
    && validateArrivalTimeMax(serviceArrivalTimeMax.value)
    && validateMaxBitrate(serviceMaxBitrate.value)
})

function handleSelectChannels(val: number) {
  if (!props.isLoading) {
    numChannels.value = val
  }
}
</script>

<template>
  <div class="bg-white p-4 dark:border-gray-70 dark:bg-gray-80">
    <h2 class="mb-4 heading03 text-teal-70 dark:text-teal-30">
      {{ t('simulation.parameter_config.title') }}
    </h2>

    <div class="space-y-4">
      <!-- avg_arrival_interval (fixed) -->
      <div>
        <label class="mb-1 block body01 text-gray-80 dark:text-gray-20">
          {{ t('simulation.parameter_config.avg_arrival_interval') }}
        </label>
        <div class="flex items-center space-x-2">
          <input
            type="number"
            :value="props.parameters.avg_arrival_interval"
            disabled
            class="w-full cursor-not-allowed border border-gray-40 bg-gray-20 px-3 py-2 text-gray-60 dark:border-gray-60 dark:bg-gray-70 dark:text-gray-40"
          >
          <span class="body01 text-gray-60 dark:text-gray-40">
            {{ t('simulation.parameter_config.time_unit') }}
          </span>
        </div>
        <p class="mt-1 bodyCompact01 text-gray-60 dark:text-gray-40">
          {{ t('simulation.parameter_config.avg_arrival_interval_desc') }}
        </p>
      </div>

      <!-- avg_holding_time -->
      <div>
        <label for="avg_holding_time" class="mb-1 block body01 text-gray-80 dark:text-gray-20">
          {{ t('simulation.parameter_config.avg_holding_time') }}
        </label>
        <div class="flex items-center space-x-2">
          <input
            id="avg_holding_time"
            v-model.number="avgHoldingTime"
            type="number"
            min="1"
            max="10000"
            step="0.1"
            :disabled="isLoading"
            class="w-full border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-50" :class="[
              avgHoldingTime <= 0 || avgHoldingTime > 10000
                ? 'border-red-50 dark:border-red-60'
                : 'border-gray-40 dark:border-gray-60',
              isLoading ? 'bg-gray-20 dark:bg-gray-70 text-gray-60 dark:text-gray-40 cursor-not-allowed' : 'bg-white dark:bg-gray-80 text-gray-100 dark:text-gray-10',
            ]"
          >
          <span class="body01 text-gray-60 dark:text-gray-40">
            {{ t('simulation.parameter_config.time_unit') }}
          </span>
        </div>
        <p class="mt-1 bodyCompact01 text-gray-60 dark:text-gray-40">
          {{ t('simulation.parameter_config.avg_holding_time_desc') }}
        </p>
        <p
          v-if="avgHoldingTime <= 0 || avgHoldingTime > 10000"
          class="mt-1 bodyCompact01 text-red-60 dark:text-red-40"
        >
          {{ t('simulation.parameter_config.holding_time_error') }}
        </p>
      </div>

      <!-- service_arrival_time_max -->
      <div>
        <label for="service_arrival_time_max" class="mb-1 block body01 text-gray-80 dark:text-gray-20">
          {{ t('simulation.parameter_config.service_arrival_time_max') }}
        </label>
        <div class="flex items-center space-x-2">
          <input
            id="service_arrival_time_max"
            v-model.number="serviceArrivalTimeMax"
            type="number"
            min="1"
            max="10000"
            step="1"
            :disabled="isLoading"
            class="w-full border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-50" :class="[
              serviceArrivalTimeMax <= 0 || serviceArrivalTimeMax > 10000
                ? 'border-red-50 dark:border-red-60'
                : 'border-gray-40 dark:border-gray-60',
              isLoading ? 'bg-gray-20 dark:bg-gray-70 text-gray-60 dark:text-gray-40 cursor-not-allowed' : 'bg-white dark:bg-gray-80 text-gray-100 dark:text-gray-10',
            ]"
          >
          <span class="body01 text-gray-60 dark:text-gray-40">
            {{ t('simulation.parameter_config.time_unit') }}
          </span>
        </div>
        <p class="mt-1 bodyCompact01 text-gray-60 dark:text-gray-40">
          {{ t('simulation.parameter_config.service_arrival_time_max_desc') }}
        </p>
        <p
          v-if="serviceArrivalTimeMax <= 0 || serviceArrivalTimeMax > 10000"
          class="mt-1 bodyCompact01 text-red-60 dark:text-red-40"
        >
          {{ t('simulation.parameter_config.arrival_time_max_error') }}
        </p>
      </div>

      <!-- service_max_bitrate -->
      <div>
        <label for="service_max_bitrate" class="mb-1 block body01 text-gray-80 dark:text-gray-20">
          {{ t('simulation.parameter_config.service_max_bitrate') }}
        </label>
        <div class="flex items-center space-x-2">
          <input
            id="service_max_bitrate"
            v-model.number="serviceMaxBitrate"
            type="number"
            min="400"
            max="800"
            step="1"
            :disabled="isLoading"
            class="w-full border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-50" :class="[
              !validateMaxBitrate(serviceMaxBitrate)
                ? 'border-red-50 dark:border-red-60'
                : 'border-gray-40 dark:border-gray-60',
              isLoading ? 'bg-gray-20 dark:bg-gray-70 text-gray-60 dark:text-gray-40 cursor-not-allowed' : 'bg-white dark:bg-gray-80 text-gray-100 dark:text-gray-10',
            ]"
          >
          <span class="body01 text-gray-60 dark:text-gray-40">
            {{ t('simulation.parameter_config.bitrate_unit') }}
          </span>
        </div>
        <p class="mt-1 bodyCompact01 text-gray-60 dark:text-gray-40">
          {{ t('simulation.parameter_config.service_max_bitrate_desc') }}
        </p>
        <p
          v-if="!validateMaxBitrate(serviceMaxBitrate)"
          class="mt-1 bodyCompact01 text-red-60 dark:text-red-40"
        >
          {{ t('simulation.parameter_config.service_max_bitrate_error') }}
        </p>
      </div>

      <!-- num_channels -->
      <div>
        <label class="mb-3 block body01 text-gray-80 dark:text-gray-20">
          {{ t('simulation.parameter_config.num_channels') }}
        </label>

        <!-- 1. 选择按钮组 -->
        <div class="grid grid-cols-4 mb-2 gap-2">
          <button
            v-for="option in CHANNEL_OPTIONS"
            :key="option.value"
            type="button"
            :disabled="isLoading"
            class="flex flex-col items-center justify-center border rounded-md py-2 transition-all duration-200"
            :class="[
              numChannels === option.value
                ? 'border-blue-60 text-blue-70 ring-1 ring-blue-60 dark:border-blue-50 dark:bg-blue-90 dark:text-blue-20'
                : 'border-gray-30 bg-white text-gray-80 hover:border-gray-40 hover:bg-gray-10 dark:border-gray-60 dark:bg-gray-80 dark:text-gray-20 dark:hover:bg-gray-70',
              isLoading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
            ]"
            @click="handleSelectChannels(option.value)"
          >
            <span class="label02 font-semibold">{{ option.label }}</span>
            <span class="text-[10px] opacity-80">{{ option.subLabel }}</span>
          </button>
        </div>

        <p class="mb-4 bodyCompact01 text-gray-60 dark:text-gray-40">
          {{ t('simulation.parameter_config.num_channels_desc') }}
        </p>

        <!-- 2. 光谱可视化条 -->
        <div class="overflow-hidden border border-gray-30 rounded-md dark:border-gray-60">
          <div class="h-8 w-full flex">
            <div
              v-for="band in BANDS"
              :key="band.key"
              class="flex flex-1 items-center justify-center label02 text-white font-bold transition-all motion-productive-standard-fast-01"
              :class="[
                activeBandsConfig.includes(band.key)
                  ? band.color
                  : 'bg-gray-20 text-gray-50 dark:bg-gray-70 dark:text-gray-50',
              ]"
              :title="`${band.name}: ${band.range}`"
            >
              <span v-if="activeBandsConfig.includes(band.key)">{{ band.key }}</span>
            </div>
          </div>
          <!-- 波段标签/波长范围 -->
          <div class="flex bg-gray-10 py-1 dark:bg-gray-90">
            <div
              v-for="band in BANDS"
              :key="band.key"
              class="flex-1 border-r border-gray-20 px-1 text-center text-[10px] text-gray-60 last:border-0 dark:border-gray-70 dark:text-gray-40"
            >
              {{ band.range }}
            </div>
          </div>
        </div>
      </div>

      <!-- Apply button -->
      <div class="border-t border-gray-30 pt-2 dark:border-gray-70">
        <button
          :disabled="isLoading || !isParametersValid"
          class="w-full px-4 py-2 font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-50"
          :class="[
            isLoading || !isParametersValid
              ? 'bg-gray-40 dark:bg-gray-60 text-gray-60 dark:text-gray-40 cursor-not-allowed'
              : 'bg-blue-60 hover:bg-blue-70 text-white dark:bg-blue-50 dark:hover:bg-blue-60 dark:text-gray-10',
          ]" @click="handleApply"
        >
          <span v-if="isLoading" class="flex items-center justify-center">
            <div i-carbon-circle-dash animate-spin class="mr-2" />
            {{ t('simulation.parameter_config.applying') }}
          </span>
          <span v-else>
            {{ t('simulation.parameter_config.apply') }}
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>
