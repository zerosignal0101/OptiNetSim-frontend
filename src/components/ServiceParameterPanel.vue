<!-- src/components/NetworkParameterPanel.vue -->
<script setup lang="ts">
import type { NetworkDetail, NetworkService } from '~/types/network'
import ServicePanel from './parameter-panels/services/ServicePanel.vue'

const props = defineProps<{
  isLoading: boolean
  selectedPaths: string[]
  networkDetail: NetworkDetail | null
}>()
const emit = defineEmits<{
  (e: 'update:service', service: NetworkService): void // Updated to expect a NetworkElement
  (e: 'update:selection', serviceId: string): void // Updated to expect a NetworkElement
}>()

const { t } = useI18n()

const currentServiceId = ref<string | null>(null)

const currentServiceDetail = computed<NetworkService | null>(() => {
  if (!currentServiceId.value || !props.networkDetail) {
    return null
  }
  const serviceDetail = props.networkDetail.services.find(srv => srv.service_id === currentServiceId.value) || null
  return serviceDetail
})

// Using toRef to keep reactivity for props
const isLoadingRef = toRef(props, 'isLoading')
const selectedPathsRef = toRef(props, 'selectedPaths')

watch(selectedPathsRef, (selectedPaths) => {
  const lastIndex = selectedPaths.length - 1
  if (!selectedPaths[lastIndex]) {
    currentServiceId.value = null
  }
  else if (selectedPaths[lastIndex] !== currentServiceId.value) {
    currentServiceId.value = selectedPaths[lastIndex]
  }
}, { immediate: true })
</script>

<template>
  <div flex="~ col" class="h-full">
    <h2 class="p-4 expressiveHeading03 text-gray-100 dark:text-gray-10">
      {{ currentServiceId ? t('editor.device_params.title') : 'Service list' }}
    </h2>

    <!-- Panel loading state -->
    <div v-if="isLoadingRef" class="mb-5 border border-gray-30 rounded-md bg-gray-10 p-4 dark:bg-gray-100">
      <div class="flex items-center text-teal-70">
        <div class="mr-3 h-4 w-4 animate-spin border-b-2 border-teal-50 rounded-full" />
        <span class="body01">{{ t('editor.global.loading') }}</span>
      </div>
    </div>

    <ServicePanel
      v-else-if="currentServiceDetail && currentServiceId"
      :service="currentServiceDetail"
      @update:service="emit('update:service', $event)"
    />

    <div v-else-if="networkDetail">
      <div v-for="service in networkDetail.services" :key="service.service_id">
        <div class="p-5" @click="emit('update:selection', service.service_id)">
          <h3 class="mb-02 heading02">
            {{ service.name }}
          </h3>
          <div class="flex align-middle text-gray-60 dark:text-coolGray-40">
            <i class="i-carbon-data-blob mr-01" />
            <p class="label01">
              Bit rate: {{ service.service_requirements.bandwidth / 1e9 }} Gbps
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Scoped styles can remain here if they are truly global to this component's layout */
</style>
