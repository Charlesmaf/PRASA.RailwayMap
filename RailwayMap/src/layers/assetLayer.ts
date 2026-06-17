import { AtlasAny, Asset, RenderContext } from "../types";
import { statusColor } from "../utils";

/** Each entry: [layerId, assetType filter, radius, strokeWidth, opacity?] */
const ASSET_LAYER_CONFIGS: [string, string, number, number, number?][] = [
    ["signals", "signal", 7, 1.5],
    ["cameras", "camera", 6, 1.5],
    ["crossings", "crossing", 6, 1.5],
    ["track-assets", "track", 6, 1.5],
    ["power-assets", "power", 6, 1.5],
    ["structure-assets", "structure", 6, 1.5],
    ["telecoms-assets", "telecoms", 6, 1.5],
    ["building-assets", "building", 6, 1.5],
    ["other-assets", "other", 5, 1.0],
];

export function renderAssets(
    assets: Asset[],
    ctx: RenderContext
): void {
    const atlas = (window as AtlasAny).atlas;
    const { map, datasource, tooltip, onAssetSelect, addedLayerIds } = ctx;

    assets.forEach((a) => {
        datasource.add(new atlas.data.Feature(
            new atlas.data.Point([a.lon, a.lat]),
            {
                layerType: a.type === "fault" ? "fault" : "asset",
                assetType: a.type,
                name: a.name,
                assetId: a.id,
                status: a.status || "operational",
                statusColor: statusColor(a.status ?? ""),
                detail: a.detail || "",
            }
        ));
    });

    // Regular asset layers
    ASSET_LAYER_CONFIGS.forEach(([layerId, assetType, radius, strokeWidth]) => {
        map.layers.add(new atlas.layer.BubbleLayer(datasource, layerId, {
            filter: ["all", ["==", ["get", "layerType"], "asset"], ["==", ["get", "assetType"], assetType]],
            radius,
            color: ["get", "statusColor"],
            strokeColor: "#0d1117",
            strokeWidth,
        }));
    });

    // Fault layer
    map.layers.add(new atlas.layer.BubbleLayer(datasource, "faults", {
        filter: ["==", ["get", "layerType"], "fault"],
        radius: 9,
        color: "#f85149",
        strokeColor: "#ff7b72",
        strokeWidth: 3,
        opacity: 0.9,
    }));

    const allLayerIds = [...ASSET_LAYER_CONFIGS.map(([id]) => id), "faults"];
    addedLayerIds.push(...allLayerIds);

    allLayerIds.forEach((layerId) => {
        const layer = map.layers.getLayerById(layerId);

        map.events.add("click", layer, (e: AtlasAny) => {
            if (!e.shapes?.length) return;
            const props = e.shapes[0].getProperties();
            onAssetSelect(props.assetId || "", props.assetType || "", props.status || "");
        });

        map.events.add("mouseover", layer, (e: AtlasAny) => {
            map.getCanvasContainer().style.cursor = "pointer";
            if (e.shapes?.length) tooltip.show(e.shapes[0].getProperties(), e.pixel);
        });

        map.events.add("mousemove", layer, (e: AtlasAny) => {
            if (e.pixel) tooltip.moveTo(e.pixel);
        });

        map.events.add("mouseout", layer, () => {
            map.getCanvasContainer().style.cursor = "";
            tooltip.hide();
        });
    });
}
