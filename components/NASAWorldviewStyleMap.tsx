// components/NASAWorldviewStyleMap.tsx
// NASA Worldview-style interactive SST map with timeline controls

import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { Station } from '../types';

interface NASAWorldviewStyleMapProps {
  selectedStation?: Station | null;
  stations?: Station[];
}

interface SSTLayer {
  id: string;
  name: string;
  description: string;
  type: 'wms' | 'wmts';
  url: string;
  layers?: string;
  format: string;
  resolution: string;
  updateFrequency: string;
  buildUrl: (date: string) => string;
}

// NASA GIBS SST Layers - Official layer identifiers from NASA GIBS Documentation
// Reference: https://nasa-gibs.github.io/gibs-api-docs/access-basics/
// Catalog: https://worldview.earthdata.nasa.gov/
const SST_LAYERS: SSTLayer[] = [
  {
    id: 'ghrsst_mur_gibs',
    name: 'GHRSST MUR SST (GIBS)',
    description: 'Multi-scale Ultra-high Resolution SST from NASA GIBS - 1km resolution',
    type: 'wmts',
    url: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best',
    format: 'image/png',
    resolution: '1km',
    updateFrequency: 'Daily',
    buildUrl: (date: string) => {
      // Official GIBS WMTS REST pattern
      return `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/GHRSST_L4_MUR_Sea_Surface_Temperature/default/${date}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.png`;
    }
  },
  {
    id: 'modis_sst_day',
    name: 'MODIS Aqua SST MidIR (Day)',
    description: 'Mid-infrared daytime SST from MODIS Aqua - 4km resolution',
    type: 'wmts',
    url: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best',
    format: 'image/png',
    resolution: '4km',
    updateFrequency: 'Daily',
    buildUrl: (date: string) => {
      // Layer ID: MODIS_Aqua_L3_SST_MidIR_4km_Day_Daily
      return `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Aqua_L3_SST_MidIR_4km_Day_Daily/default/${date}/GoogleMapsCompatible_Level7/{z}/{y}/{x}.png`;
    }
  },
  {
    id: 'modis_sst_night',
    name: 'MODIS Aqua SST MidIR (Night)',
    description: 'Mid-infrared nighttime SST from MODIS Aqua - 4km resolution',
    type: 'wmts',
    url: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best',
    format: 'image/png',
    resolution: '4km',
    updateFrequency: 'Daily',
    buildUrl: (date: string) => {
      // Layer ID: MODIS_Aqua_L3_SST_MidIR_4km_Night_Daily
      return `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Aqua_L3_SST_MidIR_4km_Night_Daily/default/${date}/GoogleMapsCompatible_Level7/{z}/{y}/{x}.png`;
    }
  },
  {
    id: 'modis_sst_thermal_day',
    name: 'MODIS Aqua SST Thermal (Day)',
    description: 'Thermal infrared SST from MODIS Aqua - daytime 4km',
    type: 'wmts',
    url: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best',
    format: 'image/png',
    resolution: '4km',
    updateFrequency: 'Daily',
    buildUrl: (date: string) => {
      // Layer ID: MODIS_Aqua_L3_SST_Thermal_4km_Day_Daily
      return `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Aqua_L3_SST_Thermal_4km_Day_Daily/default/${date}/GoogleMapsCompatible_Level7/{z}/{y}/{x}.png`;
    }
  },
  {
    id: 'noaa_jpl_mur',
    name: 'JPL MUR SST WMS (Fallback)',
    description: 'NOAA CoastWatch WMS - Ultra-high resolution 1km (fallback)',
    type: 'wms',
    url: 'https://coastwatch.pfeg.noaa.gov/erddap/wms/jplMURSST41/request',
    layers: 'jplMURSST41:analysed_sst',
    format: 'image/png',
    resolution: '1km',
    updateFrequency: 'Daily',
    buildUrl: (date: string) => {
      return `https://coastwatch.pfeg.noaa.gov/erddap/wms/jplMURSST41/request`;
    }
  }
];

