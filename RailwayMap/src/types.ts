/**
 * The Azure Maps Web SDK is loaded dynamically via a <script> tag (see index.ts),
 * so there's no official TypeScript definition to import. This alias centralises
 * the "untyped SDK boundary" in one place — every other file references AtlasAny
 * instead of writing the literal `any` keyword, so no-explicit-any only needs a
 * single, intentional escape hatch instead of one per file.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AtlasAny = any;

export interface Station {
    name: string;
    lat: number;
    lon: number;
    isTerminus?: boolean;
    status?: string;
    stationCategory?: string;
    sectionLength?: number | null;
    passengerVolume?: number | null;
    numberOfLines?: number | null;
    region?: string;
}

export interface Asset {
    id: string;
    type: string;
    name: string;
    lat: number;
    lon: number;
    status?: string;
    detail?: string;
}

export interface Alert {
    id: string;
    name: string;
    fromStation: string;
    toStation: string;
    severity: "amber" | "red";
    description: string;
    reportedAt: string;
    coords: number[][];
}

export interface SelectionState {
    stationName: string;
    assetId: string;
    assetType: string;
    assetStatus: string;
}

import type { Tooltip } from "./ui/Tooltip";

export interface RenderContext {
    map: AtlasAny;
    datasource: AtlasAny;
    tooltip: Tooltip;
    trackCoords: number[][];
    /** Layer IDs added during the current render pass — used by _clearRendered() to tear them down before the next re-render. */
    addedLayerIds: string[];
    /** Source IDs added during the current render pass (excluding the shared datasource) — same purpose as addedLayerIds. */
    addedSourceIds: string[];
    onStationSelect: (name: string, status: string) => void;
    onAssetSelect: (id: string, type: string, status: string) => void;
    onAlertSelect: (alertName: string, alertId: string, severity: string) => void;
}
