/**
 * NDBCStationMap Component
 * =========================
 * Displays NOAA NDBC buoy stations on a Leaflet map with live data popups.
 * Connects to Supabase via the useNDBCStations hook.
 *
 * This is a self-contained example showing the full integration pattern.
 * You can merge this into CopernicusMap.tsx or use it as a standalone page.
 */

import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { useNDBCStations } from "../hooks/useNDBCStations";
import { useNDBCTimeseries } from "../hooks/useNDBCTimeseries";
import { NDBCStation } from "../services/ndbc";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatValue(val: number | null | undefined, unit: string): string {
  if (val === null || val === undefined) return "N/A";
  return `${val.toFixed(1)} ${unit}`;
}

function stationPopupHtml(s: NDBCStation): string {
  return `
    <div style="font-family: Inter, sans-serif; min-width: 200px;">
      <h4 style="margin: 0 0 6px; font-size: 13px; font-weight: 700; color: #1e293b;">
        ${s.station_name || `Station ${s.station_id}`}
      </h4>
      <div style="font-size: 11px; color: #64748b; margin-bottom: 8px;">
        ID: ${s.station_id} &middot; ${s.region}
      </div>
      <table style="font-size: 12px; color: #334155; border-collapse: collapse; width: 100%;">
        <tr><td style="padding: 2px 8px 2px 0; color: #94a3b8;">Water Temp</td>
            <td style="font-weight: 600;">${formatValue(s.water_temp, "°C")}</td></tr>
        <tr><td style="padding: 2px 8px 2px 0; color: #94a3b8;">Air Temp</td>
            <td style="font-weight: 600;">${formatValue(s.air_temp, "°C")}</td></tr>
        <tr><td style="padding: 2px 8px 2px 0; color: #94a3b8;">Wave Height</td>
            <td style="font-weight: 600;">${formatValue(s.wave_height, "m")}</td></tr>
        <tr><td style="padding: 2px 8px 2px 0; color: #94a3b8;">Wind Speed</td>
            <td style="font-weight: 600;">${formatValue(s.wind_speed, "m/s")}</td></tr>
        <tr><td style="padding: 2px 8px 2px 0; color: #94a3b8;">Pressure</td>
            <td style="font-weight: 600;">${formatValue(s.pressure, "hPa")}</td></tr>
      </table>
      ${s.observed_at ? `<div style="font-size: 10px; color: #94a3b8; margin-top: 6px;">
        Observed: ${new Date(s.observed_at).toLocaleString()}
      </div>` : ""}
    </div>
  `;
}

