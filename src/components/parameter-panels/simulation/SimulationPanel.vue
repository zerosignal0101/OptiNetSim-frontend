<!-- src/components/parameter-panels/elements/ElementPanelWrapper.vue -->
<script setup lang="ts">
import type { NetworkElement } from '~/types/network'

const props = defineProps<{
  networkId: string
  simulationResult: object | null
}>()

const {
  networkDetail,
} = useNetworkLoader(props.networkId, false)

const elementMap = computed(() => {
  if (!networkDetail.value) {
    return new Map<string, NetworkElement>()
  }
  else {
    return networkDetail.value?.elements.reduce<Map<string, NetworkElement>>((map, element) => {
      map.set(element.element_id, element)
      return map
    }, new Map<string, NetworkElement>())
  }
})

// const { t } = useI18n()

const localSimulationResult = ref(props.simulationResult)
watch(
  () => props.simulationResult,
  (newSimulationResult) => {
    localSimulationResult.value = newSimulationResult
  },
)
</script>

<template>
  <div class="grid grid-cols-1 gap-5 p-4">
    <h3 class="heading03 text-teal-70 dark:text-teal-30">
      Simulation Result
    </h3>

    <div v-if="localSimulationResult" class="space-y-6">
      <!-- SNR Results Section -->
      <div class="p-3">
        <h4 class="mb-4 heading02 text-gray-80 dark:text-gray-10">
          Signal-to-Noise Ratio Results
        </h4>
        <div class="overflow-x-auto">
          <table class="w-full body01">
            <thead>
              <tr class="border-b border-gray-30 dark:border-gray-60">
                <th class="px-3 py-2 text-left text-gray-70 font-medium dark:text-gray-20">
                  Node
                </th>
                <th class="px-3 py-2 text-left text-gray-70 font-medium dark:text-gray-20">
                  Name
                </th>
                <th class="px-3 py-2 text-left text-gray-70 font-medium dark:text-gray-20">
                  SNR (1nm)
                </th>
                <th class="px-3 py-2 text-left text-gray-70 font-medium dark:text-gray-20">
                  SNR
                </th>
                <th class="px-3 py-2 text-left text-gray-70 font-medium dark:text-gray-20">
                  OSNR ASE
                </th>
                <th class="px-3 py-2 text-left text-gray-70 font-medium dark:text-gray-20">
                  OSNR ASE (1nm)
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(result, index) in localSimulationResult.snr_results"
                :key="index"
                class="border-b border-gray-20 last:border-0 dark:border-gray-70"
              >
                <td class="px-3 py-3">
                  <span class="h-6 w-6 inline-flex items-center justify-center rounded-full bg-teal-20 expressiveHeading01 text-teal-80 font-medium dark:bg-teal-70 dark:text-teal-10">
                    {{ index + 1 }}
                  </span>
                </td>
                <td class="px-3 py-3 font-mono">
                  {{ elementMap.get(result.element_id)?.name }}
                </td>
                <td class="px-3 py-3 font-mono">
                  {{ result.snr_01nm.toFixed(2) }}
                </td>
                <td class="px-3 py-3 font-mono">
                  {{ result.snr.toFixed(2) }}
                </td>
                <td class="px-3 py-3 font-mono">
                  {{ result.osnr_ase.toFixed(2) }}
                </td>
                <td class="px-3 py-3 font-mono">
                  {{ result.osnr_ase_01nm.toFixed(2) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Visual Comparison -->
        <div class="mt-6">
          <h5 class="mb-4 expressiveHeading02 text-gray-70 font-medium dark:text-gray-20">
            SNR Comparison
          </h5>
          <div class="grid grid-cols-1 gap-4">
            <div
              v-for="(result, index) in localSimulationResult.snr_results"
              :key="index"
              class="relative"
            >
              <div class="mb-1 flex items-center justify-between">
                <span class="body01 text-gray-60 dark:text-gray-30">Node {{ index + 1 }}</span>
                <span class="body01 font-mono">{{ result.snr.toFixed(2) }}</span>
              </div>
              <div class="h-2 w-full rounded-full bg-gray-30 dark:bg-gray-60">
                <div
                  class="h-2 rounded-full bg-teal-60 transition-all duration-500 ease-out"
                  :style="{ width: `${Math.min(100, (result.snr / 50) * 100)}%` }"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="py-8 text-center">
      <div class="mb-2 text-gray-60 dark:text-gray-30">
        <div class="i-carbon-flow-connection mx-auto mb-3 h-10 w-10 text-gray-40 dark:text-gray-50" />
        <p class="body02">
          Please connect 2 nodes for simulation.
        </p>
      </div>
    </div>
  </div>
</template>
