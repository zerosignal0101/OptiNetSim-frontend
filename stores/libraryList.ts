import { defineStore } from 'pinia';
import type { LibraryListItem } from '~/types/library';
import type { LibraryListResponse } from '~/types/api';
import { useLibraryApi } from '~/composables/useLibraryApi';

export const useLibraryListStore = defineStore('libraryList', () => {
  const { fetchLibraries } = useLibraryApi();

  const libraries = ref<LibraryListItem[]>([]);
  const isLoading = ref(false);
  const error = ref<any>(null);

  async function loadLibraries() {
    if (libraries.value.length > 0) return;
    isLoading.value = true;
    error.value = null;
    // API returns array directly
    const { data, error: fetchError, execute } = fetchLibraries();

     watch(data, (newData) => {
       if (newData) {
         libraries.value = newData || []; // API returns array directly
         isLoading.value = false;
       }
    });
     watch(fetchError, (newError) => {
       if (newError) {
         error.value = newError;
         isLoading.value = false;
         libraries.value = [];
       }
     });

     if(!data.value) {
        await execute();
     } else {
          libraries.value = data.value;
          isLoading.value = false;
     }
  }

   function addLibraryToList(library: LibraryListItem) {
       libraries.value.push(library);
   }
   function updateLibraryInList(updatedLibrary: LibraryListItem) {
        const index = libraries.value.findIndex(lib => lib.library_id === updatedLibrary.library_id);
        if (index !== -1) {
            libraries.value[index] = updatedLibrary;
        }
   }
   function removeLibraryFromList(libraryId: string) {
        libraries.value = libraries.value.filter(lib => lib.library_id !== libraryId);
   }

  return {
    libraries,
    isLoading,
    error,
    loadLibraries,
    addLibraryToList,
    updateLibraryInList,
    removeLibraryFromList
  };
});
