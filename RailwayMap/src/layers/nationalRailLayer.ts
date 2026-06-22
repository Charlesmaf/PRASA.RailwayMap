import { AtlasAny, RenderContext } from "../types";
import { NATIONAL_RAIL_LINES } from "../constants/nationalRailLines";

/**
 * Renders all South African railways as a dim background layer.
 * Shown at all zoom levels. Individual service lines are rendered
 * on top by renderServiceLine() when a corridor is selected.
 */
export function renderNationalRail(ctx: RenderContext): void {
    const atlas = (window as AtlasAny).atlas;
    const { map, addedLayerIds, addedSourceIds } = ctx;

    const src = new atlas.source.DataSource("national-rail-src");
    map.sources.add(src);
    addedSourceIds.push("national-rail-src");

    // Add each simplified line segment as a Feature
    NATIONAL_RAIL_LINES.forEach((coords, i) => {
        src.add(new atlas.data.Feature(
            new atlas.data.LineString(coords),
            { layerType: "national-rail", segmentId: i }
        ));
    });

    // Single dim grey layer — subtle background, not competing with active corridor
    map.layers.add(new atlas.layer.LineLayer(src, "national-rail-lines", {
        filter: ["==", ["get", "layerType"], "national-rail"],
        strokeColor: "#4a5568",
        strokeWidth: 1,
        strokeOpacity: 0.5,
    }));
    addedLayerIds.push("national-rail-lines");
}

/**
 * Applies a region filter by adjusting camera bounds.
 * Does not add/remove layers — the national layer always shows all lines,
 * the camera zoom communicates region context.
 */
export const REGION_CAMERAS: Record<string, { center: [number, number]; zoom: number }> = {
    "All":            { center: [25.5, -29.0], zoom: 5.5 },
    "Gauteng North":  { center: [28.1, -25.65], zoom: 10 },
    "Gauteng South":  { center: [27.98, -26.22], zoom: 10.5 },
};
