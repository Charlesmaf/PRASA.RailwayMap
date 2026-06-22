import { AtlasAny, RenderContext } from "../types";
import { TRACK_COORDS } from "../constants/trackCoords";

export function renderTrack(ctx: RenderContext): void {
    const atlas = (window as AtlasAny).atlas;
    const { map, datasource, addedLayerIds } = ctx;

    datasource.add(new atlas.data.Feature(
        new atlas.data.LineString(TRACK_COORDS),
        { layerType: "track" }
    ));

    map.layers.add(new atlas.layer.LineLayer(datasource, "track-glow", {
        filter: ["==", ["get", "layerType"], "track"],
        strokeColor: "#1f6feb",
        strokeWidth: 16,
        strokeOpacity: 0.9,
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
        strokeColor: "#00ff26",
        strokeWidth: 3.5,
        strokeOpacity: 1,
    }));
    addedLayerIds.push("track-centre");
}
