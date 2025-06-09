<template>
  <div class="network-editor h-[calc(100vh-150px)] flex flex-col"> <!-- v-loading="isLoading" -->
    <h1 class="text-xl font-semibold mb-2">
      Editing Network: {{ editorStore.networkName }}
      <el-tag v-if="editorStore.hasUnsavedChanges" type="warning" size="small" class="ml-2">Unsaved Changes</el-tag>
    </h1>
    <!-- Toolbar -->
    <div class="mb-2 flex items-center space-x-2 p-2 bg-gray-100 dark:bg-gray-800 rounded shadow">
      <el-button @click="editorStore.saveNetworkChanges()"
        :disabled="!editorStore.hasUnsavedChanges || editorStore.isLoading"
        :loading="editorStore.isLoading && editorStore.hasUnsavedChanges" type="primary"
        :icon="ElIconDocumentChecked">Save</el-button>
      <el-divider direction="vertical" />
      <el-radio-group v-model="editorModeModel" @change="editorStore.setEditorMode($event as EditorMode)">
        <el-radio-button value="view" :label="ElIconView"> View</el-radio-button>
        <el-radio-button value="connect" :label="ElIconConnection"> Connect</el-radio-button>
      </el-radio-group>
      <el-divider direction="vertical" />
      <!-- Add other tools: Zoom, Layout, Insert Topology etc -->
      <el-upload action="#" :show-file-list="false" :before-upload="handleInsertTopology" accept=".json"
        style="display: inline-block;">
        <el-tooltip content="Import and insert topology from file" placement="top">
          <el-button :icon="ElIconPlus">Insert Topology</el-button>
        </el-tooltip>
      </el-upload>
      <el-button @click="navigateToSimulation" :icon="ElIconVideoPlay">Go to Simulation</el-button>
    </div>

    <div class="flex-grow flex overflow-hidden">
      <!-- Device Palette -->
      <div class="w-64 flex-shrink-0 overflow-y-auto p-2 border-r dark:border-gray-700 bg-white dark:bg-gray-800">
        <DevicePalette :library="editorStore.associatedLibrary" :is-loading="editorStore.isLibraryLoading" @drag-start="handleDragStart" />
      </div>

      <!-- Graph Canvas -->
      <div
         class="flex-grow relative bg-gray-50 dark:bg-gray-900"
         @dragover.prevent @drop="handleDrop"
         ref="graphContainerRef"
         >
        <ClientOnly>
            <v-network-graph
            v-if="!isLoading && graphContainerRef"
            :nodes="editorStore.nodes"
            :edges="editorStore.edges"
            :layouts="editorStore.layouts"
            :configs="editorStore.graphConfigs as vNG.Config"
            :event-handlers="graphEventHandlers"
             class="w-full h-full"
             />
             <div v-else class="flex items-center justify-center h-full text-gray-500">
                {{ isLoading ? 'Loading Network...' : 'Initializing Graph...'}}
             </div>
        </ClientOnly>
         <div v-if="editorStore.editorMode === 'connect' && editorStore.temporaryConnection.source" class="absolute top-0 left-0 p-1 bg-blue-100 text-blue-800 text-xs rounded">
             Connecting from: {{ editorStore.nodes[editorStore.temporaryConnection.source]?.name || '...' }} (Click target node)
         </div>
      </div>

      <!-- Parameter Editor Panel -->
      <!-- <div class="w-96 flex-shrink-0 overflow-y-auto p-3 border-l dark:border-gray-700 bg-white dark:bg-gray-800">
          <ParameterEditorPanel
              :element="selectedElement"
               :networkId="route.params.networkId as string"
               :library="editorStore.associatedLibrary"
               @update:element="handleElementUpdate"
               @close="editorStore.selectElement(null)" />
      </div> -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, reactive, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElButton, ElRadioGroup, ElRadioButton, ElDivider, ElTag, ElTooltip, ElMessage, ElLoading, ElUpload } from 'element-plus';
import { VNetworkGraph } from 'v-network-graph';
import * as vNG from 'v-network-graph';
import { ForceLayout } from 'v-network-graph/lib/force-layout'; // Example layout
import { useNetworkEditorStore, type EditorMode, type NodeData, type EdgeData } from '~/stores/networkEditor';
import DevicePalette from '~/components/editor/DevicePalette.vue';
import ParameterEditorPanel from '~/components/editor/ParameterEditorPanel.vue';
import type { NetworkElement } from '~/types/network';
import type { EquipmentTemplate, EquipmentCategory } from '~/types/library';
import type { UploadRawFile } from 'element-plus';
import { useNetworkApi } from '~/composables/useNetworkApi'; // For insert topology

definePageMeta({
  // middleware: ['auth'] // Add middleware if needed
});

const route = useRoute();
const router = useRouter();
const editorStore = useNetworkEditorStore();
const { insertTopology: apiInsertTopology } = useNetworkApi();

const isLoading = ref(true);
const graphContainerRef = ref<HTMLDivElement | null>(null); // Ref for graph container

// Model for radio group
const editorModeModel = computed({
  get: () => editorStore.editorMode,
  set: (val) => editorStore.setEditorMode(val as EditorMode)
});

const selectedNodes = computed(() => editorStore.selectedNodes);

