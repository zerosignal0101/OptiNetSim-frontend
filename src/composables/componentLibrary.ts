import type { DeviceType, EquipmentCategory, EquipmentLibraryDetail } from '~/types/library'

// Global state for component library
const equipmentLibrary = ref<EquipmentLibraryDetail>({})
const loading = ref(false)
const error = ref<string | null>(null)

// Map DeviceType to EquipmentCategory
const deviceTypeToCategory: Partial<Record<DeviceType, EquipmentCategory>> = {
  Transceiver: 'Transceiver',
  Fiber: 'Fiber',
  Edfa: 'Edfa',
  RamanFiber: 'RamanFiber',
  Roadm: 'Roadm',
  // 'Fused' and 'Multiband_amplifier' are not in the library.json
}

// Load component library from JSON file
export async function loadComponentLibrary() {
  if (Object.keys(equipmentLibrary.value).length > 0) {
    return equipmentLibrary.value
  }

  loading.value = true
  error.value = null

  try {
    const response = await fetch('/data/eqpt_config_openroadm_ver5.json')
    if (!response.ok) {
      throw new Error(`Failed to load component library: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    equipmentLibrary.value = data as EquipmentLibraryDetail
    return equipmentLibrary.value
  }
  catch (err) {
    error.value = err instanceof Error ? err.message : 'Unknown error loading component library'
    console.error('Error loading component library:', error.value)
    throw error.value
  }
  finally {
    loading.value = false
  }
}

// Get available categories from the library
export function useComponentLibrary() {
  const availableCategories = computed<EquipmentCategory[]>(() => {
    return Object.keys(equipmentLibrary.value).filter(key =>
      key in equipmentLibrary.value && Array.isArray(equipmentLibrary.value[key as EquipmentCategory]),
    ) as EquipmentCategory[]
  })

  // Get available type varieties for a category
  const getTypeVarieties = (category: EquipmentCategory) => {
    const items = equipmentLibrary.value[category] || []
    return items.map(item => item.type_variety).filter(Boolean)
  }

  // Get template for a specific category and type variety
  const getTemplate = (category: EquipmentCategory, typeVariety: string) => {
    const items = equipmentLibrary.value[category] || []
    return items.find(item => item.type_variety === typeVariety)
  }

  // Get available type varieties for a device type
  const getAvailableVarieties = (deviceType: DeviceType) => {
    const category = deviceTypeToCategory[deviceType]
    if (!category || !equipmentLibrary.value[category]) {
      return []
    }
    return getTypeVarieties(category)
  }

  // Get template for a device type and variety
  const getDeviceTemplate = (deviceType: DeviceType, typeVariety: string) => {
    const category = deviceTypeToCategory[deviceType]
    if (!category) {
      return null
    }
    return getTemplate(category, typeVariety)
  }

  // Check if a device type has library support
  const hasLibrarySupport = (deviceType: DeviceType) => {
    const category = deviceTypeToCategory[deviceType]
    return category && !!equipmentLibrary.value[category]
  }

  // Get all available device types that have library support
  const getSupportedDeviceTypes = () => {
    return Object.entries(deviceTypeToCategory)
      .filter(([_, category]) => !!equipmentLibrary.value[category])
      .map(([deviceType]) => deviceType as DeviceType)
  }

  return {
    equipmentLibrary: computed(() => equipmentLibrary.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    availableCategories,
    loadComponentLibrary,
    getTypeVarieties,
    getTemplate,
    getAvailableVarieties,
    getDeviceTemplate,
    hasLibrarySupport,
    getSupportedDeviceTypes,
    deviceTypeToCategory,
  }
}
