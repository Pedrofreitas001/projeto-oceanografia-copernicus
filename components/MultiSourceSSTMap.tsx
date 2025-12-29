// components/MultiSourceSSTMap.tsx
// Mapa SST com múltiplas fontes de dados e fallback automático

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  SST_DATA_SOURCES,
  SSTDataSource,
  getAvailableSSTSource
} from '../services/sstDataSources';
import { Station } from '../types';

interface MultiSourceSSTMapProps {
  selectedStation?: Station | null;
  stations?: Station[];
}

export const MultiSourceSSTMap: React.FC<MultiSourceSSTMapProps> = ({
  selectedStation,
  stations = []
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const sstLayerRef = useRef<L.TileLayer | L.TileLayer.WMS | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  const [currentSource, setCurrentSource] = useState<SSTDataSource | null>(null);
  const [selectedDate, setSelectedDate] = useState(
    new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [showSourceSelector, setShowSourceSelector] = useState(false);
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

    // Camada Base - Oceano Escuro
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Esri, GEBCO, NOAA',
      maxZoom: 13
    }).addTo(map);

    // Controles
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.control.scale({
      position: 'bottomleft',
      imperial: false,
      metric: true
    }).addTo(map);

    // Inicializar com fonte automática
    getAvailableSSTSource().then(source => {
      setCurrentSource(source);
    });

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  // Update SST Layer when source or date changes
  useEffect(() => {
    if (!mapInstance.current || !currentSource) return;

    const map = mapInstance.current;

    // Remove existing layer
    if (sstLayerRef.current) {
      map.removeLayer(sstLayerRef.current);
      setTilesLoaded(0);
      setTilesError(0);
    }

    console.log(`🌊 Loading SST from: ${currentSource.name}`);
    console.log(`📅 Date: ${selectedDate}`);

    let layer: L.TileLayer | L.TileLayer.WMS;

    if (currentSource.type === 'wms') {
      // WMS Layer
      layer = L.tileLayer.wms(currentSource.url, {
        layers: currentSource.layers,
        format: currentSource.format,
        transparent: true,
        version: '1.3.0',
        crs: L.CRS.EPSG3857,
        time: `${selectedDate}T00:00:00.000Z`,
        colorscalerange: '0,32',
        opacity: currentSource.opacity,
        attribution: currentSource.attribution,
        maxZoom: currentSource.maxZoom,
        minZoom: currentSource.minZoom,
      } as any);
    } else {
      // WMTS/Tiles Layer
      const tileUrl = currentSource.buildUrl(selectedDate);
      layer = L.tileLayer(tileUrl, {
        opacity: currentSource.opacity,
        attribution: currentSource.attribution,
        maxZoom: currentSource.maxZoom,
        minZoom: currentSource.minZoom,
        crossOrigin: true,
      });
    }

    // Event listeners
    layer.on('tileerror', (e: any) => {
      setTilesError(prev => prev + 1);
      console.error('❌ SST tile error:', {
        source: currentSource.id,
        coords: e.coords,
        url: e.tile?.src
      });
    });

    layer.on('tileload', (e: any) => {
      setTilesLoaded(prev => prev + 1);
      if (tilesLoaded < 3) {
        console.log(`✅ SST tile loaded (${tilesLoaded + 1}):`, e.coords);
      }
    });

    layer.addTo(map);
    sstLayerRef.current = layer;

    console.log(`✅ SST layer active: ${currentSource.name}`);
    console.log(`📊 Resolution: ${currentSource.resolution}`);
    console.log(`🔄 Update frequency: ${currentSource.updateFrequency}`);

  }, [currentSource, selectedDate]);

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

  return (
    <div className="relative w-full h-full min-h-[500px] bg-slate-950 rounded-lg overflow-hidden border border-slate-800">
      <div ref={mapContainer} className="absolute inset-0 z-0" />

      {/* Source Selector Panel */}
      <div className="absolute top-4 left-4 z-[1000]">
        <button
          onClick={() => setShowSourceSelector(!showSourceSelector)}
          className="px-4 py-3 bg-slate-900/95 backdrop-blur-md rounded-lg border border-ocean-500/30 shadow-lg flex items-center gap-2 hover:bg-slate-800/95 transition-colors mb-2"
        >
          <span className="text-ocean-400 text-lg">🌡️</span>
          <div className="flex flex-col items-start">
            <span className="text-xs font-semibold text-slate-200">Fonte de Dados SST</span>
            <span className="text-[10px] text-slate-400">{currentSource?.name || 'Carregando...'}</span>
          </div>
          <span className="text-slate-400 text-sm ml-2">
            {showSourceSelector ? '▼' : '▶'}
          </span>
        </button>

        {showSourceSelector && (
          <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
            {SST_DATA_SOURCES.map(source => (
              <button
                key={source.id}
                onClick={() => {
                  setCurrentSource(source);
                  setShowSourceSelector(false);
                }}
                className={`px-4 py-3 rounded-lg text-left transition-all ${
                  currentSource?.id === source.id
                    ? 'bg-ocean-500 text-white shadow-lg'
                    : 'bg-slate-900/95 backdrop-blur-md border border-slate-700 text-slate-300 hover:bg-slate-800/95'
                }`}
              >
                <div className="text-xs font-semibold mb-1">{source.name}</div>
                <div className="text-[10px] opacity-70">
                  {source.resolution} | {source.updateFrequency}
                </div>
              </button>
            ))}

            {/* Date Selector */}
            <div className="px-4 py-3 bg-slate-900/95 backdrop-blur-md rounded-lg border border-slate-700">
              <label className="text-xs text-slate-400 block mb-2">Data</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs text-slate-200"
              />
            </div>
          </div>
        )}
      </div>

      {/* Status Panel */}
      <div className="absolute bottom-4 right-4 bg-slate-900/95 backdrop-blur-md px-3 py-2 rounded-lg border border-ocean-500/30 shadow-lg z-[400]">
        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
          Status SST
        </h4>
        <div className="text-xs text-slate-300 space-y-1">
          <div>📅 {selectedDate}</div>
          <div>📊 {currentSource?.resolution}</div>
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