// --- Graph Event Handlers ---
const graphEventHandlers: vNG.EventHandlers = {
  "node:click": ({ node }) => {
    if (editorStore.editorMode === 'connect') {
      editorStore.handleNodeClickInConnectMode(node);
    } else {
      editorStore.selectElement(node);
    }
  },
  "edge:click": ({ edge }) => {
    // Find connection ID corresponding to edge ID
    const connection = Array.from(editorStore.connections.entries()).find(([id, conn]) => (conn.connection_id || id) === edge);
    if (connection) {
      editorStore.selectConnection(connection[0]); // Select by store's key
    }
  },
  "view:click": () => {
    // Deselect nodes/edges when clicking background
    editorStore.selectElement(null);
    editorStore.selectConnection(null);
    if (editorStore.editorMode === 'edit-params') editorStore.setEditorMode('view');
  },
  "node:dragend": ({ node, x, y }) => {
    // // Update position in the store (and potentially save layout to backend)
    //  const element = editorStore.elements.get(node);
    //  if (element) {
    //      const updatedUi = { ...(element.ui || {}), x, y };
    //      editorStore.updateElement(node, { ...element, ui: updatedUi });
    //      // Update layout reactively for graph
    //      layouts.nodes[node] = { x, y };
    //  }
  },
  // Add other handlers as needed (pan, zoom, dragstart...)
};

// --- Drag and Drop Logic ---
const draggedItem = ref<{ type: EquipmentCategory; template: EquipmentTemplate } | null>(null);

function handleDragStart(category: EquipmentCategory, template: EquipmentTemplate) {
  draggedItem.value = { type: category, template };
}

async function handleDrop(event: DragEvent) {
  if (!draggedItem.value || !graphContainerRef.value) return;

  // Calculate drop position relative to the graph container
  const bounds = graphContainerRef.value.getBoundingClientRect();
  const x = event.clientX - bounds.left;
  const y = event.clientY - bounds.top;

  // TODO: Convert screen coordinates (x, y) to graph coordinates using graph instance API if available
  // This requires access to the VNetworkGraph instance, which might need a ref or different setup.
  // For now, using screen coords might be inaccurate if zoomed/panned.
  const graphCoords = { x, y }; // Placeholder

  console.log(`Dropped ${draggedItem.value.template.type_variety} at (${graphCoords.x}, ${graphCoords.y})`);


  // Create element data based on dropped template
  const newElementData: Partial<NetworkElement> = {
    name: `${draggedItem.value.template.type_variety} Instance`, // Default name
    type: draggedItem.value.type, // e.g., 'Fiber', 'Edfa'
    library_id: editorStore.associatedLibrary?.library_id,
    type_variety: draggedItem.value.template.type_variety,
    // Params inherited from template - might need specific logic based on type
    // For simple types like Fiber, copy directly? For complex like Transceiver, maybe not?
    // Let's assume params are set by backend or edited later for now.
    params: {}, // Start with empty or default params, link to template
    metadata: {},
  };

  // Add element via store action
  const createdElement = await editorStore.addElement(newElementData as Omit<NetworkElement, 'element_id' | 'ui'>, graphCoords);

  if (createdElement) {
    // Select the newly added element
    await nextTick(); // Wait for graph to update
    editorStore.selectElement(createdElement.element_id);
  }

  draggedItem.value = null; // Clear dragged item
}

//  // --- Element Update Handling ---
//  function handleElementUpdate(updatedData: Partial<NetworkElement>) {
//      if (selectedElement.value?.element_id) {
//          editorStore.updateElement(selectedElement.value.element_id, updatedData);
//      }
//  }

// --- Insert Topology ---
async function handleInsertTopology(file: UploadRawFile) {
  const networkId = route.params.networkId as string;
  if (!networkId) return false;
  console.log("Inserting topology from file:", file.name);
  const loading = ElLoading.service({ text: 'Inserting topology...', background: 'rgba(0, 0, 0, 0.7)' });
  try {
    const { data, error } = await apiInsertTopology(networkId, file);
    if (data.value) {
      ElMessage.success(`Topology inserted successfully! Reloading network...`);
      // Reload the entire network state
      await editorStore.loadNetwork(networkId);
    } else {
      console.error("Insert topology error value:", error.value);
    }
  } catch (e) {
    console.error("Handle insert topology error:", e);
    ElMessage.error('Failed to start insert topology process.');
  } finally {
    loading.close();
  }
  return false; // Prevent default upload behavior
}

// --- Navigation ---
function navigateToSimulation() {
  router.push(`/networks/${route.params.networkId}/simulation`);
}


// --- Lifecycle ---
onMounted(async () => {
  const id = route.params.networkId as string;
  if (id) {
    isLoading.value = true;
    await editorStore.loadNetwork(id);

    // Initialize layouts after network data is loaded
    watch(() => editorStore.elements, (newElements) => {
      if (newElements.size > 0) {
        const initialLayouts: vNG.Layouts['nodes'] = {};
        newElements.forEach(el => {
          if (el.ui?.x !== undefined && el.ui?.y !== undefined) {
            initialLayouts[el.element_id] = { x: el.ui.x, y: el.ui.y };
          }
          // Else, let the layout algorithm position it
        });
        // layouts.nodes = initialLayouts; // This replaces the whole object, might break reactivity sometimes
        // Better to update existing keys or reassign if needed
        // Object.assign(layouts.nodes, initialLayouts);
        // Ensure nodes not in initialLayouts are removed if necessary (or let graph handle it)
      }
    }, { immediate: true });


    isLoading.value = false;
  } else {
    // Handle error: No network ID provided
    ElMessage.error('Network ID not found in route.');
    router.push('/networks');
  }
});

// Clear store state on unmount? Optional, depends if you want to preserve state when navigating away temporarily.
// onUnmounted(() => {
//    editorStore.clearEditorState();
// });

</script>

<style>
/* Styles specific to the editor page */
.network-editor .el-main {
  padding: 0;
  /* Remove default padding if using Element Plus layout */
}

/* Style v-network-graph canvas background */
.v-network-graph {
  background: #f0f2f5;
  /* Light mode background */
}

.dark .v-network-graph {
  background: #1f2937;
  /* Dark mode background */
}
</style>
