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
        <el-radio-button value="view"> View</el-radio-button>
        <el-radio-button value="connect"> Connect</el-radio-button>
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

    <div class="bg-white shadow-md rounded-lg p-4 mb-4">
      <div class="flex flex-wrap items-center gap-2">
        <div class="text-sm font-medium text-gray-500 mr-2">添加组件</div>

        <el-button
          class="edit flex items-center px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-md transition-colors"
          @click="createNewTransceiver">
          <img src="~/assets/img/Ellipse 1.svg" alt="Add Transceiver" width="16" height="16" class="mr-1.5">
          Add Transceiver
        </el-button>

        <el-button
          class="edit flex items-center px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-md transition-colors"
          @click="createNewEdfa">
          <img src="~/assets/img/Rectangle 1.svg" alt="Add Edfa" width="16" height="16" class="mr-1.5">
          Add Edfa
        </el-button>

        <el-button
          class="edit flex items-center px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-md transition-colors"
          @click="createNewRoadm">
          <img src="~/assets/img/Ellipse 3.svg" alt="Add Roadm" width="16" height="16" class="mr-1.5">
          Add Roadm
        </el-button>

        <el-button
          class="edit flex items-center px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-md transition-colors"
          @click="createNewFused">
          <img src="~/assets/img/Ellipse 2.svg" alt="Add Fused" width="16" height="16" class="mr-1.5">
          Add Fused
        </el-button>

        <el-button
          class="edit flex items-center px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-md transition-colors"
          @click="createNewFiber(editorStore.selectedNodes[0], editorStore.selectedNodes[1])">
          <img src="~/assets/img/Rectangle 2.svg" alt="Add Fiber" width="16" height="16" class="mr-1.5">
          Add Fiber
        </el-button>

        <el-button
          class="edit flex items-center px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-md transition-colors"
          @click="editorStore.addConnection({
            from_node: editorStore.selectedNodes[0],
            to_node: editorStore.selectedNodes[1]
          })">
          <img src="~/assets/img/Vector.svg" alt="Add Connection" width="16" height="16" class="mr-1.5">
          Add Connection
        </el-button>
      </div>
    </div>


    <div class="flex-grow flex overflow-hidden">
      <!-- Device Palette -->
      <div class="w-64 flex-shrink-0 overflow-y-auto p-2 border-r dark:border-gray-700 bg-white dark:bg-gray-800">
        <DevicePalette :library="editorStore.associatedLibrary" :is-loading="editorStore.isLibraryLoading"
          @drag-start="handleDragStart" />
      </div>

      <!-- Graph Canvas -->
      <div class="flex-grow relative bg-gray-50 dark:bg-gray-900" @dragover.prevent @drop="handleDrop"
        ref="graphContainerRef">
        <ClientOnly>
          <v-network-graph v-if="!isLoading && graphContainerRef" 
            tabindex="0"
            :nodes="editorStore.nodes" 
            :edges="editorStore.edges"
            :layouts="editorStore.layouts" 
            :configs="editorStore.graphConfigs"
            v-model:selectedNodes="editorStore.selectedNodes" 
            v-model:selectedEdges="editorStore.selectedEdges"
            @keyup.delete="onDeleteKeyUp"
            :event-handlers="graphEventHandlers" class="w-full h-full" />
          <div v-else class="flex items-center justify-center h-full text-gray-500">
            {{ isLoading ? 'Loading Network...' : 'Initializing Graph...' }}
          </div>
        </ClientOnly>
        <div v-if="editorStore.editorMode === 'connect' && editorStore.temporaryConnection.source"
          class="absolute top-0 left-0 p-1 bg-blue-100 text-blue-800 text-xs rounded">
          Connecting from: {{ editorStore.nodes[editorStore.temporaryConnection.source]?.name || '...' }} (Click target
          node)
        </div>
      </div>

      <!-- Parameter Editor Panel -->
      <div class="w-96 flex-shrink-0 overflow-y-auto p-3 border-l dark:border-gray-700 bg-white dark:bg-gray-800">
          <ParameterEditorPanel
              :element="elementSelected"
               :networkId="route.params.networkId[0]"
               :library="editorStore.associatedLibrary"
               @update:element="handleElementUpdate"
               @close="editorStore.selectElement(null)" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, reactive, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElButton, ElRadioGroup, ElRadioButton, ElDivider, ElTag, ElTooltip, ElMessage, ElLoading, ElUpload } from 'element-plus';
