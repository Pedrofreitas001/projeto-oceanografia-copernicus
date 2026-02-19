import React, { useEffect, useRef } from 'react';
import { Station } from '../types';
import L from 'leaflet';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatVal(val: number | null | undefined, unit: string): string {
  if (val == null) return 'N/A';
  return `${val.toFixed(1)} ${unit}`;
}

function markerColor(waterTemp: number | null | undefined): string {
  if (waterTemp == null) return '#64748b'; // gray — sem dados
  if (waterTemp >= 28) return '#ef4444';   // red — quente
  if (waterTemp >= 22) return '#f59e0b';   // amber
  if (waterTemp >= 15) return '#0ea5e9';   // sky blue
  return '#6366f1';                        // indigo — frio
}

// ---------------------------------------------------------------------------
// OceanMap — Mapa principal com estações NDBC
// ---------------------------------------------------------------------------

interface OceanMapProps {
  selectedStation: Station | null;
  stations?: Station[];
}

export const OceanMap: React.FC<OceanMapProps> = ({ selectedStation, stations = [] }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  const [showSSTOverlay, setShowSSTOverlay] = React.useState(true);

  // Initialize Map
  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    const map = L.map(mapContainer.current, {
      zoomControl: false,
      attributionControl: false,
      minZoom: 2,
      maxZoom: 12
    }).setView([25.0, -70.0], 4);

    mapInstance.current = map;
    markersRef.current = L.layerGroup().addTo(map);

    // Base layer — Ocean
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Esri, GEBCO, NOAA',
      maxZoom: 13
    }).addTo(map);

    // Reference overlay
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Reference/MapServer/tile/{z}/{y}/{x}', {
      opacity: 0.5,
      maxZoom: 13
    }).addTo(map);

    // SST WMS overlay — NOAA CoastWatch
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const timeParam = yesterday.toISOString().split('T')[0];

    const sstLayer = L.tileLayer.wms('https://coastwatch.pfeg.noaa.gov/erddap/wms/jplMURSST41/request', {
      layers: 'jplMURSST41:analysed_sst',
      format: 'image/png',
      transparent: true,
      version: '1.3.0',
      crs: L.CRS.EPSG4326,
      time: timeParam,
      colorscalerange: '0,32',
      opacity: 0.65,
      attribution: 'NOAA CoastWatch - JPL MUR SST',
      maxZoom: 12,
      minZoom: 2,
    } as any);

    sstLayer.addTo(map);
    (map as any)._sstLayer = sstLayer;

    // Controls
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.control.scale({ position: 'bottomleft', imperial: false, metric: true }).addTo(map);

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  // Toggle SST
  useEffect(() => {
    if (!mapInstance.current) return;
    const map = mapInstance.current;
    const sstLayer = (map as any)._sstLayer;
    if (!sstLayer) return;

    if (showSSTOverlay && !map.hasLayer(sstLayer)) {
      sstLayer.addTo(map);
    } else if (!showSSTOverlay && map.hasLayer(sstLayer)) {
      map.removeLayer(sstLayer);
    }
  }, [showSSTOverlay]);

  // Render station markers
  useEffect(() => {
    if (!mapInstance.current || !markersRef.current) return;

    markersRef.current.clearLayers();

    stations.forEach(station => {
      const isSelected = selectedStation?.station_id === station.station_id;
      const color = markerColor(station.water_temp);
      const size = isSelected ? 14 : 10;

      const icon = L.divIcon({
        className: 'ndbc-marker',
        html: `<div style="
          width: ${size}px; height: ${size}px; border-radius: 50%;
          background: ${color};
          border: 2px solid ${isSelected ? '#fff' : 'rgba(255,255,255,0.6)'};
          box-shadow: 0 0 ${isSelected ? '8px' : '4px'} ${color}80;
          cursor: pointer;
        "></div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const marker = L.marker([station.latitude, station.longitude], { icon });

      // Popup com dados reais da estação
      marker.bindPopup(`
        <div style="font-family: Inter, sans-serif; min-width: 200px;">
          <h4 style="margin: 0 0 4px; font-size: 13px; font-weight: 700; color: #1e293b;">
            ${station.station_name || `Station ${station.station_id}`}
          </h4>
          <div style="font-size: 11px; color: #64748b; margin-bottom: 8px;">
            ID: ${station.station_id} &middot; ${station.region}
          </div>
          <table style="font-size: 12px; color: #334155; border-collapse: collapse; width: 100%;">
            <tr><td style="padding: 2px 8px 2px 0; color: #94a3b8;">Water Temp</td>
                <td style="font-weight: 600;">${formatVal(station.water_temp, '°C')}</td></tr>
            <tr><td style="padding: 2px 8px 2px 0; color: #94a3b8;">Air Temp</td>
                <td style="font-weight: 600;">${formatVal(station.air_temp, '°C')}</td></tr>
            <tr><td style="padding: 2px 8px 2px 0; color: #94a3b8;">Wave Height</td>
                <td style="font-weight: 600;">${formatVal(station.wave_height, 'm')}</td></tr>
            <tr><td style="padding: 2px 8px 2px 0; color: #94a3b8;">Wind Speed</td>
                <td style="font-weight: 600;">${formatVal(station.wind_speed, 'm/s')}</td></tr>
            <tr><td style="padding: 2px 8px 2px 0; color: #94a3b8;">Pressure</td>
                <td style="font-weight: 600;">${formatVal(station.pressure, 'hPa')}</td></tr>
          </table>
          ${station.observed_at ? `<div style="font-size: 10px; color: #94a3b8; margin-top: 6px;">
            Obs: ${new Date(station.observed_at).toLocaleString()}
          </div>` : ''}
        </div>
      `);

      markersRef.current!.addLayer(marker);

      if (isSelected) {
        marker.openPopup();
      }
    });

    // Fly to selected station
    if (selectedStation) {
      mapInstance.current.flyTo(
        [selectedStation.latitude, selectedStation.longitude],
        8,
        { duration: 1.5 }
      );
    }
  }, [stations, selectedStation]);

  return (
    <div className="relative w-full h-[250px] md:h-[400px] bg-slate-800 rounded-xl overflow-hidden border border-slate-700 shadow-xl group z-0">
      <div ref={mapContainer} className="w-full h-full" />

      {/* Header — GIS Info Panel */}
      <div className="absolute top-4 left-4 bg-slate-900/95 backdrop-blur-md px-4 py-2.5 rounded-lg border border-ocean-500/30 shadow-lg pointer-events-none z-[400]">
        <h3 className="text-xs font-bold text-ocean-100 uppercase tracking-wide mb-1">NOAA NDBC Buoy Network</h3>
        <div className="flex items-center gap-2 text-xs text-ocean-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50"></span>
          <span className="font-medium">{stations.length} Active Stations</span>
        </div>
        {showSSTOverlay && (
          <div className="text-[10px] text-orange-400 font-medium mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse"></span>
            SST Overlay (NOAA MUR)
          </div>
        )}
      </div>

      {/* SST toggle */}
      <div className="absolute top-4 right-4 bg-slate-900/95 backdrop-blur-md rounded-lg border border-ocean-500/30 shadow-lg z-[400] overflow-hidden pointer-events-auto">
        <button
          onClick={() => setShowSSTOverlay(!showSSTOverlay)}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium transition-all ${
            showSSTOverlay
              ? 'bg-ocean-500/20 text-ocean-300'
              : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${showSSTOverlay ? 'bg-ocean-400' : 'bg-slate-600'}`}></span>
          SST Layer
        </button>
      </div>

      {/* Legend — Water Temperature */}
      <div className="absolute bottom-4 right-4 bg-slate-900/95 backdrop-blur-md px-3 py-2 rounded-lg border border-ocean-500/30 shadow-lg z-[400]">
        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Water Temp</h4>
        <div className="flex flex-col gap-1 text-[10px]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#ef4444' }} />
            <span className="text-slate-300">&ge; 28°C</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#f59e0b' }} />
            <span className="text-slate-300">22-28°C</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#0ea5e9' }} />
            <span className="text-slate-300">15-22°C</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#6366f1' }} />
            <span className="text-slate-300">&lt; 15°C</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#64748b' }} />
            <span className="text-slate-300">No data</span>
          </div>
        </div>

        {showSSTOverlay && (
          <div className="border-t border-slate-700/50 mt-2 pt-2">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">SST Overlay</h4>
            <div className="flex items-center gap-1 mb-1">
              <div className="w-full h-3 rounded" style={{
                background: 'linear-gradient(to right, #0000ff, #00ffff, #00ff00, #ffff00, #ff8800, #ff0000)'
              }}></div>
            </div>
            <div className="flex justify-between text-[9px] text-slate-400">
              <span>0°C</span>
              <span>16°C</span>
              <span>32°C</span>
            </div>
          </div>
        )}
      </div>

      {/* Coordinates display */}
      {selectedStation && (
        <div className="absolute bottom-4 left-4 bg-slate-900/95 backdrop-blur-md px-3 py-2 rounded-lg border border-ocean-500/30 shadow-lg z-[400] font-mono">
          <div className="text-[10px] text-slate-500 mb-0.5">COORDINATES</div>
          <div className="text-xs text-ocean-400 font-semibold">
            {selectedStation.latitude.toFixed(4)}°, {selectedStation.longitude.toFixed(4)}°
          </div>
        </div>
      )}
    </div>
  );
};
