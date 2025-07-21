<!-- components\editor\ParameterEditorPanel.vue -->

<template>
  <div class="parameter-editor">
    <!-- A. ELEMENT EDITOR: Displayed when an element is selected -->
    <div v-if="element">
      <div class="flex justify-between items-center mb-3 pb-2 border-b dark:border-gray-700">
        <h3 class="text-lg font-semibold">Edit {{ element.type }}</h3>
        <el-button :icon="ElIconClose" circle text size="small" @click="$emit('close')" />
      </div>

      <el-form :model="editableElement" label-position="top" ref="paramFormRef">
        <el-form-item label="Name" prop="name">
          <el-input v-model="editableElement.name" @change="updateElementField('name', $event)" />
        </el-form-item>

        <el-form-item label="Type Variety" v-if="element.type !== 'Transceiver' && element.type !== 'Fused'"
          prop="type_variety">
          <el-select v-model="editableElement.type_variety" placeholder="Select a template" class="w-full" clearable
            @change="handleTypeVarietyChange">
            <el-option v-for="item in availableTypeVarieties" :key="item.value" :label="item.label"
              :value="item.value" />
          </el-select>
        </el-form-item>

        <el-divider>Parameters</el-divider>

        <!-- Dynamic Form for Element -->
        <div v-if="currentElementFormSchema && Object.keys(currentElementFormSchema).length > 0">
          <template v-for="(fields, sectionKey) in currentElementFormSchema" :key="sectionKey">
            <h4 v-if="Object.keys(currentElementFormSchema).length > 1"
              class="text-sm font-semibold text-gray-600 dark:text-gray-400 mt-4 mb-2 capitalize">
              {{ sectionKey }}
            </h4>
            <!-- FIX: Explicitly cast `field.key` and `sectionKey` to String to resolve TS errors -->
            <el-form-item 
              v-for="field in fields" 
              :key="String(field.key)" 
              :label="field.label"
              :prop="`${String(sectionKey)}.${String(field.key)}`">
              <component 
                :is="componentMap[field.component]" 
                v-if="editableElement[sectionKey]"
                v-model="editableElement[sectionKey][field.key]" 
                v-bind="field.props" 
                class="w-full"
                controls-position="right" 
                @change="updateElementNestedField(String(sectionKey), String(field.key), $event)" />
              <!-- FIX: Use String() to cast key for function calls and property access -->
              <div v-if="sectionKey === 'params' && isParamOverridden(String(field.key))"
                class="text-xs text-gray-500 mt-1 flex items-center justify-end">
                <span>Template: {{ templateParams?.[String(field.key)] }}</span>
                <el-button text type="primary" size="small" @click="resetParamToTemplate(String(field.key))"
                  class="ml-2">Reset</el-button>
              </div>
            </el-form-item>
          </template>
        </div>
        <div v-else-if="element && element.type">
          <p class="text-gray-500 text-sm">
            No parameters to configure for type '{{ element.type }}'.
          </p>
        </div>

        <el-divider v-if="Object.keys(editableElement.metadata || {}).length > 0">Metadata</el-divider>
        <el-form-item prop="metadata.description">
          <el-input v-model="editableElement.metadata.description" placeholder="Enter description"
            @change="updateElementNestedField('metadata', 'description', $event)" />
        </el-form-item>
      </el-form>
    </div>

    <!-- B. GLOBAL SETTINGS EDITOR: Displayed when NO element is selected -->
    <div v-else>
      <h3 class="text-lg font-semibold mb-3">Global Network Settings</h3>
      <el-tabs v-model="activeTab" type="border-card" class="global-settings-tabs">
        <!-- SI Tab -->
        <el-tab-pane label="Spectrum Info (SI)" name="si">
          <el-form v-if="editableGlobal.si" :model="editableGlobal.si" label-position="top">
            <template v-for="field in siFormSchema" :key="field.key">
              <el-form-item :label="field.label" :prop="field.key">
                <component :is="componentMap[field.component]" v-model="editableGlobal.si[field.key]"
                  v-bind="field.props" class="w-full" controls-position="right"
                  @change="updateGlobalField('si', field.key, $event)" />
              </el-form-item>
            </template>
          </el-form>
        </el-tab-pane>

        <!-- Span Tab -->
        <el-tab-pane label="Span Parameters" name="span">
          <el-form v-if="editableGlobal.span" :model="editableGlobal.span" label-position="top">
            <template v-for="field in spanFormSchema" :key="field.key">
              <el-form-item :label="field.label" :prop="field.key">
                <component :is="componentMap[field.component]" v-model="editableGlobal.span[field.key]"
                  v-bind="field.props" class="w-full" controls-position="right"
                  @change="updateGlobalField('span', field.key, $event)" />
              </el-form-item>
            </template>
          </el-form>
        </el-tab-pane>

        <!-- Simulation Config Tab -->
        <el-tab-pane label="Simulation Config" name="sim">
          <div v-if="editableGlobal.simulationConfig">
            <!-- Raman Params -->
            <h4 class="text-md font-semibold text-gray-700 dark:text-gray-300 mt-2 mb-2">Raman Parameters</h4>
            <el-form :model="editableGlobal.simulationConfig.raman_params" label-position="top">
              <template v-for="field in simulationConfigSchema.raman_params" :key="field.key">
                <el-form-item :label="field.label" :prop="field.key">
                  <component :is="componentMap[field.component]"
                    v-model="editableGlobal.simulationConfig.raman_params[field.key]" v-bind="field.props"
                    class="w-full" controls-position="right"
                    @change="updateGlobalNestedField('simulationConfig', 'raman_params', field.key, $event)" />
                </el-form-item>
              </template>
            </el-form>
            <!-- NLI Params -->
            <h4 class="text-md font-semibold text-gray-700 dark:text-gray-300 mt-4 mb-2">NLI Parameters</h4>
            <el-form :model="editableGlobal.simulationConfig.nli_params" label-position="top">
              <template v-for="field in simulationConfigSchema.nli_params" :key="field.key">
                <el-form-item :label="field.label" :prop="field.key">
                  <component :is="componentMap[field.component]"
                    v-model="editableGlobal.simulationConfig.nli_params[field.key]" v-bind="field.props"
                    class="w-full" controls-position="right"
                    @change="updateGlobalNestedField('simulationConfig', 'nli_params', field.key, $event)" />
                </el-form-item>
              </template>
            </el-form>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FormInstance } from 'element-plus';
