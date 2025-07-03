import type { EquipmentLibraryDetail } from '~/types/library';
// Nuxt 3 (with Vite) allows direct import of JSON files.
// The path alias '~/' points to the project root.
import libraryJson from '~/assets/data/eqpt_config_openroadm_ver5.json';

/**
 * @description Composable for loading the default equipment library.
 */
export const useDefaultLibrary = () => {

    /**
     * Loads and transforms the static JSON data into the EquipmentLibraryDetail type.
     * It filters out keys that are not part of the EquipmentLibraryDetail interface,
     * such as 'SI' and 'Span'.
     * @returns {EquipmentLibraryDetail} The structured equipment library object.
     */
    const loadDefaultEquipmentLibrary = (): EquipmentLibraryDetail => {
        // The source JSON contains extra keys ('SI', 'Span') that are not defined
        // in the EquipmentLibraryDetail type. We must explicitly pick only the
        // keys that match the target type to ensure type safety.

        const typedLibrary: EquipmentLibraryDetail = {
            Edfa: libraryJson.Edfa,
            Fiber: libraryJson.Fiber,
            RamanFiber: libraryJson.RamanFiber,
            Roadm: libraryJson.Roadm,
            Transceiver: libraryJson.Transceiver,
            // We intentionally omit 'Span' and 'SI' as they are not part of the type.
        };

        // The types for each equipment array (e.g., EdfaTemplate[]) are assumed to match
        // between the JSON and the TypeScript interfaces.
        return typedLibrary;
    };

    return {
        loadDefaultEquipmentLibrary,
    };
};