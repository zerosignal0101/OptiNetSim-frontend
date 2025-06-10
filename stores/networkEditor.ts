import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import type { NetworkDetail, NetworkElement, NetworkConnection, SpectrumInformation, SpanParameters, SimulationConfig, DeviceType } from '~/types/network';
import type { EquipmentLibraryDetail } from '~/types/library'; // Import library types
import { v4 as uuidv4 } from 'uuid'; // For temporary frontend IDs if needed
import { useLibraryApi } from '~/composables/useLibraryApi';
import { useNetworkApi } from '~/composables/useNetworkApi';
import { useApiPut } from '~/composables/useApi';
import * as vNG from 'v-network-graph';

export type EditorMode = 'view' | 'connect' | 'edit-params';

// vNG 所用的类型定义
export interface NodeData extends vNG.Node {
    size: number;
    color: string;
    shape: string;
    data: NetworkElement;
    fiberInfo: { fiber_in: string | undefined, fiber_out: string | undefined };
};

export interface EdgeData extends vNG.Edge {
    width: number;
    color: string;
    dashed?: boolean;
};

export interface Nodes {
    [key: string]: NodeData;
};

export interface Edges {
    [key: string]: EdgeData;
}

export const useNetworkEditorStore = defineStore('networkEditor', () => {
    const { fetchNetworkById, updateElement: apiUpdateElement, createElement: apiCreateElement, deleteElement: apiDeleteElement,
        createConnection: apiCreateConnection /* ... other api calls ... */ } = useNetworkApi();
    const { fetchLibraryEquipment } = useLibraryApi(); // Need library details for palette

    // --- State ---
    const networkId = ref<string | null>(null);
    const networkName = ref<string>('');
    const isLoading = ref(false);
    const error = ref<any>(null);
    const hasUnsavedChanges = ref(false);

    // Use Maps for efficient lookups/updates by element_id/connection_id
    const elements = ref<Map<string, NetworkElement>>(new Map()); // Store raw element data
    const connections = ref<Map<string, NetworkConnection>>(new Map()); // Store raw connection data
    const services = ref<Map<string, any>>(new Map()); // Store services
    const si = ref<SpectrumInformation | null>(null);
    const span = ref<SpanParameters | null>(null);
    const simulationConfig = ref<SimulationConfig | null>(null);

    // Associated library data (for the palette)
    const associatedLibraryId = ref<string | null>(null); // Store the ID associated with the network
    const associatedLibrary = ref<EquipmentLibraryDetail | null>(null);
    const isLibraryLoading = ref(false);

    // UI State
    const selectedElementId = ref<string | null>(null);
    const selectedConnectionId = ref<string | null>(null);
    const editorMode = ref<EditorMode>('view');
    const temporaryConnection = ref<{ source: string | null, target: string | null }>({ source: null, target: null }); // For connection mode UI

    // --- Getters (Computed Properties) ---
    const currentNetwork = computed((): Partial<NetworkDetail> => ({ // For saving
        network_id: networkId.value ?? undefined,
        network_name: networkName.value,
        elements: Array.from(elements.value.values()),
        connections: Array.from(connections.value.values()),
        services: Array.from(services.value.values()),
        SI: si.value,
        Span: span.value,
        simulation_config: simulationConfig.value,
    }));

    // 样式配置
    const graphConfigs: vNG.Config =
        vNG.defineConfigs<NodeData, EdgeData>({
            view: {
                grid: {
                    visible: true,
                    interval: 20,
                    thickIncrements: 5,
                    line: {
                        color: "#e0e0e0",
                        width: 1,
                        dasharray: 1,
                    },
                    thick: {
                        color: "#cccccc",
                        width: 1,
                        dasharray: 0,
                    },
                },
                layoutHandler: new vNG.GridLayout({ grid: 10 }),
                scalingObjects: true,
                minZoomLevel: 0.1,
                maxZoomLevel: 16,
            },
            node: {
                normal: {
                    type: node => node.shape === 'circle' ? 'circle' : 'rect', // 根据 shape 属性选择形状
                    radius: node => node.shape === 'circle' ? node.size : 0, // 圆形的半径
                    width: node => node.shape === 'rect' ? node.size : 0, // 矩形的宽度
                    height: node => node.shape === 'rect' ? node.size : 0, // 矩形的高度
                    color: node => node.color,
                },
                hover: {
                    radius: node => node.shape === 'circle' ? node.size + 2 : 0, // 增大圆形的半径
                    width: node => node.shape === 'rect' ? node.size + 2 : 0, // 增大矩形的宽度
                    height: node => node.shape === 'rect' ? node.size + 2 : 0, // 增大矩形的高度
                    color: node => node.color,
                },
                selectable: 2,
                draggable: node => node.draggable,
                focusring: {
                    color: 'darkgray',
                },
            },
            edge: {
                normal: {
                    width: edge => edge.width,
                    color: edge => edge.color,
                    dasharray: edge => (edge.dashed ? '4' : '0'),
                },
                marker: {
                    source: {
                        type: "none",
                        width: 4,
                        height: 4,
                        margin: -1,
                        offset: 0,
                        units: "strokeWidth",
                        color: null,
                    },
                    target: {
                        type: "arrow",
                        width: 4,
                        height: 4,
                        margin: -1,
                        offset: 0,
                        units: "strokeWidth",
                        color: null,
                    },
                },
                gap: 8,
                type: "straight",
                selectable: true,
            },
        });

    // 数据
    const nodes = reactive<Nodes>({});
    const edges = reactive<Edges>({});
    const selectedNodes = ref<string[]>([]);
    const selectedEdges = ref<string[]>([]);
    const layouts = reactive<vNG.Layouts>({
        nodes: {}
    });
    const fiberNeighbours = reactive<Record<string, string[]>>({});

    const loadNodeFromElement = (element: NetworkElement) => {
        let shape = 'circle'; // 默认是圆形
        let color = 'gray';   // 默认颜色为灰色
        let size = 20;        // 默认大小

        // 设置不同节点类型的形状、颜色和大小
        if (element.type === 'Edfa') {
            shape = 'rect'; // 如果是 EDFA 类型，则为矩形
            color = '#CC503E';
            size = 30;      // 矩形的默认大小
        } else if (element.type === 'Transceiver') {
            color = '#F7881A'; // Transceiver 类型为圆形，颜色为蓝色
            size = 20;      // 圆形的默认大小
        } else if (element.type === 'Roadm') {
            color = '#D5ECAE'; // Roadm 类型为圆形，颜色为绿色
            size = 20;       // 圆形的默认大小
        } else if (element.type === 'Multiband_amplifier') {
            shape = 'rect'; // 如果是 EDFA 类型，则为矩形
            color = '#f87171';
            size = 30;
        } else if (element.type === 'Fiber' || element.type === 'RamanFiber') {
            shape = 'rect'; // 如果是 Fiber 类型，则为矩形
            color = '#B7E8FF';
            size = 15;
        }

        // 预处理 element 副本数据，移除已储存的字段(element_id, name, metadata)
        // 获取副本
        const elementCopy = { ...element };

        var nodeDraggable = true;
        // 对于 Fiber 类型，不可拖动
        if (element.type === 'Fiber') {
            nodeDraggable = false;
        }

        // 将节点数据绑定到 nodes 中
        nodes[`${element.element_id}`] = {
            name: element.name,
            size: size, // 根据节点类型设置大小
            color: color, // 根据节点类型设置颜色
            shape: shape,
            draggable: nodeDraggable, // 设置节点可拖动
            data: elementCopy, // 将后端数据绑定到 data 中
            fiberInfo: {
                fiber_in: undefined,
                fiber_out: undefined
            }
        };

        // 处理可能不存在的 ui 属性
        if (element.metadata.location) {
            layouts.nodes[element.element_id] = {
                x: element.metadata.location.x ?? 0, // 提供默认值
                y: element.metadata.location.y ?? 0, // 提供默认值
            };
        } else {
            // 如果没有 ui 数据，可以设置默认位置或忽略
            layouts.nodes[element.element_id] = {
                x: 0,
                y: 0,
            };
        }

        // 打印测试数据
        console.log('Node:', nodes[`${element.element_id}`]);
    }

    const loadEdgeFromConnection = (connection: NetworkConnection) => {
        let edgeColor = 'black'; // 默认边颜色为黑色

        edges[`${connection.connection_id}`] = {
            source: `${connection.from_node}`,
            target: `${connection.to_node}`,
            width: 2,
            color: edgeColor, // 设置连接线的颜色
        };

        // 将非 Fiber 节点的直接相邻 Fiber 加入到 fiberNeighbours 键值对中，键名为非 Fiber 节点 ID，值为相邻 Fiber 节点 ID 列表，不考虑方向
        if (nodes[`${connection.from_node}`].data.type !== 'Fiber' && nodes[`${connection.to_node}`].data.type == 'Fiber') {
            if (fiberNeighbours[`${connection.from_node}`] === undefined) {
                fiberNeighbours[`${connection.from_node}`] = [];
            }
            fiberNeighbours[`${connection.from_node}`].push(`${connection.to_node}`);
            // 设定 Fiber 节点的 fiber_in 信息，FiberInfo 的 fiber_out 保持原数值，若不存在，使用 undefined
            nodes[`${connection.to_node}`].fiberInfo = { fiber_in: `${connection.from_node}`, fiber_out: nodes[`${connection.to_node}`].fiberInfo.fiber_out };
        }
        if (nodes[`${connection.to_node}`].data.type !== 'Fiber' && nodes[`${connection.from_node}`].data.type == 'Fiber') {
            if (fiberNeighbours[`${connection.to_node}`] === undefined) {
                fiberNeighbours[`${connection.to_node}`] = [];
            }
            fiberNeighbours[`${connection.to_node}`].push(`${connection.from_node}`);
            // 设定 Fiber 节点的 fiber_out 信息，FiberInfo 的 fiber_in 保持原数值，若不存在，使用 undefined
            nodes[`${connection.from_node}`].fiberInfo = { fiber_in: nodes[`${connection.from_node}`].fiberInfo.fiber_in, fiber_out: `${connection.to_node}` };
        }
    }

    // --- Actions ---
    async function loadNetwork(id: string) {
        if (networkId.value === id && elements.value.size > 0) return; // Already loaded

        isLoading.value = true;
        error.value = null;
        hasUnsavedChanges.value = false;
        networkId.value = id;
        clearEditorState(); // Clear previous network data

        const { data, error: fetchError, execute } = fetchNetworkById(id);

        watch(data, async (newData) => {
            if (newData) {
                networkName.value = newData.network_name;

                // 1. 先加载所有节点
                elements.value = new Map(newData.elements.map(el => [el.element_id, el]));
                for (const element of elements.value.values()) {
                    loadNodeFromElement(element);
                }

                // 2. 然后加载所有连接
                connections.value = new Map(newData.connections.map(conn => [conn.connection_id, conn]));
                for (const connection of connections.value.values()) {
                    loadEdgeFromConnection(connection);
                }

                // 3. 加载其他数据
                services.value = new Map(newData.services.map(s => [s.service_id, s]));
                si.value = newData.SI;
                span.value = newData.Span;
                simulationConfig.value = newData.simulation_config;
                isLoading.value = false;
            }
        });
        watch(fetchError, (newError) => {
            if (newError) {
                error.value = newError;
                isLoading.value = false;
                networkId.value = null; // Reset on error
            }
        });

        await execute();
    }

    function clearEditorState() {
        networkName.value = '';
        elements.value.clear();
        connections.value.clear();
        services.value.clear();
        si.value = null;
        span.value = null;
        simulationConfig.value = null;
        selectedElementId.value = null;
        selectedConnectionId.value = null;
        editorMode.value = 'view';
        hasUnsavedChanges.value = false;
        associatedLibraryId.value = null;
        associatedLibrary.value = null;
    }

    async function addElement(elementData: Omit<NetworkElement, 'element_id'>, position?: { x: number, y: number }) {
        if (!networkId.value) return;
        // Optimistic UI update? Or wait for API? Let's wait for API response.
        const { data, error: createError } = await apiCreateElement(networkId.value, elementData);
        if (data.value) {
            const positionForMetadata = position ? { x: position.x, y: position.y } : {};
            const newElement = { ...data.value, metadata: { location: positionForMetadata } };
            elements.value.set(newElement.element_id, newElement);
            // hasUnsavedChanges.value = true; // Or consider if API save = saved state
            loadNodeFromElement(newElement);
            return newElement;
        }
        return null;
    }

    async function addConnection(connectionData: { from_node: string; to_node: string }) {
        if (!networkId.value) return null;

        // 调用API创建连接
        const { data, error: createError } = await apiCreateConnection(networkId.value, connectionData);

        if (data.value) {
            // API返回成功后处理连接数据
            const newConnection = data.value;

            // 调用loadEdgeFromConnection处理连接的可视化
            loadEdgeFromConnection(newConnection);

            // 更新连接状态（如果有需要）
            // connections.value.set(newConnection.connection_id, newConnection);
            // hasUnsavedChanges.value = true; // 根据您的保存逻辑决定

            return newConnection;
        }

        // 如果创建失败，可以在这里处理错误
        if (createError.value) {
            console.error('创建连接失败:', createError.value);
            // 可以在这里显示错误提示，如使用ElMessage.error
        }

        return null;
    }


    async function updateElement(elementId: string, updatedData: Partial<Omit<NetworkElement, 'element_id'>>) {
        if (!networkId.value) return;
        const currentElement = elements.value.get(elementId);
        if (!currentElement) return;

        // Merge data - be careful not to overwrite required fields like 'type' unintentionally
        const payload = { ...currentElement, ...updatedData } as Omit<NetworkElement, 'element_id'>;

        const { data, error: updateError } = await apiUpdateElement(networkId.value, elementId, payload);
        if (data.value) {
            // Update the store with the response from the API (might contain updated timestamps etc.)
            const updatedElement = { ...elements.value.get(elementId), ...data.value } as NetworkElement; // Keep existing UI state
            elements.value.set(elementId, updatedElement);
            hasUnsavedChanges.value = true;
            // If the updated element was selected, refresh the selection (optional)
            if (selectedElementId.value === elementId) {
                // selectedElement is computed, so it updates automatically
            }
            return updatedElement;
        }
        return null;
    }


    async function deleteElement(elementId: string) {
        if (!networkId.value) return;

        // Remove connections attached to this element first (client-side or API handles cascade?)
        // Let's assume API handles cascade or we handle it before calling delete.
        // For now, just delete the element optimistically or after API call.

        const { data, error: deleteError } = await apiDeleteElement(networkId.value, elementId);

        if (data.value || !deleteError.value) { // Check if delete was successful
            elements.value.delete(elementId);
            // // Also remove connections associated with this node
            // const connectionsToDelete = Array.from(connections.entries())
            //     .filter(([_, conn]) => conn.from_node === elementId || conn.to_node === elementId)
            //     .map(([id, _]) => id);

            // connectionsToDelete.forEach(connId => connections.value.delete(connId));

            hasUnsavedChanges.value = true;
            if (selectedElementId.value === elementId) {
                selectedElementId.value = null; // Clear selection if deleted item was selected
            }
        }
    }

    // --- Selection and Mode ---
    function selectElement(id: string | null) {
        selectedConnectionId.value = null; // Deselect connections
        selectedElementId.value = id;
        if (id && editorMode.value !== 'connect') {
            editorMode.value = 'edit-params'; // Switch to param edit mode on selection (unless in connect mode)
        } else if (!id && editorMode.value === 'edit-params') {
            editorMode.value = 'view'; // Switch back to view if deselecting
        }
    }

    function selectConnection(id: string | null) {
        selectedElementId.value = null; // Deselect elements
        selectedConnectionId.value = id;
        // Potentially switch mode if connections have editable params
    }

    function setEditorMode(mode: EditorMode) {
        editorMode.value = mode;
        // Reset temporary states when switching modes
        if (mode !== 'connect') {
            temporaryConnection.value = { source: null, target: null };
        }
        if (mode !== 'edit-params') {
            // selectedElementId.value = null; // Optionally deselect element when leaving edit mode
        }
    }

    // --- Connection Logic ---
    function handleNodeClickInConnectMode(nodeId: string) {
        if (editorMode.value !== 'connect') return;

        if (!temporaryConnection.value.source) {
            // Start connection
            temporaryConnection.value.source = nodeId;
            // Provide visual feedback: highlight source node?
        } else if (temporaryConnection.value.source !== nodeId) {
            // Finish connection
            temporaryConnection.value.target = nodeId;
            // // TODO: Add validation logic here (e.g., can't connect transceiver directly to transceiver)
            // // If valid, create the connection via API
            // createConnection({ from_node: temporaryConnection.value.source, to_node: temporaryConnection.value.target });
            // Reset for next connection
            temporaryConnection.value = { source: null, target: null };
            // Optionally switch back to view mode?
            // setEditorMode('view');
        }
        // If clicking the same node twice, cancel the connection start
        else if (temporaryConnection.value.source === nodeId) {
            temporaryConnection.value.source = null;
        }
    }

    // TODO: Implement createConnection, deleteConnection actions similar to element actions

    // --- Saving ---
    async function saveNetworkChanges() {
        if (!networkId.value || !hasUnsavedChanges.value) return;
        isLoading.value = true; // Show loading indicator during save

        // Need an API endpoint to save the entire network structure?
        // The current API docs show individual PUTs for elements, connections, SI, Span etc.
        // This means saving involves potentially many API calls.
        // Option 1: Backend provides a PUT /api/networks/{network_id} that accepts the full NetworkDetail payload. (Ideal)
        // Option 2: Frontend iterates through changed items and calls individual PUTs. (More complex)

        // Assuming Option 1 for simplicity:
        const networkDataToSave = currentNetwork.value;
        // Need PUT /api/networks/{id} that accepts the whole body? Let's assume it exists.
        const { data, error: saveError } = await useApiPut<Partial<NetworkDetail>, NetworkDetail>(
            `/networks/${networkId.value}`,
            networkDataToSave
        );

        if (data.value) {
            // Update state with response (e.g., updated_at timestamp)
            networkName.value = data.value.network_name;
            // Potentially re-sync elements/connections if IDs changed or were generated
            hasUnsavedChanges.value = false; // Mark as saved
            ElMessage.success('Network saved successfully!');
        } else {
            console.error("Save failed:", saveError.value);
            ElMessage.error('Failed to save network.');
        }

        isLoading.value = false;
    }

    // Watch for changes to mark as unsaved
    watch([elements, connections, si, span, simulationConfig, networkName], () => {
        if (!isLoading.value) { // Don't mark as unsaved during initial load
            hasUnsavedChanges.value = true;
        }
    }, { deep: true });


    return {
        // State
        networkId,
        networkName,
        isLoading,
        error,
        hasUnsavedChanges,
        elements, // Expose the map
        connections, // Expose the map
        si,
        span,
        simulationConfig,
        associatedLibrary,
        isLibraryLoading,
        // UI State
        selectedElementId,
        selectedConnectionId,
        editorMode,
        temporaryConnection,
        // Getters
        currentNetwork,
        nodes,
        edges,
        layouts,
        selectedEdges,
        selectedNodes,
        graphConfigs,
        // Actions
        loadNetwork,
        clearEditorState,
        addElement,
        updateElement,
        deleteElement,
        addConnection,
        // deleteConnection,
        selectElement,
        selectConnection,
        setEditorMode,
        handleNodeClickInConnectMode,
        saveNetworkChanges,
        // updateSI, updateSpan, updateSimConfig actions needed
    };
});

