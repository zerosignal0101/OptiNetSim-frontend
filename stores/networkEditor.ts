import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import type { NetworkDetail, NetworkElement, NetworkConnection, SpectrumInformation, SpanParameters, SimulationConfig, DeviceType } from '~/types/network';
import type { EquipmentLibraryDetail } from '~/types/library'; // Import library types
import { v4 as uuidv4 } from 'uuid'; // For temporary frontend IDs if needed
import { useLibraryApi } from '~/composables/useLibraryApi';
import { useNetworkApi } from '~/composables/useNetworkApi';
import { useApiPut } from '~/composables/useApi';

// Define Node and Edge types compatible with v-network-graph
interface GraphNode extends NetworkElement { // Extend NetworkElement
    id: string; // v-network-graph needs 'id'
    // Add other v-network-graph specific properties if needed (e.g., color, size)
}
interface GraphEdge extends NetworkConnection { // Extend NetworkConnection
    id: string; // v-network-graph needs 'id'
    source: string; // element_id
    target: string; // element_id
    // Add other v-network-graph specific properties if needed (e.g., color, width)
}

type EditorMode = 'view' | 'connect' | 'edit-params';

export const useNetworkEditorStore = defineStore('networkEditor', () => {
    const { fetchNetworkById, updateElement: apiUpdateElement, createElement: apiCreateElement, deleteElement: apiDeleteElement, /* ... other api calls ... */ } = useNetworkApi();
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

    // Data formatted for v-network-graph
    const graphNodes = computed(() => {
        const nodes: Record<string, GraphNode> = {};
        elements.value.forEach(el => {
            nodes[el.element_id] = {
                ...el,
                id: el.element_id, // Map element_id to id
                name: `${el.name} (${el.type})`, // Display name for graph
                // Add dynamic styling based on type or selection
                ...(el.element_id === selectedElementId.value ? { color: 'blue', zIndex: 1 } : { color: 'grey' }), // Example selection styling
                ...(el.ui || {}), // Include potential x, y from backend or previous saves
            };
        });
        return nodes;
    });

    const graphEdges = computed(() => {
        const edges: Record<string, GraphEdge> = {};
        connections.value.forEach((conn, id) => { // Assuming connection_id is the key
            edges[id] = { // Use connection_id as edge ID if available, otherwise generate one
                ...conn,
                id: conn.connection_id || id, // Ensure unique ID for graph
                source: conn.from_node,
                target: conn.to_node,
                // Add dynamic styling based on selection
                ...(id === selectedConnectionId.value ? { color: 'blue', width: 3 } : { color: 'grey', width: 1 }), // Example selection styling
            };
        });
        return edges;
    });

    const selectedElement = computed(() => {
        return selectedElementId.value ? elements.value.get(selectedElementId.value) : null;
    });

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
                elements.value = new Map(newData.elements.map(el => [el.element_id, el]));
                // Need connection_id for updates/deletes. API GET /networks/{id} doesn't show it directly in `connections`.
                // Assume API POST/PUT/DELETE for connections *requires* a connection_id that we get from POST response.
                // We might need to fetch connections separately or the backend needs to include connection_id in the main GET response.
                // For now, let's use a generated key if missing. Ideally, backend provides stable IDs.
                connections.value = new Map(newData.connections.map((conn, index) => {
                    const connId = (conn as any).connection_id || `temp-conn-${index}`; // Placeholder ID if missing
                    return [connId, { ...conn, connection_id: connId }];
                }));
                services.value = new Map(newData.services.map(s => [s.service_id, s]));
                si.value = newData.SI;
                span.value = newData.Span;
                simulationConfig.value = newData.simulation_config;

                // Determine the associated library (Needs logic. How is it linked? First element? Assume fixed for now)
                const firstElementWithLib = newData.elements.find(el => el.library_id);
                if (firstElementWithLib?.library_id) {
                    await loadAssociatedLibrary(firstElementWithLib.library_id);
                }

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

    async function loadAssociatedLibrary(libId: string) {
        if (associatedLibraryId.value === libId && associatedLibrary.value) return;
        isLibraryLoading.value = true;
        associatedLibraryId.value = libId;
        const { data, error: libError, execute } = fetchLibraryEquipment(libId);
        watch(data, (libData) => {
            if (libData) {
                // The API returns the equipment object directly. We need to wrap it.
                // Fetch full library details (name, dates) separately if needed, or assume we have them elsewhere.
                associatedLibrary.value = {
                    library_id: libId,
                    library_name: `Library ${libId}`, // Placeholder name
                    created_at: '', updated_at: '', // Placeholder dates
                    ...libData // Spread the equipment categories (Edfa, Fiber...)
                } as EquipmentLibraryDetail; // Cast might be needed
                isLibraryLoading.value = false;
            }
        });
        watch(libError, (err) => {
            if (err) {
                console.error("Failed to load associated library", err);
                associatedLibrary.value = null;
                isLibraryLoading.value = false;
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

    async function addElement(elementData: Omit<NetworkElement, 'element_id' | 'ui'>, position?: { x: number, y: number }) {
        if (!networkId.value) return;
        // Optimistic UI update? Or wait for API? Let's wait for API response.
        const { data, error: createError } = await apiCreateElement(networkId.value, elementData);
        if (data.value) {
            const newElement = { ...data.value, ui: position ? { x: position.x, y: position.y } : {} };
            elements.value.set(newElement.element_id, newElement);
            hasUnsavedChanges.value = true; // Or consider if API save = saved state
            return newElement;
        }
        return null;
    }

    async function updateElement(elementId: string, updatedData: Partial<Omit<NetworkElement, 'element_id' | 'ui'>>) {
        if (!networkId.value) return;
        const currentElement = elements.value.get(elementId);
        if (!currentElement) return;

        // Merge data - be careful not to overwrite required fields like 'type' unintentionally
        const payload = { ...currentElement, ...updatedData } as Omit<NetworkElement, 'element_id' | 'ui'>;
        delete (payload as any).ui; // Don't send UI state to backend unless intended

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
        graphNodes,
        graphEdges,
        selectedElement,
        // Actions
        loadNetwork,
        clearEditorState,
        addElement,
        updateElement,
        deleteElement,
        // addConnection,
        // deleteConnection,
        selectElement,
        selectConnection,
        setEditorMode,
        handleNodeClickInConnectMode,
        saveNetworkChanges,
        // updateSI, updateSpan, updateSimConfig actions needed
    };
});

