// Basic network info for lists
export interface NetworkListItem {
  network_id: string
  network_name: string
  created_at: string // Consider using Date objects after fetching
  updated_at: string
}

// Detailed network structure (matching GET /api/networks/{network_id})
export interface NetworkDetail {
  network_id: string
  network_name: string
  created_at: string
  updated_at: string
  elements: NetworkElement[]
  connections: NetworkConnection[]
  services: NetworkService[]
  SI: SpectrumInformation | null
  Span: SpanParameters | null
  simulation_config: SimulationConfig | null
}

export interface NetworkElement {
  element_id: string
  name: string
  type: DeviceType // e.g., 'Transceiver', 'Fiber', 'Edfa', 'Roadm' etc. Use an Enum or string literal union
  library_id?: string // Optional, might not be present for all elements? API shows it.
  type_variety?: string // Optional, might not be present for all elements? API shows it.
  params?: Record<string, any> // Parameters specific to the element type
  operational?: Record<string, any> // Parameters specific to the element type
  metadata: Record<string, any> // e.g., location
}

// Define specific element types if needed for strong typing, inheriting NetworkElement
// export interface FiberElement extends NetworkElement {
//   type: 'Fiber';
//   params: {
//     length: number;
//     loss_coef: number;
//     // ... other Fiber params
//   };
// }

export type DeviceType = 'Transceiver' | 'Fiber' | 'Edfa' | 'RamanFiber' | 'Roadm' | 'Fused' // Add all types

export interface NetworkConnection {
  connection_id: string // Connection ID
  from_node: string // element_id
  to_node: string // element_id
}

export interface TrafficRequirement {
  bandwidth: number
  latency: number
}

export interface NetworkService {
  service_id: string
  name: string
  status: 'Active' | 'Inactive' | string // Assuming status can be other values too
  path: string[]
  service_requirements: {
    bandwidth: number // in bps
    latency: number // in ms
  }
  service_constraints: Record<string, unknown> // More flexible than any[]
  created_at: string // ISO 8601 date-time format
  updated_at: string // ISO 8601 date-time format
}

export interface SpectrumInformation {
  f_min: number
  baud_rate: number
  f_max: number
  spacing: number
  power_dbm: number
  power_range_db: number[]
  roll_off: number
  tx_osnr: number
  sys_margins: number
}

export interface SpanParameters {
  power_mode: boolean
  delta_power_range_db: number[]
  max_fiber_lineic_loss_for_raman: number
  target_extended_gain: number
  max_length: number
  length_units: string
  max_loss: number
  padding: number
  EOL: number
  con_in: number
  con_out: number
}

export interface SimulationConfig {
  raman_params: RamanParams
  nli_params: NliParams
}

export interface RamanParams {
  flag: boolean
  result_spatial_resolution: number
  solver_spatial_resolution: number
}

export interface NliParams {
  method: string
  dispersion_tolerance: number
  phase_shift_tolerance: number
  computed_channels: number[]
}
