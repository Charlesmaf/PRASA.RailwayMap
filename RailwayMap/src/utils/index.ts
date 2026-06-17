import { Station } from "../types";
import { TRACK_COORDS } from "../constants/trackCoords";
import { DEFAULT_STATIONS } from "../constants/defaults";

export function parseJSON<T>(raw: string | null | undefined, fallback: T[]): T[] {
    if (!raw) return fallback;
    try { return JSON.parse(raw) as T[]; }
    catch { return fallback; }
}

export function statusColor(status: string): string {
    switch ((status || "").toLowerCase()) {
        case "operational": return "#3fb950";
        case "restricted": return "#d29922";
        case "under maintenance": return "#d29922";
        case "decommissioned/nonoperational": return "#f85149";
        case "planned forward": return "#1f6feb";
        default: return "#8b949e";
    }
}

export function formatStatus(status: string): string {
    if (!status) return "";
    const color = statusColor(status);
    const labels: Record<string, string> = {
        "operational": "Operational",
        "restricted": "Restricted",
        "under maintenance": "Under Maintenance",
        "decommissioned/nonoperational": "Decommissioned / Nonoperational",
        "planned forward": "Planned Forward",
    };
    const label = labels[status.toLowerCase()] ?? (status.charAt(0).toUpperCase() + status.slice(1));
    return `<span style="color:${color};font-weight:600;">${label}</span>`;
}

export function sliceTrackBetween(
    fromStation: string,
    toStation: string,
    stations: Station[]
): number[][] {
    const find = (name: string) =>
        stations.find((s) => s.name.toLowerCase() === name.toLowerCase());

    const from = find(fromStation);
    const to = find(toStation);
    if (!from || !to) return [];

    const nearestIndex = (lon: number, lat: number): number => {
        let best = 0, bestDist = Infinity;
        for (let i = 0; i < TRACK_COORDS.length; i++) {
            const [tlon, tlat] = TRACK_COORDS[i];
            const d = (tlon - lon) ** 2 + (tlat - lat) ** 2;
            if (d < bestDist) { bestDist = d; best = i; }
        }
        return best;
    };

    const i1 = nearestIndex(from.lon, from.lat);
    const i2 = nearestIndex(to.lon, to.lat);
    return TRACK_COORDS.slice(Math.min(i1, i2), Math.max(i1, i2) + 1);
}

export function getDefaultStations(): Station[] {
    return DEFAULT_STATIONS;
}
