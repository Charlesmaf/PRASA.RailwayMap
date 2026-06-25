import { AtlasAny, RenderContext } from "../types";
import { findCorridor, CORRIDOR_REGISTRY } from "../constants/corridorRegistry";

export function renderTrack(ctx: RenderContext, serviceLine = "Naledi - Johannesburg"): void {
    const atlas = (window as AtlasAny).atlas;
    const { map, datasource, addedLayerIds } = ctx;

    const corridor = findCorridor(serviceLine) ?? CORRIDOR_REGISTRY[0];
    const { coords, color } = corridor;

    datasource.add(new atlas.data.Feature(
        new atlas.data.LineString(coords),
        { layerType: "track" }
    ));

    map.layers.add(new atlas.layer.LineLayer(datasource, "track-glow", {
        filter: ["==", ["get", "layerType"], "track"],
        strokeColor: color,
        strokeWidth: 16,
        strokeOpacity: 0.12,
    }));
    addedLayerIds.push("track-glow");

    map.layers.add(new atlas.layer.LineLayer(datasource, "track-sleepers", {
        filter: ["==", ["get", "layerType"], "track"],
        strokeColor: "#ffffff",
        strokeWidth: 9,
        strokeOpacity: 0.85,
        strokeDashArray: [0.1, 2.8],
    }));
    addedLayerIds.push("track-sleepers");

    map.layers.add(new atlas.layer.LineLayer(datasource, "track-centre", {
        filter: ["==", ["get", "layerType"], "track"],
        strokeColor: color,
        strokeWidth: 2.5,
        strokeOpacity: 1,
    }));
    addedLayerIds.push("track-centre");
}
