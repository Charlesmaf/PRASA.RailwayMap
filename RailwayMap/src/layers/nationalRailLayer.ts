import { AtlasAny, RenderContext } from "../types";
import { PRASA_RAIL_LINES } from "../constants/prasaRailLines";
import { findCorridor, getCorridors } from "../constants/corridorRegistry";

const PRASA_BLUE      = "#1f6feb";
const PRASA_BLUE_GLOW = "#1f6feb";

/**
 * Renders the full PRASA national railway network in PRASA blue.
 * Always visible on initial load and at every filter level.
 * Gautrain, Sishen-Saldanha freight and private lines are excluded.
 */
export function renderNationalRail(ctx: RenderContext): void {
    const atlas = (window as AtlasAny).atlas;
    const { map, addedLayerIds, addedSourceIds } = ctx;

    const src = new atlas.source.DataSource("national-rail-src");
    map.sources.add(src);
    addedSourceIds.push("national-rail-src");

    PRASA_RAIL_LINES.forEach((coords, i) => {
        src.add(new atlas.data.Feature(
            new atlas.data.LineString(coords),
            { layerType: "national-rail", segmentId: i }
        ));
    });

    // Subtle glow so lines read clearly on both light and dark basemaps
    map.layers.add(new atlas.layer.LineLayer(src, "national-rail-glow", {
        filter: ["==", ["get", "layerType"], "national-rail"],
        strokeColor: PRASA_BLUE_GLOW,
        strokeWidth: 4,
        strokeOpacity: 0.12,
    }));
    addedLayerIds.push("national-rail-glow");

    // Main PRASA blue line
    map.layers.add(new atlas.layer.LineLayer(src, "national-rail-lines", {
        filter: ["==", ["get", "layerType"], "national-rail"],
        strokeColor: PRASA_BLUE,
        strokeWidth: 1.2,
        strokeOpacity: 0.7,
    }));
    addedLayerIds.push("national-rail-lines");
}

/**
 * Renders PRASA corridors matching the given region as thicker highlighted lines —
 * called when region/sub-region is selected but no specific service line chosen yet.
 */
export function renderRegionCorridors(region: string, ctx: RenderContext): void {
    const atlas = (window as AtlasAny).atlas;
    const { map, addedLayerIds, addedSourceIds } = ctx;

    const corridors = getCorridors().filter(c => {
        if (region === "All" || region === "Gauteng") return true;
        return c.region === region;
    });

    corridors.forEach(corridor => {
        const safeId  = corridor.name.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-]/g, "");
        const srcId   = `region-corridor-src-${safeId}`;
        const layerId = `region-corridor-line-${safeId}`;

        const src = new atlas.source.DataSource(srcId);
        map.sources.add(src);
        addedSourceIds.push(srcId);

        src.add(new atlas.data.Feature(
            new atlas.data.LineString(corridor.coords),
            { corridorName: corridor.name }
        ));

        // Brighter/thicker than the national background so they stand out
        map.layers.add(new atlas.layer.LineLayer(src, layerId, {
            strokeColor: PRASA_BLUE,
            strokeWidth: 4,
            strokeOpacity: 1,
        }));
        addedLayerIds.push(layerId);
    });
}

/**
 * Returns the camera position for the current filter state.
 */
export function getCamera(
    region: string,
    serviceLine: string
): { center: [number, number]; zoom: number } {

    // Specific service line — use midpoint of that corridor
    if (serviceLine && serviceLine !== "All") {
        const corridor = findCorridor(serviceLine);
        if (corridor && corridor.coords.length > 0) {
            const mid = corridor.coords[Math.floor(corridor.coords.length / 2)];
            return { center: [mid[0], mid[1]], zoom: 11 };
        }
    }

    switch (region) {
        case "Gauteng":
            return { center: [28.05, -26.0],  zoom: 9 };
        case "Gauteng North":
            return { center: [28.15, -25.75], zoom: 10 };
        case "Gauteng South":
            return { center: [27.95, -26.2],  zoom: 10.5 };
        default:
            // Whole SA — centred on the country, wide enough to see all provinces
            return { center: [24.5, -28.5],   zoom: 5 };
    }
}
