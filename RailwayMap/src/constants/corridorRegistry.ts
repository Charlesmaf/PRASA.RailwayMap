/**
 * Central registry mapping every PRASA service line name to its
 * track geometry and map colour.
 * All corridors use PRASA blue (#1f6feb) for consistent branding.
 */

import { TRACK_COORDS } from "./trackCoords";
import { TRACK_COORDS_CENTURION_JOHANNESBURG } from "./trackCoords_Centurion_Johannesburg";
import { TRACK_COORDS_MABOPANE_PRETORIA } from "./trackCoords_Mabopane_Pretoria";
import { TRACK_COORDS_LERALLA_JOHANNESBURG } from "./trackCoords_Leralla_Johannesburg";

export interface CorridorDef {
    name: string;
    region: string;
    coords: number[][];
    color: string;
}

const PRASA_BLUE = "#1f6feb";

export const CORRIDOR_REGISTRY: CorridorDef[] = [
    {
        name: "Naledi - Johannesburg",
        region: "Gauteng South",
        coords: TRACK_COORDS,
        color: PRASA_BLUE,
    },
    {
        name: "Centurion - Johannesburg",
        region: "Gauteng North",
        coords: TRACK_COORDS_CENTURION_JOHANNESBURG,
        color: PRASA_BLUE,
    },
    {
        name: "Mabopane - Pretoria",
        region: "Gauteng North",
        coords: TRACK_COORDS_MABOPANE_PRETORIA,
        color: PRASA_BLUE,
    },
    {
        name: "Leralla - Johannesburg",
        region: "Gauteng South",
        coords: TRACK_COORDS_LERALLA_JOHANNESBURG,
        color: PRASA_BLUE,
    },
];

export function findCorridor(serviceLine: string): CorridorDef | undefined {
    return CORRIDOR_REGISTRY.find(c => c.name === serviceLine);
}

export function getCorridors(): CorridorDef[] {
    return CORRIDOR_REGISTRY;
}