import { VNetworkGraph } from 'v-network-graph';
import * as vNG from 'v-network-graph';
import { useNetworkEditorStore, type EditorMode, type NodeData, type EdgeData } from '~/stores/networkEditor';
import DevicePalette from '~/components/editor/DevicePalette.vue';
import ParameterEditorPanel from '~/components/editor/ParameterEditorPanel.vue';
import type { NetworkElement, DeviceType } from '~/types/network';
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

var elementSelected: NetworkElement | null = null;

// Model for radio group
const editorModeModel = computed({
  get: () => editorStore.editorMode,
  set: (val) => editorStore.setEditorMode(val as EditorMode)
});

// --- Graph Event Handlers ---
const graphEventHandlers: vNG.EventHandlers = {
  "node:click": ({ node }) => {
    if (editorStore.editorMode === 'connect') {
      editorStore.handleNodeClickInConnectMode(node);
    } else {
      editorStore.selectElement(node);
      elementSelected = editorStore.nodes[node].data;
      console.log(`Node ${node} selected.`);
    }
  },
  "edge:click": ({ edge }) => {
    // Find connection ID corresponding to edge ID
    const connection = Array.from(editorStore.connections.entries()).find(([id, conn]) => (conn.connection_id || id) === edge);
    if (connection) {
      editorStore.selectConnection(connection[0]); // Select by store's key
      console.log(`Connection ${connection[0]} selected.`);
    }
  },
  "view:click": () => {
    // Deselect nodes/edges when clicking background
    editorStore.selectElement(null);
    elementSelected = null;
    editorStore.selectConnection(null);
    if (editorStore.editorMode === 'edit-params') editorStore.setEditorMode('view');
    // Clear temp connection
    else if (editorStore.editorMode === 'connect') editorStore.handleNodeClickInConnectMode(null);
  },
  "node:dragend": (event) => {
    Object.entries(event).map(([nodeId, { x, y }]) => {
      // Update position in the store (and potentially save layout to backend)
      const node = editorStore.nodes[nodeId];
      if (node) {
        const updatedUi = { ...(node.data.metadata.location || {}), x, y };
        const updatedMetadata = { ...node.data.metadata, location: updatedUi }
        const nodeUpdatedData = { ...node.data, metadata: updatedMetadata };
        console.log(`Updated with data for node:dragend.`);
        console.log(nodeUpdatedData);
        editorStore.updateElement(nodeId, nodeUpdatedData);
        // Update layout reactively for graph
        editorStore.layouts.nodes[nodeId] = { x, y };

        const fiberIdSet = movingHandler(event);

        fiberIdSet.forEach((fiberNodeId) => {
          const fiberNode = editorStore.nodes[fiberNodeId];
          const fiberUpdatedUi = editorStore.layouts.nodes[fiberNodeId];
          const fiberUpdatedMetadata = { ...fiberNode.data.metadata, location: fiberUpdatedUi }
          const fiberNodeUpdatedData = { ...fiberNode.data, metadata: fiberUpdatedMetadata };
          editorStore.updateElement(fiberNodeId, fiberNodeUpdatedData);
        });
      }
    });
  },
  "node:pointermove": (event) => movingHandler(event),
};

