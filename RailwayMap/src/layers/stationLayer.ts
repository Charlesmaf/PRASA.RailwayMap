import { AtlasAny, Station, RenderContext } from "../types";

const TRAIN_ICON_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <circle cx="16" cy="16" r="15" fill="#1f6feb" stroke="#ffffff" stroke-width="2"/>
  <rect x="9" y="10" width="14" height="10" rx="2" ry="2" fill="#ffffff"/>
  <rect x="11" y="8" width="10" height="4" rx="1" ry="1" fill="#ffffff"/>
  <rect x="10" y="12" width="4" height="3" rx="1" fill="#1f6feb"/>
  <rect x="18" y="12" width="4" height="3" rx="1" fill="#1f6feb"/>
  <circle cx="12" cy="21" r="2" fill="#ffffff" stroke="#1f6feb" stroke-width="1"/>
  <circle cx="20" cy="21" r="2" fill="#ffffff" stroke="#1f6feb" stroke-width="1"/>
  <circle cx="23" cy="14" r="1" fill="#f0c040"/>
</svg>`;

const TERMINUS_ICON_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
  <circle cx="20" cy="20" r="19" fill="#f85149" stroke="#ffffff" stroke-width="2"/>
  <rect x="10" y="13" width="20" height="13" rx="2" ry="2" fill="#ffffff"/>
  <rect x="13" y="9" width="14" height="6" rx="2" ry="2" fill="#ffffff"/>
  <rect x="11" y="16" width="6" height="4" rx="1" fill="#f85149"/>
  <rect x="23" y="16" width="6" height="4" rx="1" fill="#f85149"/>
  <circle cx="14" cy="27" r="3" fill="#ffffff" stroke="#f85149" stroke-width="1.5"/>
  <circle cx="26" cy="27" r="3" fill="#ffffff" stroke="#f85149" stroke-width="1.5"/>
  <circle cx="30" cy="18" r="1.5" fill="#f0c040"/>
</svg>`;

function toDataURL(svg: string): string {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.trim())}`;
}

export function renderStations(
    stations: Station[],
    ctx: RenderContext
): void {
    const atlas = (window as AtlasAny).atlas;
    const { map, datasource, tooltip, onStationSelect, addedLayerIds } = ctx;

    stations.forEach((s) => {
        datasource.add(new atlas.data.Feature(
            new atlas.data.Point([s.lon, s.lat]),
            {
                layerType: "station",
                name: s.name,
                isTerminus: !!s.isTerminus,
                status: s.status || "operational",
                type: "station",
                lat: s.lat,
                lon: s.lon,
                stationCategory: s.stationCategory || "",
                sectionLength: s.sectionLength ?? "",
                passengerVolume: s.passengerVolume ?? "",
                numberOfLines: s.numberOfLines ?? "",
                region: s.region || "",
            }
        ));
    });

    const trainImg = new Image(32, 32);
    const terminusImg = new Image(40, 40);
    let loaded = 0;

    const onBothLoaded = () => {
        if (++loaded < 2) return;

        // imageSprite.add() throws if the key is already registered. The icons
        // are static so on a data re-render this just means "nothing to do" —
        // swallow it rather than letting it abort the rest of the render pass.
        try { map.imageSprite.add("train-icon", trainImg); } catch { /* already added */ }
        try { map.imageSprite.add("terminus-icon", terminusImg); } catch { /* already added */ }

        map.layers.add(new atlas.layer.SymbolLayer(datasource, "stations-regular", {
            filter: ["all", ["==", ["get", "layerType"], "station"], ["!=", ["get", "isTerminus"], true]],
            iconOptions: { image: "train-icon", size: 0.9, anchor: "center", allowOverlap: true },
            textOptions: { textField: ["get", "name"], color: "#e6edf3", haloColor: "#0d1117", haloWidth: 2, size: 10, offset: [0, -2.2], allowOverlap: false },
        }));
        addedLayerIds.push("stations-regular");

        map.layers.add(new atlas.layer.SymbolLayer(datasource, "stations-terminus", {
            filter: ["all", ["==", ["get", "layerType"], "station"], ["==", ["get", "isTerminus"], true]],
            iconOptions: { image: "terminus-icon", size: 1.0, anchor: "center", allowOverlap: true },
            textOptions: { textField: ["get", "name"], color: "#ffffff", haloColor: "#000000", haloWidth: 2, size: 12, offset: [0, -2.8], allowOverlap: true },
        }));
        addedLayerIds.push("stations-terminus");

        ["stations-terminus", "stations-regular"].forEach((layerId) => {
            const layer = map.layers.getLayerById(layerId);

            map.events.add("click", layer, (e: AtlasAny) => {
                if (!e.shapes?.length) return;
                const props = e.shapes[0].getProperties();
                onStationSelect(props.name || "", props.status || "operational");
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
    };

    trainImg.onload = onBothLoaded;
    terminusImg.onload = onBothLoaded;
    trainImg.src = toDataURL(TRAIN_ICON_SVG);
    terminusImg.src = toDataURL(TERMINUS_ICON_SVG);
}
