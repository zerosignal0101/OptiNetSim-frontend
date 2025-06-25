<template>
  <div v-if="element" class="parameter-editor">
    <div class="flex justify-between items-center mb-3 pb-2 border-b dark:border-gray-700">
      <h3 class="text-lg font-semibold">Edit {{ element.type }}</h3>
      <el-button :icon="ElIconClose" circle text size="small" @click="$emit('close')" />
    </div>

    <el-form :model="editableParams" label-position="top" ref="paramFormRef">
      <el-form-item label="Name" prop="name">
        <el-input v-model="editableParams.name" @change="updateField('name', $event)" />
      </el-form-item>

      <el-form-item label="Type Variety" v-if="element.type !== 'Transceiver' && element.type !== 'Fused'" prop="type_variety">
        <!-- Use a select to choose from available templates in the library -->
        <el-select
          v-model="editableParams.type_variety"
          placeholder="Select a template"
          class="w-full"
          clearable
          @change="handleTypeVarietyChange"
        >
          <el-option
            v-for="item in availableTypeVarieties"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>

      <el-divider>Parameters</el-divider>

      <!-- Dynamic Form Generation based on currentFormSchema -->
      <div v-if="currentFormSchema && Object.keys(currentFormSchema).length > 0">
        <!-- Iterate over sections in the schema (e.g., 'params', 'operational') -->
        <template v-for="(fields, sectionKey) in currentFormSchema" :key="sectionKey">
          
          <!-- Optional: If an element type has multiple sections, you can render a title for each. -->
          <h4 v-if="Object.keys(currentFormSchema).length > 1" class="text-sm font-semibold text-gray-600 dark:text-gray-400 mt-4 mb-2 capitalize">
            {{ sectionKey }}
          </h4>

          <!-- Iterate over each field defined in the schema section -->
          <el-form-item
            v-for="field in fields"
            :key="field.key"
            :label="field.label"
            :prop="`${sectionKey}.${field.key}`"
          >
            <!-- 
              Dynamically render the correct component using <component :is="...">.
              - We bind the v-model to the corresponding property in editableParams.
              - We use v-bind to pass any additional props like 'precision' or 'step'.
              - The @change event calls a generic update function.
            -->
            <component
              :is="componentMap[field.component]"
              v-if="editableParams[sectionKey]"
              v-model="editableParams[sectionKey][field.key]"
              v-bind="field.props"
              class="w-full"
              controls-position="right"
              @change="updateNestedField(sectionKey.toString(), field.key, $event)"
            />

            <!-- 
              Display template override information.
              This logic is kept from your original code and integrated here.
              It's conditionally shown only for the 'params' section.
            -->
            <div v-if="sectionKey === 'params' && isParamOverridden(field.key)" class="text-xs text-gray-500 mt-1 flex items-center justify-end">
              <span>Template: {{ templateParams?.[field.key] }}</span>
              <el-button text type="primary" size="small" @click="resetParamToTemplate(field.key)" class="ml-2">Reset</el-button>
            </div>
          </el-form-item>
        </template>
      </div>
      
      <!-- Fallback message for unimplemented or empty schemas -->
      <div v-else-if="element && element.type">
        <p class="text-gray-500 text-sm">
          No parameters to configure for type '{{ element.type }}'.
        </p>
      </div>

      <el-divider v-if="Object.keys(editableParams.metadata || {}).length > 0">Metadata</el-divider>

      <!-- Specific Metadata Editor for description only -->
      <el-form-item prop="metadata.description">
        <el-input
          v-model="editableParams.metadata.description"
          placeholder="Enter description"
          @change="updateNestedField('metadata', 'description', $event)"
        />
      </el-form-item>

      <!-- Add override indicators and reset buttons -->

    </el-form>
  </div>
  <div v-else class="text-center text-gray-400 dark:text-gray-500 pt-10">
    Select an element on the graph to edit its parameters.
  </div>
</template>

<script setup lang="ts">
import type { FormInstance } from 'element-plus';
import type { NetworkElement } from '~/types/network';
import type { EquipmentLibraryDetail, EquipmentTemplate } from '~/types/library';
import { cloneDeep, set, isEqual } from 'lodash-es'; // Use lodash for deep clone and path access
import { ElInputNumber, ElInput, ElSwitch } from 'element-plus'

const componentMap = {
  'el-input-number': ElInputNumber,
  'el-input': ElInput,
  'el-switch': ElSwitch
}

const props = defineProps<{
  element: NetworkElement | null;
  networkId: string; // Needed for context? Maybe not directly here.
  library: EquipmentLibraryDetail | null; // To find template params
}>();

const emit = defineEmits<{
  (e: 'update:element', data: Partial<NetworkElement>): void;
  (e: 'close'): void;
}>();

const paramFormRef = ref<FormInstance>();
// Use reactive object for the form model, cloned from the prop
const editableParams = ref<any>({}); // Use 'any' for simplicity with lodash set, or create a fully typed reactive object

const isLinkedToTemplate = computed(() => !!props.element?.library_id && !!props.element?.type_variety);