const movingHandler = (event: vNG.Events['node:dragend'] | vNG.Events['node:pointermove']) => {
  const fiberIdSet = new Set<string>();
  Object.entries(event).map(([nodeId, { x, y }]) => {
    const fiberNeighboursList = editorStore.fiberNeighbours[nodeId];
    // 打印测试数据
    // console.log(fiberNeighboursList)
    // fiberNeighboursList.forEach(fiberNodeId => {console.log(editorStore.nodes[fiberNodeId])})
    // 遍历相邻的 Fiber 节点
    if (fiberNeighboursList) {
      fiberNeighboursList.forEach(fiberNodeId => {
        const fiberNode = editorStore.nodes[fiberNodeId]; // 获取 Fiber 节点对象
        // 检查 Fiber 节点是否存在，若不存在，移除 fiberNeighbours 中的记录
        if (!fiberNode) {
          const index = fiberNeighboursList.indexOf(fiberNodeId);
          if (index > -1) {
            fiberNeighboursList.splice(index, 1);
          }
          return;
        }

        const fiberInfo = fiberNode.fiberInfo; // 获取 Fiber 的 fiber_in 和 fiber_out 信息

        if (fiberInfo.fiber_in && fiberInfo.fiber_out) {
          const fiberInNode = editorStore.layouts.nodes[fiberInfo.fiber_in]; // 获取 fiber_in 节点
          const fiberOutNode = editorStore.layouts.nodes[fiberInfo.fiber_out]; // 获取 fiber_out 节点

          if (fiberInNode && fiberOutNode) {
            // 计算 fiber_in 和 fiber_out 节点的中点坐标
            const midpointX = (fiberInNode.x + fiberOutNode.x) / 2;
            const midpointY = (fiberInNode.y + fiberOutNode.y) / 2;

            // 测试输出
            // console.log("Calc mid location: ", midpointX, midpointY)

            // 更新 Fiber 节点的位置
            editorStore.layouts.nodes[fiberNodeId] = {
              x: midpointX,
              y: midpointY,
            };

            fiberIdSet.add(fiberNodeId)
          }
        }
      });
    }
  })
  return fiberIdSet;
}

