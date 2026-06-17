import { AtlasAny, Alert, Station, RenderContext } from "../types";
import { parseJSON, sliceTrackBetween } from "../utils";
import { DEFAULT_ALERTS } from "../constants/defaults";

export function normaliseAlerts(
    raw: string | null | undefined,
    stations: Station[]
): Alert[] {
    const parsed = parseJSON<AtlasAny>(raw, DEFAULT_ALERTS);

    return parsed.map((a: AtlasAny) => {
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
            severity: (a.severity || a.Severity || "amber").toLowerCase() as "amber" | "red",
            description: a.description || a.Description || "",
            reportedAt: a.reportedAt || a.ReportedAt || "",
            coords: coords || [],
        } satisfies Alert;
    });
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
            { alertId: alert.id, alertName: alert.name, severity: alert.severity, description: alert.description, reportedAt: alert.reportedAt }
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

        // Badge at midpoint
        const midCoord = alert.coords[Math.floor(alert.coords.length / 2)];
        const pointSrc = new atlas.source.DataSource(`alert-pt-${alert.id}`);
        map.sources.add(pointSrc);
        addedSourceIds.push(`alert-pt-${alert.id}`);

        pointSrc.add(new atlas.data.Feature(
            new atlas.data.Point(midCoord),
            { alertId: alert.id, alertName: alert.name, severity: alert.severity, description: alert.description, reportedAt: alert.reportedAt, layerType: "alert" }
        ));

        const label = isRed ? "R" : "A";
        const fillCol = isRed ? "%23f85149" : "%23e3b341";
        const txtCol = isRed ? "%23ffffff" : "%23000000";
        const badgeSVG = `data:image/svg+xml;charset=utf-8,`
            + `<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'>`
            + `<circle cx='16' cy='16' r='15' fill='${fillCol}' stroke='%23ffffff' stroke-width='2.5'/>`
            + `<text x='16' y='21' text-anchor='middle' font-size='15' font-weight='bold' font-family='Arial' fill='${txtCol}'>${label}</text>`
            + `</svg>`;

        const spriteKey = `alert-badge-sprite-${alert.id}`;
        const badgeImg = new Image(32, 32);

        badgeImg.onload = () => {
            // Same alert ID re-rendering means the same sprite key — swallow the
            // duplicate-add error instead of letting it abort the badge layer.
            try { map.imageSprite.add(spriteKey, badgeImg); } catch { /* already added */ }

            map.layers.add(new atlas.layer.SymbolLayer(pointSrc, `alert-badge-${alert.id}`, {
                iconOptions: { image: spriteKey, size: 1.1, anchor: "center", allowOverlap: true },
                textOptions: { textField: alert.name, color, haloColor: "#0d1117", haloWidth: 2, size: 11, offset: [0, -2.5], allowOverlap: true },
            }));
            addedLayerIds.push(`alert-badge-${alert.id}`);

            const badgeLayer = map.layers.getLayerById(`alert-badge-${alert.id}`);

            map.events.add("click", badgeLayer, (e: AtlasAny) => {
                if (!e.shapes?.length) return;
                const props = e.shapes[0].getProperties();
                onAlertSelect(props.alertName || "", props.alertId || "", props.severity || "");
            });

            map.events.add("mouseover", badgeLayer, () => {
                map.getCanvasContainer().style.cursor = "pointer";
            });
            map.events.add("mouseout", badgeLayer, () => {
                map.getCanvasContainer().style.cursor = "";
            });
        };

        badgeImg.src = badgeSVG;
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
        radius: 14, color: "rgba(0,0,0,0)", strokeColor: "#e3b341", strokeWidth: 3, strokeOpacity: 0.9,
    }));
    addedLayerIds.push("alert-stations-amber");

    map.layers.add(new atlas.layer.BubbleLayer(alertStationSource, "alert-stations-red", {
        filter: ["==", ["get", "severity"], "red"],
        radius: 14, color: "rgba(0,0,0,0)", strokeColor: "#f85149", strokeWidth: 3, strokeOpacity: 0.9,
    }));
    addedLayerIds.push("alert-stations-red");
}
