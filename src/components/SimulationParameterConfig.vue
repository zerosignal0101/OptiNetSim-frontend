<script setup lang="ts">
interface SimulationParameters {
  avg_arrival_interval: number
  avg_holding_time: number
  service_arrival_time_max: number
}

interface Props {
  parameters: SimulationParameters
  isLoading?: boolean
}

interface Emits {
  (e: 'update:parameters', parameters: SimulationParameters): void
  (e: 'apply'): void
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
})

const emit = defineEmits<Emits>()

// I18n
const { t } = useI18n()

// Create separate refs for each parameter to avoid recursive updates
const avgHoldingTime = ref(props.parameters.avg_holding_time)
const serviceArrivalTimeMax = ref(props.parameters.service_arrival_time_max)

// Watch local changes and emit updates
watch([avgHoldingTime, serviceArrivalTimeMax], ([newHoldingTime, newArrivalTimeMax]) => {
  emit('update:parameters', {
    avg_arrival_interval: props.parameters.avg_arrival_interval,
    avg_holding_time: newHoldingTime,
    service_arrival_time_max: newArrivalTimeMax,
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

// Handle apply button click
function handleApply() {
  if (validateHoldingTime(avgHoldingTime.value)
    && validateArrivalTimeMax(serviceArrivalTimeMax.value)) {
    emit('apply')
  }
}

// Check if parameters are valid
const isParametersValid = computed(() => {
  return validateHoldingTime(avgHoldingTime.value)
    && validateArrivalTimeMax(serviceArrivalTimeMax.value)
})
</script>

<template>
  <div class="simulation-parameter-config border border-gray-30 bg-white p-4 shadow-sm dark:border-gray-70 dark:bg-gray-80">
    <h3 class="text-heading-02 mb-4 text-gray-100 font-medium dark:text-gray-10">
      {{ t('simulation.parameter_config.title') }}
    </h3>

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
            {{ t('simulation.parameter_config.fixed') }}
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
