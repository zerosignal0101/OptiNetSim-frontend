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

      <el-form-item label="Type Variety" v-if="element.type_variety" prop="type_variety">
         <!-- Typically read-only if linked to a library template -->
         <el-input v-model="editableParams.type_variety" :disabled="isLinkedToTemplate" @change="updateField('type_variety', $event)" />
         <!-- TODO: Add select to change type_variety if not linked or if allowed -->
      </el-form-item>

       <el-divider>Parameters</el-divider>

      <!-- TODO: Dynamic Form Generation based on element.type -->
      <div v-if="element.type === 'Fiber'">
         <el-form-item label="Length (km)" prop="params.length">
            <el-input-number v-model="editableParams.params.length" controls-position="right" :min="0" @change="updateParamField('length', $event)" />
         </el-form-item>
         <el-form-item label="Loss Coef (dB/km)" prop="params.loss_coef">
             <el-input-number v-model="editableParams.params.loss_coef" :precision="3" :step="0.001" controls-position="right" @change="updateParamField('loss_coef', $event)" />
         </el-form-item>
          <!-- Add other Fiber params... -->
           <!-- Show template value if overridden -->
          <div v-if="isParamOverridden('length')" class="text-xs text-gray-500 mb-2">
              Template value: {{ templateParams?.length }}
               <el-button text size="small" @click="resetParamToTemplate('length')">Reset</el-button>
           </div>
      </div>
       <div v-else-if="element.type === 'Transceiver'">
           <!-- Transceiver specific form fields -->
            <p class="text-gray-500 text-sm">Transceiver form needs implementation.</p>
       </div>
       <div v-else-if="element.type === 'Edfa'">
           <!-- Edfa specific form fields -->
            <p class="text-gray-500 text-sm">Edfa form needs implementation.</p>
       </div>
        <div v-else-if="element.type === 'Roadm'">
           <!-- Roadm specific form fields -->
            <p class="text-gray-500 text-sm">Roadm form needs implementation.</p>
       </div>
       <!-- Add other element types -->
       <div v-else>
           <p class="text-gray-500 text-sm">Parameter form for type '{{ element.type }}' not implemented.</p>
       </div>

      <!-- TODO: Metadata Editor (e.g., location) -->
        <el-divider v-if="Object.keys(element.metadata || {}).length > 0">Metadata</el-divider>
         <div v-if="element.metadata?.location">
             <el-form-item label="Latitude">
                 <el-input-number v-model="editableParams.metadata.location.latitude" controls-position="right" @change="updateMetadataField('location.latitude', $event)" />
             </el-form-item>
              <el-form-item label="Longitude">
                 <el-input-number v-model="editableParams.metadata.location.longitude" controls-position="right" @change="updateMetadataField('location.longitude', $event)" />
             </el-form-item>
         </div>

      <!-- Add override indicators and reset buttons -->

    </el-form>
  </div>
  <div v-else class="text-center text-gray-400 dark:text-gray-500 pt-10">
    Select an element on the graph to edit its parameters.
  </div>
</template>

<script setup lang="ts">
import { ElForm, ElFormItem, ElInput, ElInputNumber, ElButton, ElDivider } from 'element-plus';
import type { FormInstance } from 'element-plus';
import type { NetworkElement } from '~/types/network';
import type { EquipmentLibraryDetail, EquipmentTemplate } from '~/types/library';
import { cloneDeep, get, set, isEqual } from 'lodash-es'; // Use lodash for deep clone and path access

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
     updateParamField(paramKey, templateValue); // Emit update
 }


watch(() => props.element, (newElement) => {
  if (newElement) {
    // Deep clone the element to avoid modifying the store directly via the form
     editableParams.value = cloneDeep(newElement);
     // Ensure params object exists if it doesn't
     if (!editableParams.value.params) {
        editableParams.value.params = {};
     }
      if (!editableParams.value.metadata) {
        editableParams.value.metadata = {};
     }
  } else {
    editableParams.value = {}; // Clear form when no element is selected
  }
    // Reset validation state when element changes
    nextTick(() => {
        paramFormRef.value?.clearValidate();
    });
}, { immediate: true, deep: true }); // Use deep watch initially if needed


// Debounce emit? Or emit on change? Let's emit on change for now.
function updateField(field: keyof NetworkElement, value: any) {
    // We only want to emit the changed field, not the whole object
    emit('update:element', { [field]: value });
}

 function updateParamField(paramKey: string, value: any) {
    // Emit the change within the 'params' object
    emit('update:element', { params: { [paramKey]: value } });
}

function updateMetadataField(metadataPath: string, value: any) {
     // Use lodash set to update nested metadata fields if needed
     const updatedMetadata = cloneDeep(editableParams.value.metadata || {});
     set(updatedMetadata, metadataPath, value);
    emit('update:element', { metadata: updatedMetadata });
}

</script>

<style scoped>
.parameter-editor {
  /* Styles */
}
</style>
