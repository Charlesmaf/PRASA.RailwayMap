import { IInputs, IOutputs } from "./generated/ManifestTypes";
/// <reference types="powerapps-component-framework" />

import { AtlasAny, RenderContext, SelectionState } from "./src/types";
import { parseJSON } from "./src/utils";
import { DEFAULT_STATIONS, DEFAULT_ASSETS } from "./src/constants/defaults";
import { Tooltip } from "./src/ui/Tooltip";
import { renderTrack } from "./src/layers/trackLayer";
import { renderStations } from "./src/layers/stationLayer";
import { renderAssets } from "./src/layers/assetLayer";
import { normaliseAlerts, renderAlerts, renderAlertStations } from "./src/layers/alertLayer";

export class RailwayMap
    implements ComponentFramework.StandardControl<IInputs, IOutputs> {

    private _container!: HTMLDivElement;
    private _mapDiv!: HTMLDivElement;
    private _tooltip!: Tooltip;
    private _context!: ComponentFramework.Context<IInputs>;
    private _notifyOutputChanged!: () => void;

    private _selection: SelectionState = { stationName: "", assetId: "", assetType: "", assetStatus: "" };
    private _lastFocusStation = "";

    private _map: AtlasAny = null;
    private _datasource: AtlasAny = null;
    private _atlasLoaded = false;

    // ─── Layer/source bookkeeping ──────────────────────────────────────────────
    // Every layer/source created by a render pass gets its ID pushed in here via
    // RenderContext. _clearRendered() uses these to tear everything down before
    // the next re-render, so fixed-ID layers (track-glow, stations-regular,
    // alert-station-source, etc.) and per-alert sources (alert-src-<id>) don't
    // collide with themselves on the next data refresh.
    private _addedLayerIds: string[] = [];
    private _addedSourceIds: string[] = [];

    // ─── PCF lifecycle ────────────────────────────────────────────────────────

    public init(
        context: ComponentFramework.Context<IInputs>,
        notifyOutputChanged: () => void,
        _state: ComponentFramework.Dictionary,
        container?: HTMLDivElement
    ): void {
        if (!container) return;

        this._context = context;
        this._notifyOutputChanged = notifyOutputChanged;

        this._container = document.createElement("div");
        this._container.style.cssText =
            "width:100%;height:100%;position:relative;background:#0d1117;font-family:'Segoe UI',system-ui,sans-serif;";
        container.appendChild(this._container);

        this._mapDiv = document.createElement("div");
        this._mapDiv.id = "prasa-railway-map-" + Date.now();
        this._mapDiv.style.cssText = "width:100%;height:100%;";
        this._container.appendChild(this._mapDiv);

        this._tooltip = new Tooltip(this._container);

        this._loadAtlasSDK();
    }

    public updateView(context: ComponentFramework.Context<IInputs>): void {
        const prev = this._context?.parameters;
        this._context = context;

        if (!this._atlasLoaded || !this._map) return;

        const cur = context.parameters;
        const dataChanged =
            cur.StationsJSON?.raw !== prev?.StationsJSON?.raw ||
            cur.AssetsJSON?.raw !== prev?.AssetsJSON?.raw ||
            cur.AlertsJSON?.raw !== prev?.AlertsJSON?.raw;

        if (dataChanged && this._datasource) {
            this._clearRendered();
            this._renderAll();
        }

        const focus = cur.FocusStation?.raw || "";
        if (focus && focus !== this._lastFocusStation) {
            this._lastFocusStation = focus;
            this._focusOnStation(focus);
        }
    }

    public getOutputs(): IOutputs {
        return {
            SelectedStationName: this._selection.stationName,
            SelectedAssetId: this._selection.assetId,
            SelectedAssetType: this._selection.assetType,
            SelectedAssetStatus: this._selection.assetStatus,
        };
    }

    public destroy(): void {
        this._map?.dispose();
        this._map = null;
    }

    // ─── SDK loading ──────────────────────────────────────────────────────────

    private _loadAtlasSDK(): void {
        if (!document.getElementById("atlas-css")) {
            const link = document.createElement("link");
            link.id = "atlas-css";
            link.rel = "stylesheet";
            link.href = "https://atlas.microsoft.com/sdk/javascript/mapcontrol/3/atlas.min.css";
            document.head.appendChild(link);
        }

        if (!document.getElementById("atlas-js")) {
            const script = document.createElement("script");
            script.id = "atlas-js";
            script.src = "https://atlas.microsoft.com/sdk/javascript/mapcontrol/3/atlas.min.js";
            script.onload = () => { this._atlasLoaded = true; this._initMap(); };
            document.head.appendChild(script);
        } else if ((window as AtlasAny).atlas) {
            this._atlasLoaded = true;
            this._initMap();
        }
    }

    // ─── Map initialisation ───────────────────────────────────────────────────

    private _initMap(): void {
        const atlas = (window as AtlasAny).atlas;
        if (!atlas) return;

        const key = this._context.parameters.SubscriptionKey?.raw
            || "";
        const style = this._context.parameters.MapStyle?.raw || "night";

        this._map = new atlas.Map(this._mapDiv.id, {
            center: [27.952, -26.232],
            zoom: 11,
            minZoom: 8,
            maxZoom: 20,
            style,
            language: "en-US",
            authOptions: { authType: "subscriptionKey", subscriptionKey: key },
        });

        this._map.events.add("ready", () => {
            this._map.controls.add(
                [new atlas.control.ZoomControl(), new atlas.control.CompassControl(), new atlas.control.StyleControl()],
                { position: "top-right" }
            );

            this._map.setUserInteraction({
                scrollZoomInteraction: true,
                dragPanInteraction: true,
                dblClickZoomInteraction: true,
                touchInteraction: true,
            });

            this._datasource = new atlas.source.DataSource();
            this._map.sources.add(this._datasource);

            this._renderAll();
        });

        this._mapDiv.style.cssText = "width:100%;height:600px;";
    }

    // ─── Rendering ───────────────────────────────────────────────────────────

    private _buildRenderContext(): RenderContext {
        return {
            map: this._map,
            datasource: this._datasource,
            tooltip: this._tooltip,
            trackCoords: [],  // consumed by trackLayer directly via import
            addedLayerIds: this._addedLayerIds,
            addedSourceIds: this._addedSourceIds,
            onStationSelect: (name, status) => {
                this._selection = { stationName: name, assetId: "", assetType: "station", assetStatus: status };
                this._notifyOutputChanged();
            },
            onAssetSelect: (id, type, status) => {
                this._selection = { stationName: "", assetId: id, assetType: type, assetStatus: status };
                this._notifyOutputChanged();
            },
            onAlertSelect: (alertName, alertId, severity) => {
                this._selection = { stationName: alertName, assetId: alertId, assetType: "alert", assetStatus: severity };
                this._notifyOutputChanged();
            },
        };
    }

    private _renderAll(): void {
        const params = this._context.parameters;
        const stations = parseJSON(params.StationsJSON?.raw, DEFAULT_STATIONS);
        const assets = parseJSON(params.AssetsJSON?.raw, DEFAULT_ASSETS);
        const alerts = normaliseAlerts(params.AlertsJSON?.raw, stations);
        const ctx = this._buildRenderContext();

        renderTrack(ctx);
        renderStations(stations, ctx);
        renderAssets(assets, ctx);
        renderAlerts(alerts, ctx);
        renderAlertStations(alerts, stations, ctx);
    }

    /**
     * Removes every layer/source recorded during the last render pass, then
     * clears the shared datasource. Must run before _renderAll() on any
     * re-render — otherwise Azure Maps throws on fixed-ID layers/sources that
     * already exist (track-glow, stations-regular, alert-station-source, ...)
     * and per-alert sources (alert-src-<id>, alert-pt-<id>) pile up unused on
     * every data refresh.
     */
    private _clearRendered(): void {
        this._addedLayerIds.forEach((id) => {
            const layer = this._map.layers.getLayerById(id);
            if (layer) this._map.layers.remove(layer);
        });
        this._addedSourceIds.forEach((id) => {
            const src = this._map.sources.getById(id);
            if (src) this._map.sources.remove(src);
        });
        this._addedLayerIds = [];
        this._addedSourceIds = [];
        this._datasource.clear();
    }

    // ─── Camera ───────────────────────────────────────────────────────────────

    private _focusOnStation(stationName: string): void {
        if (!stationName || !this._map) return;
        const stations = parseJSON(this._context.parameters.StationsJSON?.raw, DEFAULT_STATIONS);
        const match = stations.find((s) => s.name.toLowerCase() === stationName.toLowerCase());
        if (!match) return;
        this._map.setCamera({ center: [match.lon, match.lat], zoom: 15, type: "fly", duration: 1200 });
    }
}
