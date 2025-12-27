// components/CopernicusMap.tsx
// Mapa interativo com integração completa Copernicus Marine WMTS

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { VariableId } from '../types/copernicus';
import { buildWMTSTileUrl } from '../services/copernicusWMTS';
import { OceanographicControlPanel } from './OceanographicControlPanel';
import { Station } from '../types';

interface CopernicusMapProps {
  selectedStation?: Station | null;
  stations?: Station[];
}

export const CopernicusMap: React.FC<CopernicusMapProps> = ({
  selectedStation,
  stations = []
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const wmtsLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  const [variableId, setVariableId] = useState<VariableId>('thetao');
  const [elevation, setElevation] = useState(-0.5);
  const [time, setTime] = useState(
    new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  // Initialize Map
  useEffect(() => {
    if (!mapContainer.current) return;
    if (mapInstance.current) return;

    const map = L.map(mapContainer.current, {
      zoomControl: false,
      attributionControl: false,
      minZoom: 2,
      maxZoom: 10
    }).setView([-23.5, -45.0], 4);

    mapInstance.current = map;
    markersRef.current = L.layerGroup().addTo(map);

    // Camada Base - Oceano Escuro
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Esri, GEBCO, NOAA',
      maxZoom: 13
    }).addTo(map);

    // Controles do mapa
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

  // Update WMTS Layer when parameters change
  useEffect(() => {
    if (!mapInstance.current) return;

    const map = mapInstance.current;

    // Remove existing WMTS layer
    if (wmtsLayerRef.current) {
      map.removeLayer(wmtsLayerRef.current);
    }

    // Build WMTS URL
    const tileUrl = buildWMTSTileUrl({
      variableId,
      time: `${time}T00:00:00Z`,
      elevation
    });

    console.log('🌊 Creating Copernicus WMTS layer:', {
      variable: variableId,
      time,
      elevation,
      url: tileUrl
    });

    // Create new WMTS layer
    const wmtsLayer = L.tileLayer(tileUrl, {
      opacity: 0.7,
      attribution: '© Copernicus Marine Service',
      maxZoom: 10,
      minZoom: 2,
      crossOrigin: true,
    });

    wmtsLayer.on('tileerror', (e: any) => {
      console.error('❌ WMTS tile error:', e);
    });

    wmtsLayer.on('tileload', () => {
      console.log('✅ WMTS tile loaded');
    });

    wmtsLayer.addTo(map);
    wmtsLayerRef.current = wmtsLayer;

  }, [variableId, elevation, time]);

  // Handle Stations Markers
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
          } transition-all">
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

    // Fly to selected station
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

      <OceanographicControlPanel
        currentVariable={variableId}
        currentElevation={elevation}
        onVariableChange={setVariableId}
        onElevationChange={setElevation}
        onTimeChange={setTime}
      />

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-slate-900/95 backdrop-blur-md px-3 py-2 rounded-lg border border-ocean-500/30 shadow-lg z-[400]">
        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
          Variável: {variableId.toUpperCase()}
        </h4>
        <div className="text-xs text-slate-300 space-y-1">
          <div>📅 {time}</div>
          <div>📏 {Math.abs(elevation)}m profundidade</div>
        </div>
      </div>
    </div>
  );
};
