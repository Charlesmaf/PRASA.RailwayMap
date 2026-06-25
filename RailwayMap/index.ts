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
import { renderNationalRail, renderRegionCorridors, getCamera } from "./src/layers/nationalRailLayer";
import { findCorridor } from "./src/constants/corridorRegistry";
import { MapLegend } from "./src/ui/Legend";

export class RailwayMap
    implements ComponentFramework.StandardControl<IInputs, IOutputs> {

    private _container!: HTMLDivElement;
    private _mapDiv!: HTMLDivElement;
    private _tooltip!: Tooltip;
    private _legend!: MapLegend;
    private _context!: ComponentFramework.Context<IInputs>;
    private _notifyOutputChanged!: () => void;

    private _selection: SelectionState = { stationName: "", assetId: "", assetType: "", assetStatus: "" };
    private _lastFocusStation = "";
    private _lastFocusSection = "";

    private _map: AtlasAny = null;
    private _datasource: AtlasAny = null;
    private _atlasLoaded = false;

    private _addedLayerIds: string[] = [];
    private _addedSourceIds: string[] = [];

    // ─── Change-detection snapshots ───────────────────────────────────────────
    private _lastAlertsJSON = "";
    private _lastStationsJSON = "";
    private _lastAssetsJSON = "";
    private _lastRegion = "";
    private _lastServiceLine = "";

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
        this._legend = new MapLegend(this._container);
        this._loadAtlasSDK();
    }

    public updateView(context: ComponentFramework.Context<IInputs>): void {
        this._context = context;
        if (!this._atlasLoaded || !this._map) return;

        const cur = context.parameters;

        const curAlerts = cur.AlertsJSON?.raw ?? "";
        const curStations = cur.StationsJSON?.raw ?? "";
        const curAssets = cur.AssetsJSON?.raw ?? "";
        const curRegion = cur.SelectedRegion?.raw ?? "All";
        const curServiceLine = cur.SelectedServiceLine?.raw ?? "All";

        // Compute filterChanged BEFORE updating snapshots — if computed after,
        // values are already equal and the camera never moves on filter change.
        const filterChanged =
            curRegion !== this._lastRegion ||
            curServiceLine !== this._lastServiceLine;

        const dataChanged =
            curAlerts !== this._lastAlertsJSON ||
            curStations !== this._lastStationsJSON ||
            curAssets !== this._lastAssetsJSON ||
            filterChanged;

        if (dataChanged && this._datasource) {
            this._lastAlertsJSON = curAlerts;
            this._lastStationsJSON = curStations;
            this._lastAssetsJSON = curAssets;
            this._lastRegion = curRegion;
            this._lastServiceLine = curServiceLine;
            this._clearRendered();
            this._renderAll(filterChanged);
        }

        // ── FocusStation — existing station zoom ──────────────────────────────
        const focus = cur.FocusStation?.raw || "";
        if (focus && focus !== this._lastFocusStation) {
            this._lastFocusStation = focus;
            this._focusOnStation(focus);
        }

        // ── FocusSection — zoom to a section's track stretch ─────────────────
        // Value format: "FromStationName|ToStationName" e.g. "Mzimhlope|New Canada"
        const focusSection = cur.FocusSection?.raw || "";
        if (focusSection !== this._lastFocusSection) {
            this._lastFocusSection = focusSection;
            if (focusSection) {
                const [from, to] = focusSection.split("|");
                this._focusOnSection(from?.trim(), to?.trim(), curServiceLine);
            }
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
        this._legend?.destroy();
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

        const key = this._context.parameters.SubscriptionKey?.raw || "";
        const style = this._context.parameters.MapStyle?.raw || "night";

        this._map = new atlas.Map(this._mapDiv.id, {
            center: [24.5, -28.5],   // true centre of South Africa
            zoom: 5,
            minZoom: 4,
            maxZoom: 20,
            style,
            language: "en-US",
            authOptions: { authType: "subscriptionKey", subscriptionKey: key },
        });

        this._map.events.add("ready", () => {
            this._map.controls.add(
                [new atlas.control.ZoomControl(),
                new atlas.control.CompassControl(),
                new atlas.control.StyleControl()],
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

            this._renderAll(true);
            this._legend.show();
        });

        this._mapDiv.style.cssText = "width:100%;height:100%;";
    }

    // ─── Rendering ───────────────────────────────────────────────────────────

    private _buildRenderContext(): RenderContext {
        return {
            map: this._map,
            datasource: this._datasource,
            tooltip: this._tooltip,
            trackCoords: [],
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

    private _renderAll(cameraChanged = false): void {
        const params = this._context.parameters;
        const region = params.SelectedRegion?.raw || "All";
        const serviceLine = params.SelectedServiceLine?.raw || "All";

        const stations = parseJSON(params.StationsJSON?.raw, DEFAULT_STATIONS);
        const assets = parseJSON(params.AssetsJSON?.raw, DEFAULT_ASSETS);
        const alerts = normaliseAlerts(params.AlertsJSON?.raw, stations);
        const ctx = this._buildRenderContext();

        // Layer 1 — full PRASA national network in PRASA blue, always visible
        renderNationalRail(ctx);

        if (serviceLine && serviceLine !== "All") {
            // Layer 2a — specific corridor: full track, stations, assets, alerts
            renderTrack(ctx, serviceLine);
            renderStations(stations, ctx);
            renderAssets(assets, ctx);
            renderAlerts(alerts, ctx);
            renderAlertStations(alerts, stations, ctx);
        } else if (region && region !== "All") {
            // Layer 2b — region/sub-region: highlight matching corridors thicker
            renderRegionCorridors(region, ctx);
        }
        // "All" + "All": only the PRASA national network shows

        // Camera — only fly when the filter selection changed, not on timer ticks
        if (cameraChanged) {
            const camera = getCamera(region, serviceLine);
            this._map.setCamera({ ...camera, type: "fly", duration: 1000 });
        }
    }

    private _clearRendered(): void {
        this._addedLayerIds.forEach(id => {
            const layer = this._map.layers.getLayerById(id);
            if (layer) this._map.layers.remove(layer);
        });
        this._addedSourceIds.forEach(id => {
            const src = this._map.sources.getById(id);
            if (src) this._map.sources.remove(src);
        });
        this._addedLayerIds = [];
        this._addedSourceIds = [];
        this._datasource.clear();
    }

    // ─── Camera helpers ───────────────────────────────────────────────────────

    private _focusOnStation(stationName: string): void {
        if (!stationName || !this._map) return;
        const stations = parseJSON(this._context.parameters.StationsJSON?.raw, DEFAULT_STATIONS);
        const match = stations.find(s => s.name.toLowerCase() === stationName.toLowerCase());
        if (!match) return;
        this._map.setCamera({ center: [match.lon, match.lat], zoom: 15, type: "fly", duration: 1200 });
    }

    /**
     * Zooms to the stretch of track between two stations within the currently
     * selected service line. Uses the corridor's own track coordinates so it
     * works for all four corridors, not just Naledi-Johannesburg.
     *
     * fromStation / toStation come from FocusSection split on "|".
     * serviceLine is the currently selected corridor name.
     */
    private _focusOnSection(fromStation: string, toStation: string, serviceLine: string): void {
        if (!fromStation || !toStation || !this._map) return;

        // Get the track coords for the active corridor
        const corridor = findCorridor(serviceLine);
        const trackCoords = corridor?.coords ?? [];
        if (trackCoords.length === 0) return;

        // Find nearest track point to each station
        const stations = parseJSON(this._context.parameters.StationsJSON?.raw, DEFAULT_STATIONS);
        const find = (name: string) =>
            stations.find(s => s.name.toLowerCase() === name.toLowerCase());

        const fromSt = find(fromStation);
        const toSt = find(toStation);
        if (!fromSt || !toSt) return;

        const nearestIdx = (lon: number, lat: number): number => {
            let best = 0, bestDist = Infinity;
            trackCoords.forEach(([tlon, tlat], i) => {
                const d = (tlon - lon) ** 2 + (tlat - lat) ** 2;
                if (d < bestDist) { bestDist = d; best = i; }
            });
            return best;
        };

        const i1 = nearestIdx(fromSt.lon, fromSt.lat);
        const i2 = nearestIdx(toSt.lon, toSt.lat);
        const lo = Math.min(i1, i2);
        const hi = Math.max(i1, i2);

        const slice = trackCoords.slice(lo, hi + 1);
        if (slice.length === 0) return;

        // Compute bounding box of the slice then fit the camera to it
        const lons = slice.map(c => c[0]);
        const lats = slice.map(c => c[1]);
        const minLon = Math.min(...lons), maxLon = Math.max(...lons);
        const minLat = Math.min(...lats), maxLat = Math.max(...lats);

        // Pad the bbox slightly so stations aren't clipped at the edge
        const pad = 0.005;
        this._map.setCamera({
            bounds: [minLon - pad, minLat - pad, maxLon + pad, maxLat + pad],
            padding: 60,
            type: "fly",
            duration: 1000,
        });
    }
}