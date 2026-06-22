/**
 * Local dev test for normaliseAlerts.
 * Run from the RailwayMap root:
 *   npx ts-node test-alerts.ts
 *
 * Or if you don't have ts-node:
 *   npx tsx test-alerts.ts
 */

import { DEFAULT_STATIONS } from "./RailwayMap/src/constants/defaults";
import { normaliseAlerts } from "./RailwayMap/src/layers/alertLayer";


// ── Paste the raw JSON exactly as it arrives from the Power Apps connector ──
const RAW_JSON = JSON.stringify([
  {
    "coords": "[[27.877619,-26.230069],[27.876620,-26.231410],[27.875716,-26.232656],[27.874571,-26.234243],[27.873499,-26.235727],[27.872801,-26.236692],[27.872002,-26.237793],[27.870976,-26.239205],[27.869594,-26.241103],[27.868519,-26.242619],[27.867620,-26.243879],[27.864679,-26.247931],[27.863477,-26.249558]]",
    "description": "Speed restriction in effect — track inspection underway",
    "fromStation": "Inhlazane",
    "id": 1,
    "name": "Inhlazane → Ikwezi",
    "reportedAt": "2026-06-12T03:03:28.743Z",
    "severity": "amber",
    "toStation": "Ikwezi"
  },
  {
    "coords": "[[27.971425,-26.201623],[27.970456,-26.201055],[27.969765,-26.200649],[27.967523,-26.199342],[27.965005,-26.198566],[27.962382,-26.198470],[27.959106,-26.198512],[27.956750,-26.199049],[27.954540,-26.201326],[27.952472,-26.205545],[27.950150,-26.210299],[27.948430,-26.212709],[27.945410,-26.213579],[27.942547,-26.214420]]",
    "description": "Track failure detected — line suspended, engineers dispatched",
    "fromStation": "New Canada",
    "id": 2,
    "name": "New Canada → Croesus",
    "reportedAt": "2026-06-12T03:03:28.743Z",
    "severity": "red",
    "toStation": "Croesus"
  },
  {
    "coords": null,
    "description": "Overhead line fault",
    "fromStation": "Mzimhlope",
    "id": 4,
    "name": "Mzimhlope → New Canada",
    "reportedAt": "2026-06-14T19:25:42.407Z",
    "severity": "red",
    "toStation": "New Canada"
  },
  {
    "coords": null,
    "description": "Asset under restriction/maintenance — speed or access limited",
    "fromStation": "Phefeni",
    "id": 5,
    "name": "Phefeni → Phomolong",
    "reportedAt": "2026-06-19T02:13:26.130Z",
    "severity": "amber",
    "toStation": "Phomolong"
  }
]);

// ── Run normaliseAlerts with DEFAULT_STATIONS as the station lookup ──
// In production, these come from StationsJSON — swap in your live station
// array here if you want to test against real station data instead.
const result = normaliseAlerts(RAW_JSON, DEFAULT_STATIONS);

// ── Print a summary for each alert ──
result.forEach((alert, i) => {
  const coordCount = alert.coords?.length ?? 0;
  const source = coordCount === 0
    ? "❌ NO COORDS — sliceTrackBetween returned empty (station name mismatch?)"
    : coordCount < 5
      ? `⚠️  Only ${coordCount} points — sliceTrackBetween matched but slice is very short`
      : `✅ ${coordCount} coordinate points`;

  const coordSource = (() => {
    // Detect whether coords came from the raw JSON string or were sliced from track
    const raw = JSON.parse(RAW_JSON)[i];
    if (raw.coords && typeof raw.coords === "string") return "parsed from coords string in JSON";
    if (raw.coords && Array.isArray(raw.coords)) return "used array directly from JSON";
    return "sliced from TRACK_COORDS via sliceTrackBetween";
  })();

  console.log(`\n─── Alert ${i + 1}: ${alert.name} ───`);
  console.log(`  id:          ${alert.id}`);
  console.log(`  severity:    ${alert.severity}`);
  console.log(`  fromStation: "${alert.fromStation}"`);
  console.log(`  toStation:   "${alert.toStation}"`);
  console.log(`  coords:      ${source}`);
  console.log(`  coord source: ${coordSource}`);
  if (coordCount > 0) {
    console.log(`  first coord: [${alert.coords[0]}]`);
    console.log(`  last coord:  [${alert.coords[coordCount - 1]}]`);
  }
});

// ── Also log the full output if you want to inspect the raw objects ──
console.log("\n\n══ Full normalised output ══");
console.log(JSON.stringify(result, null, 2));