// FIX: Import nested types for better type safety in schemas
import type { NetworkElement, SpectrumInformation, SpanParameters, SimulationConfig, RamanParams, NliParams } from '~/types/network';
import type { EquipmentLibraryDetail, EquipmentTemplate } from '~/types/library';
import { cloneDeep, set, isEqual } from 'lodash-es';
import { ElInputNumber, ElInput, ElSwitch } from 'element-plus'

const componentMap = {
  'el-input-number': ElInputNumber,
  'el-input': ElInput,
  'el-switch': ElSwitch
}

const props = defineProps<{
  element: NetworkElement | null;
  networkId: string;
  library: EquipmentLibraryDetail | null;
  si: SpectrumInformation | null;
  span: SpanParameters | null;
  simulationConfig: SimulationConfig | null;
}>();

const emit = defineEmits<{
  (e: 'update:element', data: Partial<NetworkElement>): void;
  (e: 'update:si', data: SpectrumInformation): void;
  (e: 'update:span', data: SpanParameters): void;
  (e: 'update:simulationConfig', data: SimulationConfig): void;
  (e: 'close'): void;
}>();

const paramFormRef = ref<FormInstance>();
const editableElement = ref<any>({});
const activeTab = ref('si');

const editableGlobal = reactive({
  si: null as SpectrumInformation | null,
  span: null as SpanParameters | null,
  simulationConfig: null as SimulationConfig | null,
});

const isLinkedToTemplate = computed(() => !!props.element?.library_id && !!props.element?.type_variety);

const templateData = computed<EquipmentTemplate | null>(() => {
  if (!isLinkedToTemplate.value || !props.library || !props.element) return null;
  const category = props.element.type as keyof EquipmentLibraryDetail;
  const templates = props.library[category] as EquipmentTemplate[] | undefined;
  if (!templates) return null;
  return templates.find(t => t.type_variety === props.element!.type_variety) || null;
});

const templateParams = computed<Record<string, any> | null>(() => {
  return templateData.value;
});

