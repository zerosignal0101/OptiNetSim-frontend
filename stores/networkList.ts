import { defineStore } from 'pinia';
import type { NetworkListItem } from '~/types/network';
import type { NetworkListResponse } from '~/types/api';
import { useNetworkApi } from '~/composables/useNetworkApi';

export const useNetworkListStore = defineStore('networkList', () => {
  const { fetchNetworks } = useNetworkApi();

  const networks = ref<NetworkListItem[]>([]);
  const isLoading = ref(false);
  const error = ref<any>(null);

  async function loadNetworks() {
    if (networks.value.length > 0) return; // Avoid redundant loads
    isLoading.value = true;
    error.value = null;
    const { data, error: fetchError, execute } = fetchNetworks();

    // Use watch or await execute()
    watch(data, (newData) => {
       if (newData) {
         // The API returns { networks: [...] }, so access .networks
         networks.value = newData.networks || [];
         isLoading.value = false;
       }
    });
     watch(fetchError, (newError) => {
       if (newError) {
         error.value = newError;
         isLoading.value = false;
          networks.value = []; // Clear on error
       }
     });

     // Initial fetch if data is not already populated
    if(!data.value) {
        await execute();
    } else if (data.value.networks) {
         networks.value = data.value.networks;
         isLoading.value = false;
    }
  }

   // Actions to modify the list after CRUD operations
  function addNetworkToList(network: NetworkListItem) {
      networks.value.push(network);
  }
  function updateNetworkInList(updatedNetwork: NetworkListItem) {
      const index = networks.value.findIndex(n => n.network_id === updatedNetwork.network_id);
      if (index !== -1) {
          networks.value[index] = updatedNetwork;
      }
  }
  function removeNetworkFromList(networkId: string) {
      networks.value = networks.value.filter(n => n.network_id !== networkId);
  }

  return {
    networks,
    isLoading,
    error,
    loadNetworks,
    addNetworkToList,
    updateNetworkInList,
    removeNetworkFromList
  };
});
