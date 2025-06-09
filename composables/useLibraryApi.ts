import type { LibraryListResponse, DeleteResponse } from '~/types/api';
import type { LibraryListItem, EquipmentLibraryDetail, LibraryEquipment, EquipmentCategory, EquipmentTemplate } from '~/types/library'; // Assuming EquipmentTemplate is a base or union type
import { useApi, useApiPost, useApiPut, useApiDelete } from './useApi';

export const useLibraryApi = () => {
    const fetchLibraries = () => {
        // API returns array directly
        return useApi<LibraryListResponse>('/equipment-libraries');
    };

    const fetchLibraryEquipment = (libraryId: MaybeRefOrGetter<string>) => {
        const url = computed(() => `/equipment-libraries/${toValue(libraryId)}/equipment`);
        // API returns the equipment object directly { Edfa: [], Fiber: [], ... }
        return useApi<LibraryEquipment>(url);
    };

    const createLibrary = (payload: { library_name: string }) => {
        return useApiPost<any, LibraryListItem>('/equipment-libraries', payload);
    };

    const updateLibrary = (libraryId: string, payload: { library_name: string }) => {
        return useApiPut<any, LibraryListItem>(`/equipment-libraries/${libraryId}`, payload);
    };

    const deleteLibrary = (libraryId: string) => {
        return useApiDelete<DeleteResponse>(`/equipment-libraries/${libraryId}`);
    };

    // Equipment within a library
    const addEquipment = <T extends EquipmentTemplate>(libraryId: string, category: EquipmentCategory, equipmentData: T) => {
        // Ensure category casing matches API (e.g., 'Edfa', 'Fiber')
        const cat = category.charAt(0).toUpperCase() + category.slice(1);
        return useApiPost<T, T>(`/equipment-libraries/${libraryId}/equipment/${cat}`, equipmentData);
    };

    const updateEquipment = <T extends EquipmentTemplate>(libraryId: string, category: EquipmentCategory, typeVariety: string, equipmentData: T) => {
        const cat = category.charAt(0).toUpperCase() + category.slice(1);
        // URL encode typeVariety as it might contain spaces or special chars
        return useApiPut<T, T>(`/equipment-libraries/${libraryId}/equipment/${cat}/${encodeURIComponent(typeVariety)}`, equipmentData);
    };

    const deleteEquipment = (libraryId: string, category: EquipmentCategory, typeVariety: string) => {
        const cat = category.charAt(0).toUpperCase() + category.slice(1);
        return useApiDelete<DeleteResponse>(`/equipment-libraries/${libraryId}/equipment/${cat}/${encodeURIComponent(typeVariety)}`);
    };


    return {
        fetchLibraries,
        fetchLibraryEquipment,
        createLibrary,
        updateLibrary,
        deleteLibrary,
        addEquipment,
        updateEquipment,
        deleteEquipment,
    };
};
