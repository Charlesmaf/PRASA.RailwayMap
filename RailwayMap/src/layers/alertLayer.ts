import { AtlasAny, Alert, Station, RenderContext } from "../types";
import { parseJSON, sliceTrackBetween } from "../utils";

export function normaliseAlerts(
    raw: string | null | undefined,
    stations: Station[]
): Alert[] {
    const parsed = parseJSON<AtlasAny>(raw, []);

    return parsed
        .map((a: AtlasAny): Alert | null => {
            const severity = (a.severity || a.Severity || "").toLowerCase();
            if (severity !== "amber" && severity !== "red") return null;

            let coords = a.coords;

            if (!coords && a.CoordinatesJSON) {
                try { coords = JSON.parse(a.CoordinatesJSON); } catch { coords = []; }
            }
            if (typeof coords === "string") {
                try { coords = JSON.parse(coords); } catch { coords = []; }
            }

            const fromStation: string = a.fromStation || a.FromStationName || "";
            const toStation: string = a.toStation || a.ToStationName || "";

            if (!coords || coords.length === 0) {
                coords = sliceTrackBetween(fromStation, toStation, stations);
            }

            return {
                id: a.id || a.AlertId || "",
                name: a.name || a.Name || "",
                fromStation,
                toStation,
                severity: severity as "amber" | "red",
                description: a.description || a.Description || "",
                reportedAt: a.reportedAt || a.ReportedAt || "",
                coords: coords || [],
            };
        })
        .filter((a): a is Alert => a !== null);
}

export function renderAlerts(alerts: Alert[], ctx: RenderContext): void {
    const atlas = (window as AtlasAny).atlas;
    const { map, onAlertSelect, addedLayerIds, addedSourceIds } = ctx;

    alerts.forEach((alert) => {
        const isRed = alert.severity === "red";
        const color = isRed ? "#f85149" : "#e3b341";
        const glowCol = isRed ? "#f85149" : "#d29922";

        const src = new atlas.source.DataSource(`alert-src-${alert.id}`);
        map.sources.add(src);
        addedSourceIds.push(`alert-src-${alert.id}`);

        src.add(new atlas.data.Feature(
            new atlas.data.LineString(alert.coords),
            {
                alertId: alert.id,
                alertName: alert.name,
                severity: alert.severity,
                description: alert.description,
                reportedAt: alert.reportedAt,
            }
        ));

        map.layers.add(new atlas.layer.LineLayer(src, `alert-glow-${alert.id}`, {
            strokeColor: glowCol, strokeWidth: 22, strokeOpacity: 0.25,
        }));
        addedLayerIds.push(`alert-glow-${alert.id}`);

        map.layers.add(new atlas.layer.LineLayer(src, `alert-cover-${alert.id}`, {
            strokeColor: isRed ? "#1a0a0a" : "#1a1500", strokeWidth: 14, strokeOpacity: 1,
        }));
        addedLayerIds.push(`alert-cover-${alert.id}`);

        map.layers.add(new atlas.layer.LineLayer(src, `alert-line-${alert.id}`, {
            strokeColor: color,
            strokeWidth: isRed ? 5 : 4,
            strokeOpacity: 1,
            strokeDashArray: isRed ? [1, 0] : [6, 3],
        }));
        addedLayerIds.push(`alert-line-${alert.id}`);

        map.layers.add(new atlas.layer.LineLayer(src, `alert-ticks-${alert.id}`, {
            strokeColor: isRed ? "#ff9999" : "#ffe066",
            strokeWidth: 9,
            strokeOpacity: 0.7,
            strokeDashArray: [0.1, 2.8],
        }));
        addedLayerIds.push(`alert-ticks-${alert.id}`);

        // ── Click on the alert line itself ────────────────────────────────────
        const alertLineLayer = map.layers.getLayerById(`alert-line-${alert.id}`);
        map.events.add("click", alertLineLayer, (e: AtlasAny) => {
            if (!e.shapes?.length) return;
            const props = e.shapes[0].getProperties();
            onAlertSelect(props.alertName || "", props.alertId || "", props.severity || "");
        });
        map.events.add("mouseover", alertLineLayer, () => {
            map.getCanvasContainer().style.cursor = "pointer";
        });
        map.events.add("mouseout", alertLineLayer, () => {
            map.getCanvasContainer().style.cursor = "";
        });
    });
}

export function renderAlertStations(alerts: Alert[], stations: Station[], ctx: RenderContext): void {
    const atlas = (window as AtlasAny).atlas;
    const { map, addedLayerIds, addedSourceIds } = ctx;

    const amberStations: string[] = [];
    const redStations: string[] = [];

    alerts.forEach((alert) => {
        const list = alert.severity === "red" ? redStations : amberStations;
        list.push(alert.fromStation, alert.toStation);
    });

    const alertStationSource = new atlas.source.DataSource("alert-station-source");
    map.sources.add(alertStationSource);
    addedSourceIds.push("alert-station-source");

    stations.forEach((s) => {
        const isRed = redStations.includes(s.name);
        const isAmber = amberStations.includes(s.name);
        if (!isRed && !isAmber) return;

        alertStationSource.add(new atlas.data.Feature(
            new atlas.data.Point([s.lon, s.lat]),
            { name: s.name, severity: isRed ? "red" : "amber", layerType: "alert-station" }
        ));
    });

    map.layers.add(new atlas.layer.BubbleLayer(alertStationSource, "alert-stations-amber", {
        filter: ["==", ["get", "severity"], "amber"],
        radius: 14,
        color: "rgba(0,0,0,0)",
        strokeColor: "#e3b341",
        strokeWidth: 3,
        strokeOpacity: 0.9,
    }));
    addedLayerIds.push("alert-stations-amber");

    map.layers.add(new atlas.layer.BubbleLayer(alertStationSource, "alert-stations-red", {
        filter: ["==", ["get", "severity"], "red"],
        radius: 14,
        color: "rgba(0,0,0,0)",
        strokeColor: "#f85149",
        strokeWidth: 3,
        strokeOpacity: 0.9,
    }));
    addedLayerIds.push("alert-stations-red");
}