export const NASAWorldviewStyleMap: React.FC<NASAWorldviewStyleMapProps> = ({
  selectedStation,
  stations = []
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const sstLayerRef = useRef<L.TileLayer | L.TileLayer.WMS | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  // Usar MODIS Day como padrão (índice 1) ao invés de GHRSST (que pode ter delay de dados)
  const [selectedLayer, setSelectedLayer] = useState<SSTLayer>(SST_LAYERS[1]);
  // Usar dados de 2 dias atrás para garantir disponibilidade
  const [currentDate, setCurrentDate] = useState(
    new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(500); // ms per frame
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const [showTimelinePanel, setShowTimelinePanel] = useState(true);
  const [tilesLoaded, setTilesLoaded] = useState(0);
  const [tilesError, setTilesError] = useState(0);

  // Initialize Map
  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    const map = L.map(mapContainer.current, {
      zoomControl: false,
      attributionControl: true,
      minZoom: 2,
      maxZoom: 12
    }).setView([-23.5, -45.0], 4);

    mapInstance.current = map;
    markersRef.current = L.layerGroup().addTo(map);

    // Dark ocean base layer
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Esri, GEBCO, NOAA, NASA',
      maxZoom: 13
    }).addTo(map);

    // Controls
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.control.scale({
      position: 'bottomleft',
      imperial: false,
      metric: true
    }).addTo(map);

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  // Update SST Layer
  useEffect(() => {
    if (!mapInstance.current) return;

    const map = mapInstance.current;

    // Remove existing layer
    if (sstLayerRef.current) {
      map.removeLayer(sstLayerRef.current);
      setTilesLoaded(0);
      setTilesError(0);
    }

    console.log(`🌊 Loading ${selectedLayer.name} for ${currentDate}`);

    let layer: L.TileLayer | L.TileLayer.WMS;

    if (selectedLayer.type === 'wms') {
      layer = L.tileLayer.wms(selectedLayer.url, {
        layers: selectedLayer.layers || '',
        format: selectedLayer.format,
        transparent: true,
        version: '1.3.0',
        crs: L.CRS.EPSG3857,
        time: `${currentDate}T00:00:00.000Z`,
        colorscalerange: '0,32',
        opacity: 0.7,
        attribution: `© NASA EOSDIS, NOAA`,
        maxZoom: 12,
        minZoom: 2,
      } as any);
    } else {
      // WMTS Layer
      const tileUrl = selectedLayer.buildUrl(currentDate);
      layer = L.tileLayer(tileUrl, {
        opacity: 0.7,
        attribution: `© NASA EOSDIS GIBS`,
        maxZoom: 12,
        minZoom: 2,
        crossOrigin: true,
      });
    }

    layer.on('tileerror', (e: any) => {
      setTilesError(prev => prev + 1);
      console.warn('❌ Tile error:', e.coords);
    });

    layer.on('tileload', () => {
      setTilesLoaded(prev => prev + 1);
    });

    layer.addTo(map);
    sstLayerRef.current = layer;

  }, [selectedLayer, currentDate]);

  // Handle Station Markers
  useEffect(() => {
    if (!mapInstance.current || !markersRef.current) return;

    markersRef.current.clearLayers();

    stations.forEach(station => {
      const isSelected = selectedStation && station.id === selectedStation.id;

      const icon = L.divIcon({
        className: 'custom-marker',
        html: `
          <div class="flex items-center justify-center w-8 h-8 rounded-full ${
            isSelected
              ? 'bg-ocean-400 ring-4 ring-ocean-500/50'
              : 'bg-slate-700 hover:bg-ocean-500'
          } transition-all shadow-lg">
            <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
            </svg>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32]
      });

      const marker = L.marker([station.latitude, station.longitude], { icon });

      marker.bindPopup(`
        <div class="p-2 font-sans">
          <h4 class="font-bold text-sm mb-1">${station.name || `Estação ${station.id}`}</h4>
          <p class="text-xs text-gray-600">
            Lat: ${station.latitude.toFixed(4)}°<br/>
            Lon: ${station.longitude.toFixed(4)}°
          </p>
        </div>
      `);

      markersRef.current!.addLayer(marker);
    });

    if (selectedStation) {
      mapInstance.current.flyTo(
        [selectedStation.latitude, selectedStation.longitude],
        8,
        { duration: 1 }
      );
    }
  }, [stations, selectedStation]);

  // Timeline Animation
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentDate(prevDate => {
        const current = new Date(prevDate);
        const next = new Date(current.getTime() + 24 * 60 * 60 * 1000);
        const end = new Date(dateRange.end);

        if (next > end) {
          setIsPlaying(false);
          return dateRange.start;
        }

        return next.toISOString().split('T')[0];
      });
    }, playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, dateRange]);

  // Generate date array for timeline
  const getDateArray = useCallback(() => {
    const dates: string[] = [];
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);

    for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d).toISOString().split('T')[0]);
    }

    return dates;
  }, [dateRange]);

  const dateArray = getDateArray();
  const currentDateIndex = dateArray.indexOf(currentDate);

  return (
    <div className="relative w-full h-full min-h-[500px] bg-slate-950 rounded-lg overflow-hidden border border-slate-800">
      <div ref={mapContainer} className="absolute inset-0 z-0" />

      {/* Layer Selection Panel */}
      <div className="absolute top-4 left-4 z-[1000]">
        <button
          onClick={() => setShowLayerPanel(!showLayerPanel)}
          className="px-4 py-3 bg-slate-900/95 backdrop-blur-md rounded-lg border border-ocean-500/30 shadow-lg flex items-center gap-2 hover:bg-slate-800/95 transition-colors mb-2"
        >
          <span className="text-ocean-400 text-lg">🛰️</span>
          <div className="flex flex-col items-start">
            <span className="text-xs font-semibold text-slate-200">SST Layer</span>
            <span className="text-[10px] text-slate-400">{selectedLayer.name}</span>
          </div>
          <span className="text-slate-400 text-sm ml-2">
            {showLayerPanel ? '▼' : '▶'}
          </span>
        </button>

        {showLayerPanel && (
          <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-200 max-w-xs">
            {SST_LAYERS.map(layer => (
              <button
                key={layer.id}
                onClick={() => {
                  setSelectedLayer(layer);
                  setShowLayerPanel(false);
                }}
                className={`px-4 py-3 rounded-lg text-left transition-all ${
                  selectedLayer.id === layer.id
                    ? 'bg-ocean-500 text-white shadow-lg'
                    : 'bg-slate-900/95 backdrop-blur-md border border-slate-700 text-slate-300 hover:bg-slate-800/95'
                }`}
              >
                <div className="text-xs font-semibold mb-1">{layer.name}</div>
                <div className="text-[10px] opacity-70">
                  {layer.resolution} | {layer.updateFrequency}
                </div>
                <div className="text-[9px] opacity-60 mt-1">
                  {layer.description}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Timeline Controls - NASA Worldview Style */}
      {showTimelinePanel && (
        <div className="absolute bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-ocean-500/30 shadow-lg z-[1000] p-4">
          {/* Date Display */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-ocean-400">
                {new Date(currentDate).toLocaleDateString('pt-BR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
              <span className="text-xs text-slate-400">
                Frame {currentDateIndex + 1} of {dateArray.length}
              </span>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentDate(dateArray[0])}
                disabled={currentDateIndex === 0}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed rounded text-xs text-white transition-colors"
                title="First"
              >
                ⏮️
              </button>
              <button
                onClick={() => {
                  if (currentDateIndex > 0) {
                    setCurrentDate(dateArray[currentDateIndex - 1]);
                  }
                }}
                disabled={currentDateIndex === 0}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed rounded text-xs text-white transition-colors"
                title="Previous"
              >
                ⏪
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-4 py-2 bg-ocean-500 hover:bg-ocean-600 rounded text-sm text-white font-semibold transition-colors"
              >
                {isPlaying ? '⏸️ Pause' : '▶️ Play'}
              </button>
              <button
                onClick={() => {
                  if (currentDateIndex < dateArray.length - 1) {
                    setCurrentDate(dateArray[currentDateIndex + 1]);
                  }
                }}
                disabled={currentDateIndex === dateArray.length - 1}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed rounded text-xs text-white transition-colors"
                title="Next"
              >
                ⏩
              </button>
              <button
                onClick={() => setCurrentDate(dateArray[dateArray.length - 1])}
                disabled={currentDateIndex === dateArray.length - 1}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed rounded text-xs text-white transition-colors"
                title="Last"
              >
                ⏭️
              </button>
            </div>

            {/* Speed Control */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Speed:</span>
              <select
                value={playbackSpeed}
                onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                className="px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs text-slate-200"
              >
                <option value={1000}>1x</option>
                <option value={500}>2x</option>
                <option value={250}>4x</option>
                <option value={125}>8x</option>
              </select>
            </div>
          </div>

          {/* Timeline Slider */}
          <div className="relative">
            <input
              type="range"
              min={0}
              max={dateArray.length - 1}
              value={currentDateIndex}
              onChange={(e) => setCurrentDate(dateArray[Number(e.target.value)])}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-ocean-500"
              style={{
                background: `linear-gradient(to right, rgb(14, 165, 233) 0%, rgb(14, 165, 233) ${(currentDateIndex / (dateArray.length - 1)) * 100}%, rgb(51, 65, 85) ${(currentDateIndex / (dateArray.length - 1)) * 100}%, rgb(51, 65, 85) 100%)`
              }}
            />
            {/* Date markers */}
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-slate-500">{dateRange.start}</span>
              <span className="text-[10px] text-slate-500">{dateRange.end}</span>
            </div>
          </div>

          {/* Date Range Picker */}
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-700">
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400">From:</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                max={dateRange.end}
                className="px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs text-slate-200"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400">To:</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                min={dateRange.start}
                max={new Date().toISOString().split('T')[0]}
                className="px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs text-slate-200"
              />
            </div>
            <button
              onClick={() => {
                const today = new Date();
                const weekAgo = new Date(today.getTime() - 9 * 24 * 60 * 60 * 1000);
                setDateRange({
                  start: weekAgo.toISOString().split('T')[0],
                  end: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                });
              }}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded text-xs text-slate-300 transition-colors"
            >
              Last 7 Days
            </button>
            <button
              onClick={() => {
                const today = new Date();
                const monthAgo = new Date(today.getTime() - 32 * 24 * 60 * 60 * 1000);
                setDateRange({
                  start: monthAgo.toISOString().split('T')[0],
                  end: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                });
              }}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded text-xs text-slate-300 transition-colors"
            >
              Last 30 Days
            </button>
          </div>
        </div>
      )}

      {/* Toggle Timeline Button */}
      <button
        onClick={() => setShowTimelinePanel(!showTimelinePanel)}
        className="absolute bottom-4 left-4 z-[1001] px-3 py-2 bg-slate-900/95 backdrop-blur-md rounded-lg border border-ocean-500/30 shadow-lg hover:bg-slate-800/95 transition-colors text-xs text-slate-200"
      >
        {showTimelinePanel ? '🎬 Hide Timeline' : '🎬 Show Timeline'}
      </button>

      {/* Info Panel */}
      <div className="absolute top-4 right-4 bg-slate-900/95 backdrop-blur-md px-3 py-2 rounded-lg border border-ocean-500/30 shadow-lg z-[400]">
        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
          NASA Worldview Style
        </h4>
        <div className="text-xs text-slate-300 space-y-1">
          <div>📅 {currentDate}</div>
          <div>🛰️ {selectedLayer.resolution}</div>
          <div className="flex items-center gap-2">
            <span>Tiles:</span>
            <span className="text-green-400">{tilesLoaded} ✓</span>
            {tilesError > 0 && <span className="text-red-400">{tilesError} ✗</span>}
          </div>
        </div>
      </div>
    </div>
  );
};