function isParamOverridden(paramKey: string): boolean {
  if (!isLinkedToTemplate.value || !templateParams.value || !props.element?.params) return false;
  const elementValue = props.element.params[paramKey];
  const templateValue = templateParams.value[paramKey];
  return elementValue !== undefined && !isEqual(elementValue, templateValue);
}

function resetParamToTemplate(paramKey: string) {
  if (!templateParams.value) return;
  const templateValue = templateParams.value[paramKey];
  set(editableElement.value.params, paramKey, cloneDeep(templateValue));
  updateElementNestedField('params', paramKey, templateValue);
}

// --- FIX: Replaced single watcher with multiple, type-safe watchers ---

// Watcher for the selected element
watch(() => props.element, (newElement) => {
  if (newElement) {
    editableElement.value = cloneDeep(newElement);
    if (!editableElement.value.metadata) {
      editableElement.value.metadata = {};
    }
    // This part is now safe because `newElement` is correctly typed as `NetworkElement`
    const schema = elementFormSchema[newElement.type];
    if (schema) {
      for (const sectionKey in schema) {
        if (!editableElement.value[sectionKey]) {
          editableElement.value[sectionKey] = {};
        }
      }
    }
    // Reset validation when the form element changes
    nextTick(() => {
      paramFormRef.value?.clearValidate();
    });
  } else {
    editableElement.value = {};
  }
}, { immediate: true, deep: true });

// Individual watchers for global settings
watch(() => props.si, (newSi) => {
  editableGlobal.si = cloneDeep(newSi);
}, { immediate: true, deep: true });

watch(() => props.span, (newSpan) => {
  editableGlobal.span = cloneDeep(newSpan);
}, { immediate: true, deep: true });

watch(() => props.simulationConfig, (newSimConfig) => {
  editableGlobal.simulationConfig = cloneDeep(newSimConfig);
}, { immediate: true, deep: true });


function updateElementField(field: keyof NetworkElement, value: any) {
  emit('update:element', { [field]: value });
}

function updateElementNestedField(section: string, key: string, value: any) {
  const sectionData = cloneDeep(editableElement.value[section]);
  for (const fieldKey in sectionData) {
    if (sectionData[fieldKey] === null) {
      delete sectionData[fieldKey];
    }
  }
  const payload = { [section]: sectionData };
  emit('update:element', payload);
}

function updateGlobalField(configType: 'si' | 'span', key: string, value: any) {
  if (!editableGlobal[configType]) return;
  const payload = cloneDeep(editableGlobal[configType] as any);
  for (const fieldKey in payload) {
    if (payload[fieldKey] === null) {
      delete payload[fieldKey];
    }
  }
  emit(`update:${configType}` as any, payload);
}

function updateGlobalNestedField(configType: 'simulationConfig', section: 'raman_params' | 'nli_params', key: string, value: any) {
    if (!editableGlobal.simulationConfig) return;
    const payload = cloneDeep(editableGlobal.simulationConfig);
    const sectionData = payload[section];
     for (const fieldKey in sectionData) {
        if ((sectionData as any)[fieldKey] === null) {
            delete (sectionData as any)[fieldKey];
        }
    }
    emit(`update:${configType}` as any, payload);
}

const availableTypeVarieties = computed(() => {
  if (!props.library || !props.element) return [];
  const templates = (props.library as any)[props.element.type] as EquipmentTemplate[] | undefined;
  if (!templates) return [];
  return templates.map(t => ({ value: t.type_variety, label: t.type_variety }));
});

function handleTypeVarietyChange(newTypeVariety: string) {
  emit('update:element', { type_variety: newTypeVariety });
}

// --- FIX: Made FormField generic to enforce key type safety ---
interface FormField<T> {
  key: keyof T; // Use `keyof T` instead of `string`
  label: string;
  component: 'el-input-number' | 'el-input' | 'el-switch';
  props?: Record<string, any>;
}

