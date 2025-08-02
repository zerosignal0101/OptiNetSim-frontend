// types\library.ts
export interface LibraryListItem {
    library_id: string;
    library_name: string;
    created_at: string;
    updated_at: string;
}

// Matches the structure within equipment_libraries in network export/import
export interface EquipmentLibraryDetail {
    Edfa?: EdfaTemplate[];
    Fiber?: FiberTemplate[];
    RamanFiber?: RamanFiberTemplate[];
    Roadm?: RoadmTemplate[];
    Transceiver?: TransceiverTemplate[];
    // Add other categories (Span, Fused, Multiband Amp if they exist in library)
}

// Generic equipment response from GET /equipment
export type LibraryEquipment = Partial<Pick<EquipmentLibraryDetail, 'Edfa' | 'Fiber' | 'RamanFiber' | 'Roadm' | 'Transceiver' /* Add others */>>;

export type EquipmentCategory = keyof LibraryEquipment;

// Edfa Template
export interface EdfaTemplate {
    type_variety: string; // Common field, assumed required as an identifier
    type_def: string; // Required based on backend validation
    allowed_for_design: boolean; // Common field, assumed required
    gain_min: number; // Common field, assumed required
    gain_flatmax: number; // Common field, assumed required
    p_max: number; // Common field, assumed required
    f_min?: number; // Optional, based on backend TODO comment
    f_max?: number; // Optional, based on backend TODO comment
    pmd?: number; // Optional, based on backend TODO comment
    pdl?: number; // Optional, based on backend TODO comment

    // Fields specific to "variable_gain" type_def
    nf_min?: number;
    nf_max?: number;
    nf_coef?: number[]; // Assumed to be a list of numbers
    out_voa_auto?: boolean;

    // Fields specific to "fixed_gain" type_def
    nf0?: number;

    // Fields specific to "multi_band" type_def
    amplifiers?: any[]; // List of amplifier objects, specific structure not defined in backend

    // Fields specific to "dual_stage" type_def
    preamp_variety?: string;
    booster_variety?: string;

    // 'openroadm', 'openroadm_preamp', 'openroadm_booster', 'advanced_model'
    // do not introduce new unique fields beyond what's already covered or common.
}

// Fiber Template
export interface FiberTemplate {
    type_variety: string; // As per existing template, assumed required
    dispersion: number; // As per existing template, assumed required
    effective_area: number; // As per existing template, assumed required
    pmd_coef: number; // As per existing template, assumed required

    dispersion_slope?: number;
    dispersion_per_frequency?: { value: number[]; frequency: number[] };
    gamma?: number;
    lumped_losses?: Array<{ position: number; loss: number }>;
    raman_coefficient?: { reference_frequency: number; g_0: number };
}

// RamanFiber Template (extends FiberTemplate)
export interface RamanFiberTemplate extends FiberTemplate {
    raman_pumps?: Array<{
        power: number;
        frequency: number;
        propagation_direction: "coprop" | "counterprop";
    }>;
    temperature?: number;
    loss_coef?: { value: number[]; frequency: number[] };
}

// Roadm Template
export interface RoadmTemplate {
    type_variety: string; // Assumed required as an identifier
    target_pch_out_db?: number;
    add_drop_osnr?: number;
    pmd?: number;
    pdl?: number;
    restrictions?: {
        preamp_variety_list: string[];
        booster_variety_list: string[];
    };
}

// Transceiver Penalty (sub-interface for TransceiverMode)
export interface TransceiverPenalty {
    // At least one of these must be present in the backend validation,
    // but they are individually optional in the interface.
    chromatic_dispersion?: number;
    pmd?: number;
    pdl?: number;
    penalty_value: number; // Required if penalty object exists
}

// Transceiver Mode (sub-interface for TransceiverTemplate)
export interface TransceiverMode {
    format: string;
    baud_rate: number;
    OSNR: number;
    bit_rate: number;
    roll_off: number | null; // Can be null
    tx_osnr: number;
    penalties?: TransceiverPenalty[];
    min_spacing: number;
    cost: number;
}

// Transceiver Template
export interface TransceiverTemplate {
    type_variety: string; // Assumed required as an identifier
    frequency?: { min: number; max: number };
    mode?: TransceiverMode[];
}

export type EquipmentTemplate =
    | EdfaTemplate
    | FiberTemplate
    | RamanFiberTemplate
    | RoadmTemplate
    | TransceiverTemplate;