function markerColor(waterTemp: number | null | undefined): string {
  if (waterTemp === null || waterTemp === undefined) return "#64748b"; // gray
  if (waterTemp >= 28) return "#ef4444"; // red (warm)
  if (waterTemp >= 22) return "#f59e0b"; // amber
  if (waterTemp >= 15) return "#0ea5e9"; // sky blue
  return "#6366f1"; // indigo (cold)
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface NDBCStationMapProps {
  onStationSelect?: (stationId: string) => void;
}

export const NDBCStationMap: React.FC<NDBCStationMapProps> = ({
  onStationSelect,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { stations, loading, error } = useNDBCStations();
  const { data: timeseries } = useNDBCTimeseries({
    stationId: selectedId,
    hours: 24,
  });

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    const map = L.map(mapContainer.current, {
      zoomControl: false,
      minZoom: 2,
      maxZoom: 12,
    }).setView([25.0, -70.0], 4);

    mapInstance.current = map;
    markersRef.current = L.layerGroup().addTo(map);

    // Ocean basemap
    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}",
      {
        attribution: "Esri, GEBCO, NOAA",
        maxZoom: 13,
      }
    ).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.control
      .scale({ position: "bottomleft", imperial: false, metric: true })
      .addTo(map);

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  // Update markers when stations change
  useEffect(() => {
    if (!mapInstance.current || !markersRef.current) return;

    markersRef.current.clearLayers();

    stations.forEach((station) => {
      const color = markerColor(station.water_temp);
      const isSelected = station.station_id === selectedId;

      const icon = L.divIcon({
        className: "ndbc-marker",
        html: `
          <div style="
            width: ${isSelected ? "14px" : "10px"};
            height: ${isSelected ? "14px" : "10px"};
            border-radius: 50%;
            background: ${color};
            border: 2px solid ${isSelected ? "#fff" : "rgba(255,255,255,0.6)"};
            box-shadow: 0 0 ${isSelected ? "8px" : "4px"} ${color}80;
            cursor: pointer;
          "></div>
        `,
        iconSize: [isSelected ? 14 : 10, isSelected ? 14 : 10],
        iconAnchor: [isSelected ? 7 : 5, isSelected ? 7 : 5],
      });

      const marker = L.marker([station.latitude, station.longitude], { icon });
      marker.bindPopup(stationPopupHtml(station));
      marker.on("click", () => {
        setSelectedId(station.station_id);
        onStationSelect?.(station.station_id);
      });

      markersRef.current!.addLayer(marker);
    });
  }, [stations, selectedId, onStationSelect]);

  return (
    <div className="relative w-full h-full min-h-[500px] bg-slate-950 rounded-lg overflow-hidden border border-slate-800">
      <div ref={mapContainer} className="absolute inset-0 z-0" />

      {/* Status overlay */}
      <div className="absolute top-3 left-3 z-[400] flex flex-col gap-2">
        {loading && (
          <div className="bg-slate-900/90 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-300">
            Loading {stations.length > 0 ? "updates" : "stations"}...
          </div>
        )}
        {error && (
          <div className="bg-red-900/90 backdrop-blur px-3 py-1.5 rounded-lg border border-red-700 text-xs text-red-300">
            {error}
          </div>
        )}
        {!loading && !error && stations.length > 0 && (
          <div className="bg-slate-900/90 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-400">
            {stations.length} NDBC buoys
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 z-[400] bg-slate-900/95 backdrop-blur-md px-3 py-2 rounded-lg border border-ocean-500/30 shadow-lg">
        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
          Water Temperature
        </h4>
        <div className="flex flex-col gap-1 text-[10px]">
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: "#ef4444" }}
            />
            <span className="text-slate-300">&ge; 28°C (Warm)</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: "#f59e0b" }}
            />
            <span className="text-slate-300">22-28°C</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: "#0ea5e9" }}
            />
            <span className="text-slate-300">15-22°C</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: "#6366f1" }}
            />
            <span className="text-slate-300">&lt; 15°C (Cold)</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: "#64748b" }}
            />
            <span className="text-slate-300">No data</span>
          </div>
        </div>
      </div>

      {/* Selected station detail panel */}
      {selectedId && (
        <div className="absolute top-3 right-3 z-[400] bg-slate-900/95 backdrop-blur-md p-3 rounded-lg border border-slate-700 w-64 max-h-[300px] overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-white">
              Station {selectedId}
            </h4>
            <button
              onClick={() => setSelectedId(null)}
              className="text-slate-400 hover:text-white text-xs"
            >
              Close
            </button>
          </div>
          {timeseries.length > 0 ? (
            <div className="space-y-1">
              <p className="text-[10px] text-slate-400">
                Last {timeseries.length} observations
              </p>
              <table className="w-full text-[10px] text-slate-300">
                <thead>
                  <tr className="text-slate-500">
                    <th className="text-left py-0.5">Time</th>
                    <th className="text-right py-0.5">Temp</th>
                    <th className="text-right py-0.5">Wave</th>
                    <th className="text-right py-0.5">Wind</th>
                  </tr>
                </thead>
                <tbody>
                  {timeseries.slice(-12).map((m, i) => (
                    <tr key={i} className="border-t border-slate-800">
                      <td className="py-0.5 font-mono">
                        {new Date(m.observed_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="text-right text-ocean-400">
                        {formatValue(m.water_temp, "°")}
                      </td>
                      <td className="text-right">
                        {formatValue(m.wave_height, "m")}
                      </td>
                      <td className="text-right">
                        {formatValue(m.wind_speed, "")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-[10px] text-slate-500">No recent data</p>
          )}
        </div>
      )}
    </div>
  );
};