const elementFormSchema: Record<string, Record<string, FormField<any>[]>> = {
  Fiber: {
    params: [
      { key: 'length', label: 'Length (km)', component: 'el-input-number', props: { min: 0 } },
      { key: 'loss_coef', label: 'Loss Coef (dB/km)', component: 'el-input-number', props: { precision: 3, step: 0.001 } },
      { key: 'att_in', label: 'Att In (dB)', component: 'el-input-number', props: { step: 0.1 } },
      { key: 'con_in', label: 'Connector In (dB)', component: 'el-input-number', props: { step: 0.1 } },
      { key: 'con_out', label: 'Connector Out (dB)', component: 'el-input-number', props: { step: 0.1 } },
    ]
  },
  Edfa: {
    operational: [
      { key: 'gain_target', label: 'Gain Target (dB)', component: 'el-input-number', props: { step: 0.1 } },
      { key: 'tilt_target', label: 'Tilt Target (dB)', component: 'el-input-number', props: { step: 0.1 } },
      { key: 'out_voa', label: 'Output VOA (dB)', component: 'el-input-number', props: { step: 0.1 } },
      { key: 'in_voa', label: 'Input VOA (dB)', component: 'el-input-number', props: { step: 0.1 } },
    ]
  },
  Roadm: {
    params: [
        { key: 'target_pch_out_db', label: 'Target Pch Out (dB)', component: 'el-input-number', props: { step: 0.1 } },
    ]
  },
  Fused: {
    params: [
      { key: 'loss', label: 'Loss (dB)', component: 'el-input-number', props: { min: 0, step: 0.1 } },
    ]
  },
  Transceiver: {},
};

const currentElementFormSchema = computed(() => {
  if (!props.element?.type) return null;
  return elementFormSchema[props.element.type] || null;
});

// --- Applied the generic FormField type to the global schemas ---
const siFormSchema: FormField<SpectrumInformation>[] = [
  { key: 'f_min', label: 'Min Frequency (THz)', component: 'el-input-number', props: { precision: 3, step: 0.1 } },
  { key: 'f_max', label: 'Max Frequency (THz)', component: 'el-input-number', props: { precision: 3, step: 0.1 } },
  { key: 'baud_rate', label: 'Baud Rate (GBaud)', component: 'el-input-number', props: { precision: 3, step: 0.1 } },
  { key: 'spacing', label: 'Spacing (GHz)', component: 'el-input-number', props: { precision: 3, step: 0.1 } },
  { key: 'power_dbm', label: 'Power (dBm)', component: 'el-input-number', props: { step: 0.1 } },
  { key: 'tx_osnr', label: 'TX OSNR (dB)', component: 'el-input-number', props: { step: 0.1 } },
  { key: 'sys_margins', label: 'System Margins (dB)', component: 'el-input-number', props: { step: 0.1 } },
  { key: 'roll_off', label: 'Roll Off', component: 'el-input-number', props: { min: 0, max: 1, step: 0.01 } },
];

const spanFormSchema: FormField<SpanParameters>[] = [
  { key: 'power_mode', label: 'Power Mode', component: 'el-switch' },
  { key: 'max_length', label: 'Max Length', component: 'el-input-number', props: { min: 0 } },
  { key: 'max_loss', label: 'Max Loss (dB)', component: 'el-input-number', props: { min: 0, step: 0.1 } },
  { key: 'padding', label: 'Padding (dB)', component: 'el-input-number', props: { min: 0, step: 0.1 } },
  { key: 'EOL', label: 'End of Life (EOL) (dB)', component: 'el-input-number', props: { min: 0, step: 0.1 } },
  { key: 'con_in', label: 'Connector In (dB)', component: 'el-input-number', props: { min: 0, step: 0.1 } },
  { key: 'con_out', label: 'Connector Out (dB)', component: 'el-input-number', props: { min: 0, step: 0.1 } },
];

const simulationConfigSchema: {
  raman_params: FormField<RamanParams>[],
  nli_params: FormField<NliParams>[]
} = {
  raman_params: [
    { key: 'flag', label: 'Enable Raman', component: 'el-switch' },
    { key: 'result_spatial_resolution', label: 'Result Spatial Resolution', component: 'el-input-number', props: { min: 0 } },
    { key: 'solver_spatial_resolution', label: 'Solver Spatial Resolution', component: 'el-input-number', props: { min: 0 } },
  ],
  nli_params: [
    { key: 'method', label: 'Method', component: 'el-input' },
    { key: 'dispersion_tolerance', label: 'Dispersion Tolerance', component: 'el-input-number', props: { step: 0.1 } },
    { key: 'phase_shift_tolerance', label: 'Phase Shift Tolerance', component: 'el-input-number', props: { step: 0.1 } },
  ]
};

</script>

<style>
.global-settings-tabs .el-form-item {
  margin-bottom: 18px;
}
</style>