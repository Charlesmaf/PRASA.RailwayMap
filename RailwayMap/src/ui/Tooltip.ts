import type { AtlasAny } from "../types";
import { formatStatus } from "../utils";

export class Tooltip {
    private readonly _el: HTMLDivElement;

    constructor(container: HTMLDivElement) {
        this._el = document.createElement("div");
        this._el.style.cssText = `
            position:absolute;
            pointer-events:none;
            background:#ffffff;
            color:#1a1a1a;
            border-radius:8px;
            padding:12px 16px;
            font-size:12px;
            line-height:1.7;
            box-shadow:0 4px 16px rgba(0,0,0,0.25);
            display:none;
            z-index:1000;
            min-width:200px;
            font-family:'Segoe UI',system-ui,sans-serif;
        `;
        container.appendChild(this._el);
    }

    get element(): HTMLDivElement { return this._el; }

    show(props: Record<string, AtlasAny>, pixel: number[]): void {
        const rows: string[] = [];

        const addRow = (label: string, value: AtlasAny) => {
            if (value === undefined || value === null || value === "") return;
            rows.push(
                `<div style="display:flex;justify-content:space-between;gap:16px;">
                    <span style="color:#6b7280;">${label}</span>
                    <span style="font-weight:600;text-align:right;">${value}</span>
                </div>`
            );
        };

        const title = props["name"] || props["alertName"] || "Details";

        addRow("Latitude", props["lat"] !== undefined ? props["lat"] : undefined);
        addRow("Longitude", props["lon"] !== undefined ? props["lon"] : undefined);
        addRow("Category", props["stationCategory"]);
        addRow("Section Length", props["sectionLength"] !== "" ? props["sectionLength"] + " km" : "");
        addRow("Passenger Volume (2024/2025)", props["passengerVolume"] !== "" ? Number(props["passengerVolume"]).toLocaleString() : "");
        addRow("Type", props["assetType"]);
        addRow("Asset ID", props["assetId"]);
        addRow("Severity", props["severity"]);
        addRow("Details", props["detail"] || props["description"]);
        addRow("Number of Lines", props["numberOfLines"]);
        addRow("Region", props["region"]);
        addRow("Station Status", formatStatus(props["status"]));

        this._el.innerHTML =
            `<div style="font-weight:700;font-size:14px;margin-bottom:8px;border-bottom:1px solid #e5e7eb;padding-bottom:6px;">${title}</div>`
            + rows.join("");

        this._el.style.left = (pixel[0] + 15) + "px";
        this._el.style.top = (pixel[1] + 15) + "px";
        this._el.style.display = "block";
    }

    moveTo(pixel: number[]): void {
        this._el.style.left = (pixel[0] + 15) + "px";
        this._el.style.top = (pixel[1] + 15) + "px";
    }

    hide(): void {
        this._el.style.display = "none";
    }
}
