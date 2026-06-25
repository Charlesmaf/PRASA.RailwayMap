/**
 * MapLegend — collapsible overlay panel explaining every visual element
 * on the PRASA Railway Map. Asset type icons match the dot symbols on the map.
 * Status colours apply across all asset types.
 */
export class MapLegend {
    private readonly _panel: HTMLDivElement;
    private readonly _toggle: HTMLButtonElement;
    private _expanded = true;

    constructor(container: HTMLDivElement) {
        // ── Toggle button ──────────────────────────────────────────────────
        this._toggle = document.createElement("button");
        this._toggle.title = "Toggle legend";
        this._toggle.style.cssText = `
            position:absolute; bottom:24px; left:12px; z-index:1100;
            background:#161b22; color:#e6edf3;
            border:1px solid #30363d; border-radius:6px;
            padding:5px 10px; font-size:10.5px;
            font-family:'Segoe UI',system-ui,sans-serif; font-weight:600;
            cursor:pointer; letter-spacing:0.04em;
            display:flex; align-items:center; gap:5px;
            transition:background 0.15s;
        `;
        this._toggle.innerHTML = `
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <rect x="1" y="5.5" width="11" height="1.5" rx="0.75" fill="#1f6feb"/>
                <rect x="1" y="2"   width="11" height="1.5" rx="0.75" fill="#e3b341"/>
                <rect x="1" y="9"   width="11" height="1.5" rx="0.75" fill="#f85149"/>
            </svg>
            Legend`;
        this._toggle.addEventListener("mouseover", () => { this._toggle.style.background = "#21262d"; });
        this._toggle.addEventListener("mouseout", () => { this._toggle.style.background = "#161b22"; });
        this._toggle.addEventListener("click", () => this._toggleExpanded());
        container.appendChild(this._toggle);

        // ── Panel ──────────────────────────────────────────────────────────
        this._panel = document.createElement("div");
        this._panel.style.cssText = `
            position:absolute; bottom:56px; left:12px; z-index:1100;
            background:rgba(13,17,23,0.95); border:1px solid #30363d;
            border-radius:10px; padding:12px 14px;
            font-family:'Segoe UI',system-ui,sans-serif; font-size:10.5px;
            color:#e6edf3; width:210px;
            backdrop-filter:blur(8px);
            box-shadow:0 8px 24px rgba(0,0,0,0.55);
            display:none;
            max-height:420px;
            overflow-y:auto;
            scrollbar-width:thin;
            scrollbar-color:#30363d transparent;
        `;
        this._panel.innerHTML = this._buildHTML();
        container.appendChild(this._panel);
    }

    // ── SVG helpers ────────────────────────────────────────────────────────

    private _dot(fill: string, stroke = "#0d1117", r = 6): string {
        const s = 14;
        return `<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
            <circle cx="${s / 2}" cy="${s / 2}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>
        </svg>`;
    }

    private _solidLine(color: string, w = 2): string {
        return `<svg width="36" height="10" viewBox="0 0 36 10">
            <line x1="0" y1="5" x2="36" y2="5" stroke="${color}" stroke-width="${w}" stroke-linecap="round"/>
        </svg>`;
    }

    private _dashedLine(color: string): string {
        return `<svg width="36" height="10" viewBox="0 0 36 10">
            <line x1="0" y1="5" x2="36" y2="5" stroke="${color}" stroke-width="2"
                stroke-dasharray="6 3" stroke-linecap="round"/>
        </svg>`;
    }

    private _ring(color: string): string {
        return `<svg width="16" height="16" viewBox="0 0 16 16">
            <circle cx="8" cy="8" r="5.5" fill="none" stroke="${color}" stroke-width="2.5"/>
        </svg>`;
    }

    // ── Asset type icons (small SVG matching map appearance) ───────────────

    private _iconSignal(): string {
        // Traffic signal head with three lights
        return `<svg width="16" height="20" viewBox="0 0 16 20">
            <rect x="3" y="1" width="10" height="18" rx="3" fill="#21262d" stroke="#3fb950" stroke-width="1.2"/>
            <circle cx="8" cy="5"  r="2.2" fill="#f85149"/>
            <circle cx="8" cy="10" r="2.2" fill="#e3b341"/>
            <circle cx="8" cy="15" r="2.2" fill="#3fb950"/>
        </svg>`;
    }

