import type {
    NetworkListResponse,
    CreateNetworkPayload, UpdateNetworkPayload, // ... other payloads
    // ... other request/response types
} from '~/types/api';
import type { NetworkListItem, NetworkDetail, NetworkElement, NetworkConnection, NetworkService, SpectrumInformation, SpanParameters, SimulationConfig, DeviceType } from '~/types/network';
import type { DeleteResponse } from '~/types/api';
import { useApi, useApiPost, useApiPut, useApiDelete } from './useApi';

export const useNetworkApi = () => {
    const fetchNetworks = () => {
        return useApi<NetworkListResponse>('/networks'); // Assuming API returns { networks: [...] }
    };

    const fetchNetworkById = (networkId: MaybeRefOrGetter<string>) => {
        const url = computed(() => `/networks/${toValue(networkId)}`);
        return useApi<NetworkDetail>(url);
    };

    const createNetwork = (payload: CreateNetworkPayload) => {
        return useApiPost<CreateNetworkPayload, NetworkListItem>('/networks', payload); // API returns created item
    };

    const updateNetwork = (networkId: string, payload: UpdateNetworkPayload) => {
        return useApiPut<UpdateNetworkPayload, NetworkListItem>(`/networks/${networkId}`, payload);
    };

    const deleteNetwork = (networkId: string) => {
        return useApiDelete<DeleteResponse>(`/networks/${networkId}`);
    };

    const exportNetwork = async (networkId: string) => {
        const config = useRuntimeConfig();
        const url = `${config.public.apiBase}/networks/${networkId}/export`;
        try {
            // Use native fetch or $fetch for direct blob handling
            const response = await $fetch.raw(url, { method: 'GET' });
            const blob = await response._data as Blob; // Assuming response is blob

            if (!blob) throw new Error('No data received');

            // Trigger download
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            // Extract filename from content-disposition header if available, otherwise use default
            const disposition = response.headers.get('content-disposition');
            let filename = `network-${networkId}-export.json`;
            if (disposition && disposition.indexOf('attachment') !== -1) {
                const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                const matches = filenameRegex.exec(disposition);
                if (matches != null && matches[1]) {
                    filename = matches[1].replace(/['"]/g, '');
                }
            }
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
            return { success: true };
        } catch (error) {
            console.error("Export failed:", error);
            ElMessage.error('Failed to export network.');
            return { success: false, error };
        }
    };

    const importNetwork = (file: File) => {
        const formData = new FormData();
        formData.append('file', file); // Assuming backend expects 'file' field

        // Adjust options for FormData
        return useFetch('/networks/import', {
            baseURL: useRuntimeConfig().public.apiBase as string,
            method: 'POST',
            body: formData,
            headers: { // Let browser set Content-Type for FormData
                'Accept': 'application/json',
            },
            async onResponseError({ response }) {
                console.error('Import Error:', response.status, response._data);
                ElMessage.error(`Import Error ${response.status}: ${response._data?.message || 'Import failed'}`);
            }
        });
        // Need to align return type with actual API response for import
    };

    const insertTopology = (networkId: string, file: File) => {
        const formData = new FormData();
        formData.append('file', file); // Assuming backend expects 'file' field

        // Adjust options for FormData
        return useFetch(`/networks/${networkId}/import`, {
            baseURL: useRuntimeConfig().public.apiBase as string,
            method: 'POST',
            body: formData,
            headers: { // Let browser set Content-Type for FormData
                'Accept': 'application/json',
            },
            async onResponseError({ response }) {
                console.error('Insert Topology Error:', response.status, response._data);
                ElMessage.error(`Insert Error ${response.status}: ${response._data?.message || 'Insert failed'}`);
            }
        });
        // Need to align return type with actual API response for import
    };

    // --- Element Management ---
    const createElement = (networkId: string, elementData: Omit<NetworkElement, 'element_id' | 'ui'>) => {
        return useApiPost<any, NetworkElement>(`/networks/${networkId}/elements`, elementData);
    };

    const updateElement = (networkId: string, elementId: string, elementData: Omit<NetworkElement, 'element_id' | 'ui'>) => {
        return useApiPut<any, NetworkElement>(`/networks/${networkId}/elements/${elementId}`, elementData);
    };

    const deleteElement = (networkId: string, elementId: string) => {
        return useApiDelete<DeleteResponse>(`/networks/${networkId}/elements/${elementId}`);
    };

    // --- Connection Management ---
    const createConnection = (networkId: string, connectionData: { from_node: string; to_node: string }) => {
        // API returns connection_id in response
        return useApiPost<any, NetworkConnection>(`/networks/${networkId}/connections`, connectionData);
    };

    const updateConnection = (networkId: string, connectionId: string, connectionData: { from_node: string; to_node: string }) => {
        // API response for PUT connection doesn't include connection_id, just from/to
        return useApiPut<any, Pick<NetworkConnection, 'from_node' | 'to_node'>>(`/networks/${networkId}/connections/${connectionId}`, connectionData);
    };

    const deleteConnection = (networkId: string, connectionId: string) => {
        return useApiDelete<DeleteResponse>(`/networks/${networkId}/connections/${connectionId}`);
    };

    // --- Service Management ---
    const createService = (networkId: string, serviceData: Omit<NetworkService, 'service_id'>) => {
        return useApiPost<any, NetworkService>(`/networks/${networkId}/services`, serviceData);
    }
    const updateService = (networkId: string, serviceId: string, serviceData: Partial<Omit<NetworkService, 'service_id' | 'source_element_id' | 'target_element_id'>>) => {
        // API allows updating only traffic_requirement and constraints
        return useApiPut<any, NetworkService>(`/networks/${networkId}/services/${serviceId}`, serviceData);
    }
    const deleteService = (networkId: string, serviceId: string) => {
        return useApiDelete<DeleteResponse>(`/networks/${networkId}/services/${serviceId}`);
    }


    // --- Global Settings ---
    const updateSI = (networkId: string, siData: SpectrumInformation) => {
        return useApiPut<SpectrumInformation, SpectrumInformation>(`/networks/${networkId}/spectrum-information`, siData);
    };

    const updateSpan = (networkId: string, spanData: SpanParameters) => {
        return useApiPut<SpanParameters, SpanParameters>(`/networks/${networkId}/span-parameters`, spanData);
    };

    const updateSimulationConfig = (networkId: string, configData: SimulationConfig) => {
        return useApiPut<SimulationConfig, SimulationConfig>(`/networks/${networkId}/simulation-config`, configData);
    };


    // --- Simulation ---
    const runSimulation = (networkId: string, simulationPayload: any) => {
        // Define the actual payload structure based on GNPy requirements
        // This might be a long-running task, consider how to handle response (e.g., job ID, polling, websockets)
        // The API doc example is very minimal.
        return useApiPost<any, any>(`/networks/${networkId}/simulate`, simulationPayload);
    };


    return {
        fetchNetworks,
        fetchNetworkById,
        createNetwork,
        updateNetwork,
        deleteNetwork,
        exportNetwork,
        importNetwork,
        insertTopology,
        createElement,
        updateElement,
        deleteElement,
        createConnection,
        updateConnection,
        deleteConnection,
        createService,
        updateService,
        deleteService,
        updateSI,
        updateSpan,
        updateSimulationConfig,
        runSimulation,
    };
};