// Delete 接口调用
function onDeleteKeyUp() {
  console.log("onDeleteKeyUp Called.");
  if (editorStore.selectedNodes.length > 0) {
    const names = editorStore.selectedNodes.map(n => editorStore.nodes[n].name).join(", ")
    const confirmed = confirm(`Are you sure you want to delete [${names}]?`)
    if (confirmed) {
      editorStore.selectedNodes.forEach(n => {
        editorStore.deleteElement(n);
        if (editorStore.nodes[n].data.type !== 'Fiber') {
          const fiberNeighboursList = editorStore.fiberNeighbours[n];
          if (fiberNeighboursList) {
            fiberNeighboursList.forEach(fiberNodeId => {
              const fiberNode = editorStore.nodes[fiberNodeId];
              const fiberInfo = fiberNode.fiberInfo;
              if (fiberInfo) {
                if (fiberInfo.fiber_in === n) {
                  fiberNode.fiberInfo = { fiber_in: undefined, fiber_out: fiberInfo.fiber_out };
                }
                if (fiberInfo.fiber_out === n) {
                  fiberNode.fiberInfo = { fiber_in: fiberInfo.fiber_in, fiber_out: undefined };
                }
              }
            });
            delete editorStore.fiberNeighbours[n];
          }
        }
        // 删除 Fiber 节点时，需要移除其相邻节点 fiber_in fiber_out 在 fiberNeighbours 中对该 Fiber 的记录
        if (editorStore.nodes[n].data.type === 'Fiber') {
          const fiberInfo = editorStore.nodes[n].fiberInfo;
          if (fiberInfo) {
            if (fiberInfo.fiber_in) {
              const fiberInNeighbours = editorStore.fiberNeighbours[fiberInfo.fiber_in];
              if (fiberInNeighbours) {
                const index = fiberInNeighbours.indexOf(n);
                if (index > -1) {
                  fiberInNeighbours.splice(index, 1);
                }
              }
            }
            if (fiberInfo.fiber_out) {
              const fiberOutNeighbours = editorStore.fiberNeighbours[fiberInfo.fiber_out];
              if (fiberOutNeighbours) {
                const index = fiberOutNeighbours.indexOf(n);
                if (index > -1) {
                  fiberOutNeighbours.splice(index, 1);
                }
              }
            }
          }
        }
        // Debug
        console.log('fiberNeighbours:', editorStore.fiberNeighbours);
        // 删除本地数据
        delete editorStore.nodes[n];
        delete editorStore.layouts.nodes[n];
      });
    }
  } else if (editorStore.selectedEdges.length > 0) {
    const connection_ids = editorStore.selectedEdges.map(e => e).join(", ")
    const confirmed = confirm(`Are you sure you want to delete [${connection_ids}]?`)
    if (confirmed) {
      // Debug
      console.log('selectedEdges:', editorStore.selectedEdges);
      editorStore.selectedEdges.forEach(e => {
        editorStore.deleteConnection(e);
        const fromNode = editorStore.edges[e].source;
        const toNode = editorStore.edges[e].target;
        if (editorStore.nodes[fromNode].data.type === 'Fiber') {
          const fiberInfo = editorStore.nodes[fromNode].fiberInfo;
          if (fiberInfo) {
            if (fiberInfo.fiber_out === toNode) {
              editorStore.nodes[fromNode].fiberInfo = { fiber_in: fiberInfo.fiber_in, fiber_out: undefined };
            }
          }
        }
        if (editorStore.nodes[toNode].data.type === 'Fiber') {
          const fiberInfo = editorStore.nodes[toNode].fiberInfo;
          if (fiberInfo) {
            if (fiberInfo.fiber_in === fromNode) {
              editorStore.nodes[toNode].fiberInfo = { fiber_in: undefined, fiber_out: fiberInfo.fiber_out };
            }
          }
        }
        // 若连接的节点中有 Fiber 节点，则需要更新 fiberNeighbours 中的记录，移除非 Fiber 节点的到该 Fiber 的邻居信息
        if (editorStore.nodes[fromNode].data.type !== 'Fiber' && editorStore.nodes[toNode].data.type === 'Fiber') {
          const fiberNeighboursList = editorStore.fiberNeighbours[fromNode];
          if (fiberNeighboursList) {
            const index = fiberNeighboursList.indexOf(toNode);
            if (index > -1) {
              fiberNeighboursList.splice(index, 1);
            }
          }
        }
        if (editorStore.nodes[toNode].data.type !== 'Fiber' && editorStore.nodes[fromNode].data.type === 'Fiber') {
          const fiberNeighboursList = editorStore.fiberNeighbours[toNode];
          if (fiberNeighboursList) {
            const index = fiberNeighboursList.indexOf(fromNode);
            if (index > -1) {
              fiberNeighboursList.splice(index, 1);
            }
          }
        }
        // 删除本地数据
        delete editorStore.edges[e];
      })
    }
  }
}

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
    metadata: {},
  };

  // Add element via store action
  const createdElement = await editorStore.addElement(newElementData as Omit<NetworkElement, 'element_id' | 'params'>, graphCoords);

  if (createdElement) {
    // Select the newly added element
    await nextTick(); // Wait for graph to update
    editorStore.selectElement(createdElement.element_id);
  }

  draggedItem.value = null; // Clear dragged item
}

// --- Element Update Handling ---
function handleElementUpdate(updatedData: Partial<NetworkElement>) {
    if (editorStore.selectedElementId) {
      const elementId = editorStore.selectedElementId;
      console.log("Handler for element update called (processing).");
      editorStore.updateElement(editorStore.selectedElementId, updatedData)
        .then(newElement => {
          if (newElement) {
            editorStore.nodes[elementId].data = newElement;
            editorStore.nodes[elementId].name = newElement.name;
          }
        });
    }
}