    private _iconCrossing(): string {
        // Level crossing barriers
        return `<svg width="20" height="16" viewBox="0 0 20 16">
            <line x1="0"  y1="8" x2="8"  y2="8" stroke="#e3b341" stroke-width="3" stroke-linecap="round"/>
            <line x1="12" y1="8" x2="20" y2="8" stroke="#e3b341" stroke-width="3" stroke-linecap="round"/>
            <rect x="8.5" y="2" width="3" height="12" rx="1.5" fill="#8b949e"/>
            <line x1="0" y1="8" x2="20" y2="8" stroke="#f85149" stroke-width="1" stroke-dasharray="3 3"/>
        </svg>`;
    }

    private _iconTrack(): string {
        // Two rails with sleepers
        return `<svg width="24" height="14" viewBox="0 0 24 14">
            <line x1="2" y1="2"  x2="22" y2="2"  stroke="#8b949e" stroke-width="2" stroke-linecap="round"/>
            <line x1="2" y1="12" x2="22" y2="12" stroke="#8b949e" stroke-width="2" stroke-linecap="round"/>
            <line x1="5"  y1="0" x2="5"  y2="14" stroke="#6e7681" stroke-width="1.5"/>
            <line x1="12" y1="0" x2="12" y2="14" stroke="#6e7681" stroke-width="1.5"/>
            <line x1="19" y1="0" x2="19" y2="14" stroke="#6e7681" stroke-width="1.5"/>
        </svg>`;
    }

    private _iconPower(): string {
        // Lightning bolt
        return `<svg width="14" height="20" viewBox="0 0 14 20">
            <polygon points="8,1 1,11 7,11 6,19 13,8 7,8" fill="#e3b341" stroke="#b88a00" stroke-width="0.8"/>
        </svg>`;
    }

    private _iconStructure(): string {
        // Bridge arch
        return `<svg width="24" height="16" viewBox="0 0 24 16">
            <path d="M0,14 Q12,0 24,14" fill="none" stroke="#8b949e" stroke-width="2"/>
            <line x1="0"  y1="14" x2="24" y2="14" stroke="#8b949e" stroke-width="2"/>
            <line x1="5"  y1="7"  x2="5"  y2="14" stroke="#6e7681" stroke-width="1.5"/>
            <line x1="12" y1="3"  x2="12" y2="14" stroke="#6e7681" stroke-width="1.5"/>
            <line x1="19" y1="7"  x2="19" y2="14" stroke="#6e7681" stroke-width="1.5"/>
        </svg>`;
    }

    private _iconTelecoms(): string {
        // Antenna with signal arcs
        return `<svg width="20" height="20" viewBox="0 0 20 20">
            <line x1="10" y1="10" x2="10" y2="19" stroke="#58a6ff" stroke-width="1.5"/>
            <line x1="6"  y1="19" x2="14" y2="19" stroke="#58a6ff" stroke-width="1.5"/>
            <path d="M5,12 Q10,7 15,12" fill="none" stroke="#58a6ff" stroke-width="1.5"/>
            <path d="M2,9  Q10,2 18,9"  fill="none" stroke="#58a6ff" stroke-width="1.5" opacity="0.5"/>
            <circle cx="10" cy="10" r="1.5" fill="#58a6ff"/>
        </svg>`;
    }

    private _iconBuilding(): string {
        // Simple building
        return `<svg width="18" height="20" viewBox="0 0 18 20">
            <rect x="2" y="6"  width="14" height="13" fill="#21262d" stroke="#8b949e" stroke-width="1.2"/>
            <polygon points="1,7 9,1 17,7" fill="#21262d" stroke="#8b949e" stroke-width="1.2"/>
            <rect x="5"  y="10" width="3" height="3" fill="#8b949e"/>
            <rect x="10" y="10" width="3" height="3" fill="#8b949e"/>
            <rect x="7"  y="14" width="4" height="5" fill="#8b949e"/>
        </svg>`;
    }