// Find the corresponding template in the library
const templateData = computed<EquipmentTemplate | null>(() => {
  if (!isLinkedToTemplate.value || !props.library || !props.element) return null;
  const category = props.element.type as keyof EquipmentLibraryDetail; // e.g., 'Fiber', 'Edfa'
  const templates = props.library[category] as EquipmentTemplate[] | undefined;
  if (!templates) return null;
  return templates.find(t => t.type_variety === props.element!.type_variety) || null;
});

// Get the parameters from the template
const templateParams = computed<Record<string, any> | null>(() => {
  // The structure of template parameters might differ from element params.
  // API shows 'params' object within 'elements', but template objects have params at top level.
  // Adjust this logic based on the *actual* structure of templates vs elements.
  // Assuming template object itself holds the relevant parameters directly:
  return templateData.value; // Simplified assumption
});

// Check if a specific parameter is overridden
function isParamOverridden(paramKey: string): boolean {
  if (!isLinkedToTemplate.value || !templateParams.value || !props.element?.params) return false;
  const elementValue = props.element.params[paramKey];
  const templateValue = templateParams.value[paramKey]; // Adjust path if needed
  // Need careful comparison, especially for objects/arrays
  return elementValue !== undefined && !isEqual(elementValue, templateValue);
}

// Reset a parameter to its template value
function resetParamToTemplate(paramKey: string) {
  if (!templateParams.value) return;
  const templateValue = templateParams.value[paramKey]; // Adjust path
  set(editableParams.value.params, paramKey, cloneDeep(templateValue)); // Update local form state
  updateNestedField('params', paramKey, templateValue); // Emit update
}


watch(() => props.element, (newElement) => {
  if (newElement) {
    // Deep clone to prevent direct mutation of the prop
    editableParams.value = cloneDeep(newElement);

    // Ensure standard objects like metadata exist
    if (!editableParams.value.metadata) {
      editableParams.value.metadata = {};
    }

    // Ensure all sections defined in the schema exist on the editable object
    const schema = elementFormSchema[newElement.type];
    if (schema) {
      for (const sectionKey in schema) {
        if (!editableParams.value[sectionKey]) {
          editableParams.value[sectionKey] = {};
        }
      }
    }

  } else {
    editableParams.value = {}; // Clear form when no element is selected
  }
  
  // Reset validation state when element changes
  nextTick(() => {
    paramFormRef.value?.clearValidate();
  });
}, { immediate: true, deep: true });


// Debounce emit? Or emit on change? Let's emit on change for now.
function updateField(field: keyof NetworkElement, value: any) {
  // We only want to emit the changed field, not the whole object
  emit('update:element', { [field]: value });
}

// ADD this more generic function:
/**
 * Emits an update for a nested property within the element.
 * @param section - The top-level key in the element object (e.g., 'params', 'operational').
 * @param key - The key of the property to update within the section.
 * @param value - The new value.
 */
function updateNestedField(section: string, key: string, value: any) {
  // Creates a payload like { params: { length: 10 } } or { operational: { gain_target: 20 } }
  const payload = {
    [section]: { [key]: value }
  };
  emit('update:element', payload);
}

const availableTypeVarieties = computed(() => {
  if (!props.library || !props.element) return [];
  // The 'as any' is a pragmatic choice to handle different keys like 'Fiber', 'Edfa', etc.
  // TODO: Fix the logic of finding 'type_variety' from the library
  const templates = (props.library as any)[props.element.type] as EquipmentTemplate[] | undefined;
  if (!templates) return [];
  return templates.map(t => ({ value: t.type_variety, label: t.type_variety }));
});

// When changing the type_variety, you need a more complex update function
// because it implies changing the base template of the element.
function handleTypeVarietyChange(newTypeVariety: string) {
  // This should emit an event to the parent component to handle this complex change.
  // The parent might need to fetch the new template defaults and apply them.
  // For now, we just emit the change.
  emit('update:element', { type_variety: newTypeVariety });
  // A more advanced implementation might also reset local parameter overrides.
}

// Describes a single form field
interface FormField {
  key: string;
  label: string;
  component: 'el-input-number' | 'el-input' | 'el-switch'; // Add more as needed
  props?: Record<string, any>; // e.g., { precision: 3, step: 0.1 }
}

// Defines the schema for each element type's parameters
const elementFormSchema: Record<string, Record<string, FormField[]>> = {
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
        // NOTE: For complex fields like 'restrictions' (dict) or 'per_degree_impairments' (list),
        // you would need custom components. The dynamic generator handles simple inputs well.
    ]
  },
  Fused: {
    params: [
      { key: 'loss', label: 'Loss (dB)', component: 'el-input-number', props: { min: 0, step: 0.1 } },
    ]
  },
  // Transceiver has no specific params in the backend logic provided
  Transceiver: {},
  // RamanFiber and Multiband_amplifier have more complex structures needing special handling
};

// Computed property to get the schema for the currently selected element
const currentFormSchema = computed(() => {
  if (!props.element?.type) return null;
  return elementFormSchema[props.element.type] || null;
});

</script>

<style scoped>
.parameter-editor {
  /* Styles */
}
</style>