const createNewElement = async (
  type: DeviceType,
  position?: { x: number, y: number }
): Promise<NetworkElement | null | undefined> => {
  const nextNodeIndex = Object.keys(editorStore.edges).length + 1;
  const defaultName = `${type}-${nextNodeIndex}`;

  const newElementData: Omit<NetworkElement, 'element_id' | 'params'> = {
    name: defaultName,
    type: type,
    library_id: undefined,
    type_variety: undefined,
    metadata: position ? { location: position } : {},
  };

  try {
    // 2. API成功后再更新本地状态
    const createdElement = editorStore.addElement(
      newElementData,
      position
    );

    console.log(`创建 ${type} 成功`, createdElement);
    return createdElement;
  } catch (error) {
    console.error(`创建 ${type} 失败:`, error);
    return null;
  }
};

// 特定元素类型的创建函数
// 使用async/await处理异步操作
const createNewTransceiver = async () => {
  try {
    const flag = await createNewElement('Transceiver', { x: 0, y: 0 });
    if (!flag) throw new Error('创建Transceiver失败');
    return flag;
  } catch (error) {
    console.error('创建Transceiver时出错:', error);
    return null;
  }
};
const createNewEdfa = async () => {
  try {
    const flag = await createNewElement('Edfa', { x: 0, y: 0 });
    if (!flag) throw new Error('创建Edfa失败');
    return flag;
  } catch (error) {
    console.error('创建Edfa时出错:', error);
    return null;
  }
};
const createNewRoadm = async () => {
  try {
    const flag = await createNewElement('Roadm', { x: 0, y: 0 });
    if (!flag) throw new Error('创建Roadm失败');
    return flag;
  } catch (error) {
    console.error('创建Roadm时出错:', error);
    return null;
  }
};
const createNewFused = async () => {
  try {
    const flag = await createNewElement('Fused', { x: 0, y: 0 });
    if (!flag) throw new Error('创建Fused失败');
    return flag;
  } catch (error) {
    console.error('创建Fused时出错:', error);
    return null;
  }
};
// Fiber 创建需要特殊处理连接
const createNewFiber = async (
  fromNodeId: string,
  toNodeId: string
): Promise<{ fiber: NetworkElement | null; error?: string }> => {
  // 获取两个节点的位置来计算中点
  const fromNode = editorStore.layouts.nodes[fromNodeId];
  const toNode = editorStore.layouts.nodes[toNodeId];

  if (!fromNode || !toNode) {
    const error = '无法找到源节点或目标节点';
    console.error(error);
    return { fiber: null, error };
  }
  try {
    // 计算中点位置
    const midpointX = (fromNode.x + toNode.x) / 2;
    const midpointY = (fromNode.y + toNode.y) / 2;

    // 1. 创建Fiber元素
    const fiberElement = await createNewElement('Fiber', {
      x: midpointX,
      y: midpointY
    });

    if (!fiberElement) {
      throw new Error('Fiber元素创建失败');
    }
    // 2. 创建第一个连接: fromNode -> fiber
    const conn1 = await editorStore.addConnection({
      from_node: fromNodeId,
      to_node: fiberElement.element_id
    });

    if (!conn1) {
      throw new Error(`创建第一个连接失败`);
    }
    // 3. 创建第二个连接: fiber -> toNode
    const conn2 = await editorStore.addConnection({
      from_node: fiberElement.element_id,
      to_node: toNodeId
    });

    if (!conn2) {
      throw new Error(`创建第二个连接失败`);
    }
    console.log('Fiber及连接创建成功');
    return { fiber: fiberElement };
  } catch (error) {
    console.error('创建Fiber失败:', error);
    return {
      fiber: null,
      error: error instanceof Error ? error.message : '未知错误'
    };
  }
};

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
          if (el.metadata.location?.x !== undefined && el.metadata.location?.y !== undefined) {
            initialLayouts[el.element_id] = { x: el.metadata.location.x, y: el.metadata.location.y };
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