    private _iconOther(): string {
        return `<svg width="14" height="14" viewBox="0 0 14 14">
            <circle cx="7" cy="7" r="5.5" fill="#30363d" stroke="#6e7681" stroke-width="1.5"/>
            <text x="7" y="11" text-anchor="middle" font-size="8" font-family="Arial" fill="#8b949e">?</text>
        </svg>`;
    }

    // ── Section / row builders ─────────────────────────────────────────────

    private _section(title: string, items: string): string {
        return `
        <div style="margin-bottom:9px;">
            <div style="
                font-size:9px; font-weight:700; letter-spacing:0.09em;
                color:#8b949e; text-transform:uppercase;
                margin-bottom:7px; padding-bottom:4px;
                border-bottom:1px solid #21262d;
            ">${title}</div>
            ${items}
        </div>`;
    }

    private _row(icon: string, label: string, sub = ""): string {
        return `
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
            <div style="width:36px;flex-shrink:0;display:flex;align-items:center;justify-content:center;">
                ${icon}
            </div>
            <div>
                <div style="color:#c9d1d9;line-height:1.2;">${label}</div>
                ${sub ? `<div style="color:#8b949e;font-size:10px;line-height:1.3;">${sub}</div>` : ""}
            </div>
        </div>`;
    }

    private _buildHTML(): string {
        return `
        <!-- Header -->
        <div style="font-size:12px;font-weight:700;color:#e6edf3;
                    margin-bottom:9px;display:flex;align-items:center;gap:6px;
                    padding-bottom:8px;border-bottom:1px solid #30363d;">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="1" width="12" height="12" rx="2" stroke="#1f6feb" stroke-width="1.5"/>
                <line x1="4" y1="5"   x2="10" y2="5"   stroke="#1f6feb" stroke-width="1.5"/>
                <line x1="4" y1="7.5" x2="10" y2="7.5" stroke="#8b949e" stroke-width="1.5"/>
                <line x1="4" y1="10"  x2="8"  y2="10"  stroke="#8b949e" stroke-width="1.5"/>
            </svg>
            Map Legend
        </div>

        ${this._section("Rail Network", `
            ${this._row(
            `<svg width="36" height="10" viewBox="0 0 36 10">
                    <line x1="0" y1="5" x2="36" y2="5" stroke="#1f6feb" stroke-width="1.2" stroke-linecap="round"/>
                    <line x1="0" y1="5" x2="36" y2="5" stroke="#fff" stroke-width="5"
                        stroke-dasharray="0.5 7" stroke-linecap="round" opacity="0.8"/>
                </svg>`,
            "PRASA rail network", "National passenger lines"
        )}
            ${this._row(
            `<svg width="36" height="10" viewBox="0 0 36 10">
                    <line x1="0" y1="5" x2="36" y2="5" stroke="#1f6feb" stroke-width="4" stroke-linecap="round"/>
                </svg>`,
            "Active corridor", "Selected service line"
        )}
        `)}

        ${this._section("Asset Types", `
            ${this._row(this._iconSignal(), "Signal",
            "Traffic signals, axle counters, interlocking")}
            ${this._row(this._iconCrossing(), "Level Crossing",
                "Road–rail intersections")}
            ${this._row(this._iconTrack(), "Track",
                    "Rail, switches, block joints, S&C")}
            ${this._row(this._iconPower(), "Power / OHTE",
                        "Substations, catenary, traction power")}
            ${this._row(this._iconStructure(), "Structure",
                            "Bridges, culverts, cuttings, subways")}
            ${this._row(this._iconTelecoms(), "Telecoms",
                                "Telecom sites, cables, networks")}
            ${this._row(this._iconBuilding(), "Building",
                                    "Equipment rooms, depots, offices")}
            ${this._row(this._iconOther(), "Other",
                                        "Unclassified assets")}
        `)}

        ${this._section("Asset Status", `
            ${this._row(this._dot("#3fb950"), "Operational")}
            ${this._row(this._dot("#e3b341"), "Restricted")}
            ${this._row(this._dot("#e3b341"), "Under Maintenance")}
            ${this._row(this._dot("#f85149"), "Decommissioned / Non-operational")}
            ${this._row(this._dot("#1f6feb"), "Planned Forward")}
            ${this._row(this._dot("#8b949e"), "Unknown")}
        `)}

        ${this._section("Alerts", `
            ${this._row(this._dashedLine("#e3b341"),
                                            "Amber alert", "Speed restriction / inspection")}
            ${this._row(this._solidLine("#f85149"),
                                                "Red alert", "Line suspended / failure")}
            ${this._row(
                                                    `<div style="display:flex;gap:3px;align-items:center;">
                    <svg width="20" height="20" viewBox="0 0 20 20">
                        <circle cx="10" cy="10" r="9" fill="#e3b341" stroke="#fff" stroke-width="1.5"/>
                        <text x="10" y="14" text-anchor="middle" font-size="10"
                            font-weight="bold" font-family="Arial" fill="#000">A</text>
                    </svg>
                    <svg width="20" height="20" viewBox="0 0 20 20">
                        <circle cx="10" cy="10" r="9" fill="#f85149" stroke="#fff" stroke-width="1.5"/>
                        <text x="10" y="14" text-anchor="middle" font-size="10"
                            font-weight="bold" font-family="Arial" fill="#fff">R</text>
                    </svg>
                </div>`,
                                                    "Alert badge", "Mid-section identifier"
                                                )}
            ${this._row(
                                                    `<div style="display:flex;gap:3px;">${this._ring("#e3b341")}${this._ring("#f85149")}</div>`,
                                                    "Affected station", "Ring colour = alert severity"
                                                )}
        `)}

        ${this._section("Stations", `
            ${this._row(
                                                    `<svg width="24" height="24" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="11" fill="#1f6feb" stroke="#fff" stroke-width="1.5"/>
                    <rect x="7" y="8" width="10" height="7" rx="1.5" fill="#fff"/>
                    <rect x="8.5" y="6" width="7" height="3" rx="1" fill="#fff"/>
                    <rect x="7.5" y="9.5" width="3" height="2" rx="0.5" fill="#1f6feb"/>
                    <rect x="13.5" y="9.5" width="3" height="2" rx="0.5" fill="#1f6feb"/>
                    <circle cx="10" cy="16" r="1.5" fill="#fff" stroke="#1f6feb" stroke-width="0.75"/>
                    <circle cx="14" cy="16" r="1.5" fill="#fff" stroke="#1f6feb" stroke-width="0.75"/>
                </svg>`,
                                                    "Station", "Intermediate stop"
                                                )}
            ${this._row(
                                                    `<svg width="28" height="28" viewBox="0 0 28 28">
                    <circle cx="14" cy="14" r="13" fill="#f85149" stroke="#fff" stroke-width="1.5"/>
                    <rect x="7" y="9" width="14" height="9" rx="1.5" fill="#fff"/>
                    <rect x="9" y="6" width="10" height="4" rx="1.5" fill="#fff"/>
                    <rect x="8" y="11" width="4" height="3" rx="0.5" fill="#f85149"/>
                    <rect x="16" y="11" width="4" height="3" rx="0.5" fill="#f85149"/>
                    <circle cx="11" cy="19" r="2" fill="#fff" stroke="#f85149" stroke-width="1"/>
                    <circle cx="17" cy="19" r="2" fill="#fff" stroke="#f85149" stroke-width="1"/>
                </svg>`,
                                                    "Terminus", "Start / end of service line"
                                                )}
        `)}`;
    }

    private _toggleExpanded(): void {
        this._expanded = !this._expanded;
        this._panel.style.display = this._expanded ? "block" : "none";
        this._toggle.title = this._expanded ? "Hide legend" : "Show legend";
    }

    public show(): void {
        this._expanded = true;
        this._panel.style.display = "block";
    }

    public hide(): void {
        this._expanded = false;
        this._panel.style.display = "none";
    }

    public destroy(): void {
        this._panel.remove();
        this._toggle.remove();
    }
}