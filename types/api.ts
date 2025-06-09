import type { NetworkListItem } from './network';
import type { LibraryListItem } from './library';

export interface NetworkListResponse {
  networks: NetworkListItem[];
}

export interface LibraryListResponse extends Array<LibraryListItem> {} // API returns array directly

export interface DeleteResponse {
  message: string;
}

// Add request body types
export interface CreateNetworkPayload {
  network_name: string;
}
export interface UpdateNetworkPayload {
    network_name: string;
}
 // ... add other payload types for POST/PUT requests
