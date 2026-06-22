import { Station, Asset, Alert } from "../types";

export const DEFAULT_STATIONS: Station[] = [
    { name: "Naledi", lat: -26.257944, lon: 27.822776, isTerminus: false, stationCategory: "Super Core", sectionLength: 0.0, passengerVolume: 872694, numberOfLines: 2, region: "GP" },
    { name: "Merafe", lat: -26.262121, lon: 27.846648, isTerminus: false, stationCategory: "Core", sectionLength: 2.8, passengerVolume: 739794, numberOfLines: 2, region: "GP" },
    { name: "Ikwezi", lat: -26.230402, lon: 27.877116, isTerminus: false, stationCategory: "Core", sectionLength: 2.6, passengerVolume: 503388, numberOfLines: 2, region: "GP" },
    { name: "Dube", lat: -26.233204, lon: 27.892423, isTerminus: false, stationCategory: "Core", sectionLength: 2.2, passengerVolume: 356942, numberOfLines: 2, region: "GP" },
    { name: "Phefeni", lat: -26.235102, lon: 27.904816, isTerminus: false, stationCategory: "Intermediate", sectionLength: 1.4, passengerVolume: 217493, numberOfLines: 4, region: "GP" },
    { name: "Phomolong", lat: -26.226518, lon: 27.909008, isTerminus: false, stationCategory: "Core", sectionLength: 1.1, passengerVolume: 423706, numberOfLines: 4, region: "GP" },
    { name: "Mzimhlope", lat: -26.223195, lon: 27.922925, isTerminus: false, stationCategory: "Core", sectionLength: 1.5, passengerVolume: 534090, numberOfLines: 4, region: "GP" },
    { name: "New Canada", lat: -26.214587, lon: 27.942610, isTerminus: false, stationCategory: "Super Core", sectionLength: 2.1, passengerVolume: 279617, numberOfLines: 4, region: "GP" },
    { name: "Croesus", lat: -26.201841, lon: 27.972017, isTerminus: false, stationCategory: "Intermediate", sectionLength: 0.9, passengerVolume: 168013, numberOfLines: 4, region: "GP" },
    { name: "Grosvenor", lat: -26.202852, lon: 28.005390, isTerminus: false, stationCategory: "Halt", sectionLength: 1.4, passengerVolume: 22569, numberOfLines: 4, region: "GP" },
    { name: "Mayfair", lat: -26.204278, lon: 28.013833, isTerminus: false, stationCategory: "Core", sectionLength: 0.9, passengerVolume: 244080, numberOfLines: 4, region: "GP" },
    { name: "Braamfontein", lat: -26.197861, lon: 28.023252, isTerminus: false, stationCategory: "Super Core", sectionLength: 1.4, passengerVolume: 173055, numberOfLines: 4, region: "GP" },
    { name: "Johannesburg Park Station", lat: -26.196780, lon: 28.041684, isTerminus: false, stationCategory: "Core", sectionLength: 2.0, passengerVolume: 2822930, numberOfLines: 4, region: "GP" },
];

export const DEFAULT_ASSETS: Asset[] = [];

// No hardcoded default alerts — the map renders only what the database returns.
// An empty array means no alert overlays appear when AlertsJSON is not yet bound
// or when there are genuinely no active alerts for the corridor.
export const DEFAULT_ALERTS: Alert[] = [];
