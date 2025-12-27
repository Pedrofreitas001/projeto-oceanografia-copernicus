import React, { useEffect, useRef } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TEMP_TREND_DATA, SALINITY_DATA, RECENT_DATA, ANOMALIES } from '../constants';
import { Station } from '../types';
import L from 'leaflet';

interface TemperatureChartProps {
  data?: any[];
}

export const TemperatureChart: React.FC<TemperatureChartProps> = ({ data }) => {
  const chartData = data && data.length > 0 ? data : TEMP_TREND_DATA;

  return (
    <div className="h-[250px] md:h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <defs>
            <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis 
            dataKey="time" 
            stroke="#94a3b8" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
            minTickGap={30} 
          />
          <YAxis 
            stroke="#94a3b8" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
            domain={['auto', 'auto']}
            tickFormatter={(value) => Number(value).toFixed(1)}
            width={40}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
            itemStyle={{ color: '#38bdf8' }}
            formatter={(value: number) => [value.toFixed(1) + '°C', 'Temperature']}
          />
          <Line 
            type="monotone" 
            dataKey="temp" 
            stroke="#0ea5e9" 
            strokeWidth={3} 
            dot={false} 
            activeDot={{ r: 6, fill: '#fff' }} 
            animationDuration={1500}
          />
          <Line 
            type="monotone" 
            dataKey="avg" 
            stroke="#64748b" 
            strokeWidth={2} 
            strokeDasharray="5 5" 
            dot={false} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export const SalinityChart: React.FC = () => {
  return (
    <div className="h-[250px] md:h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={SALINITY_DATA}>
          <defs>
            <linearGradient id="colorSalinity" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} domain={[34, 36]} width={30} />
          <Tooltip 
             contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
             itemStyle={{ color: '#34d399' }}
          />
          <Area type="monotone" dataKey="value" stroke="#10b981" fillOpacity={1} fill="url(#colorSalinity)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

interface OceanMapProps {
  selectedStation: Station | null;
  stations?: Station[];
  metrics?: {
    temp: number;
    salinity: number;
    chlorophyll: number;
    velocity: number;
  };
}

export const OceanMap: React.FC<OceanMapProps> = ({ selectedStation, stations = [], metrics }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const [showSSTOverlay, setShowSSTOverlay] = React.useState(true);

  // Initialize Map
  useEffect(() => {
    if (!mapContainer.current) return;
    if (mapInstance.current) return;

    const map = L.map(mapContainer.current, {
      zoomControl: false,
      attributionControl: false,
      minZoom: 3,
      maxZoom: 12
    }).setView([-23.5, -45.0], 6);

    mapInstance.current = map;
    markersRef.current = L.layerGroup().addTo(map);

    // Camada Base - Batimetria Oceanográfica
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Esri, GEBCO, NOAA',
      maxZoom: 13
    }).addTo(map);

    // Overlay de batimetria/relevo
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Reference/MapServer/tile/{z}/{y}/{x}', {
      opacity: 0.5,
      maxZoom: 13
    }).addTo(map);

    // OVERLAY DE TEMPERATURA SST - Zonas de Temperatura Simplificadas
    console.log('🌡️ Creating SST temperature zones overlay...');

    // Criar camada de retângulos (polígonos) coloridos por faixa de latitude
    const sstZonesLayer = L.layerGroup();

    // Definir zonas de temperatura baseadas em latitude
    const tempZones = [
      { latMin: -90, latMax: -60, color: '#0000FF', temp: '0-5°C', name: 'Polar Sul' },
      { latMin: -60, latMax: -40, color: '#0080FF', temp: '5-10°C', name: 'Subpolar' },
      { latMin: -40, latMax: -23, color: '#00BFFF', temp: '10-15°C', name: 'Temperada Fria' },
      { latMin: -23, latMax: -10, color: '#FFD700', temp: '15-20°C', name: 'Temperada Quente' },
      { latMin: -10, latMax: 0, color: '#FFA500', temp: '20-25°C', name: 'Tropical Sul' },
      { latMin: 0, latMax: 10, color: '#FF6347', temp: '25-28°C', name: 'Equatorial' },
      { latMin: 10, latMax: 23, color: '#FFA500', temp: '20-25°C', name: 'Tropical Norte' },
      { latMin: 23, latMax: 40, color: '#FFD700', temp: '15-20°C', name: 'Temperada Norte' },
      { latMin: 40, latMax: 60, color: '#00BFFF', temp: '10-15°C', name: 'Subpolar Norte' },
      { latMin: 60, latMax: 90, color: '#0080FF', temp: '5-10°C', name: 'Polar Norte' }
    ];

    // Criar retângulos para cada zona
    tempZones.forEach(zone => {
      const rectangle = L.rectangle(
        [[zone.latMin, -180], [zone.latMax, 180]],
        {
          color: zone.color,
          fillColor: zone.color,
          fillOpacity: 0.25,
          opacity: 0.4,
          weight: 1
        }
      ).bindPopup(`
        <div class="font-sans">
          <h4 class="font-bold text-sm">${zone.name}</h4>
          <p class="text-xs">Temperatura: ${zone.temp}</p>
        </div>
      `);

      sstZonesLayer.addLayer(rectangle);
    });

    // Adicionar a camada ao mapa
    sstZonesLayer.addTo(map);
    console.log('✅ SST temperature zones overlay added (VISIBLE)');

    // Armazena referências das camadas
    (map as any)._sstLayer = sstZonesLayer;
    (map as any)._sstLayers = {
      zones: sstZonesLayer
    };

    console.log(`🌡️ SST Temperature Zones: ${tempZones.length} zones created`);

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

  // Toggle SST Overlay
  useEffect(() => {
    if (!mapInstance.current) return;

    const map = mapInstance.current;
    const sstLayers = (map as any)._sstLayers;

    if (sstLayers) {
      if (showSSTOverlay) {
        // Adicionar camada customizada
        if (!map.hasLayer(sstLayers.custom)) {
          sstLayers.custom.addTo(map);
          console.log('🌡️ SST gradient overlay enabled');
        }
        // Tentar adicionar RainViewer
        if (!map.hasLayer(sstLayers.rainviewer)) {
          sstLayers.rainviewer.addTo(map);
        }
      } else {
        // Remover todas as camadas SST
        if (map.hasLayer(sstLayers.custom)) {
          map.removeLayer(sstLayers.custom);
        }
        if (map.hasLayer(sstLayers.rainviewer)) {
          map.removeLayer(sstLayers.rainviewer);
        }
        console.log('🌡️ SST overlay disabled');
      }
    }
  }, [showSSTOverlay]);

  // Handle Station Change (FlyTo) and Markers
  useEffect(() => {
    if (!mapInstance.current || !markersRef.current) return;
    
    // Clear existing markers
    markersRef.current.clearLayers();

    // Helper to create icons
    const createPulseIcon = (colorClass: string, glowClass: string) => L.divIcon({
      className: 'bg-transparent',
      html: `<div class="relative w-6 h-6 group">
              <div class="absolute inset-0 ${glowClass} rounded-full opacity-75 animate-ping"></div>
              <div class="absolute inset-1 ${colorClass} rounded-full border-2 border-slate-900 shadow-lg"></div>
             </div>`
    });

    const createStationIcon = (isActive: boolean) => L.divIcon({
      className: 'bg-transparent',
      html: `<div class="relative w-4 h-4 hover:scale-125 transition-transform">
              <div class="absolute inset-0 ${isActive ? 'bg-white' : 'bg-ocean-500'} rounded-full opacity-20"></div>
              <div class="absolute inset-0.5 ${isActive ? 'bg-white border-ocean-500' : 'bg-ocean-400 border-slate-900'} rounded-full border"></div>
             </div>`
    });

    // Add markers for real stations (use stations prop or fallback to RECENT_DATA)
    const dataToRender = stations.length > 0 ? stations : RECENT_DATA.map(d => ({
      id: d.id,
      name: `Station ${d.id}`,
      latitude: d.latitude,
      longitude: d.longitude,
      status: d.status,
      region: 'brazilian_coast' as const
    }));

    dataToRender.forEach(station => {
      const isSelected = selectedStation && station.id === selectedStation.id;
      const isCritical = station.status === 'critical';

      let icon;
      if (isCritical) icon = createPulseIcon('bg-red-500', 'bg-red-500');
      else icon = createStationIcon(!!isSelected);

      const marker = L.marker([station.latitude, station.longitude], { icon });

      // Use real API data if this is the selected station and metrics are available
      // Otherwise show "Select station" message
      const useRealData = isSelected && metrics;
      const temp = useRealData ? metrics.temp.toFixed(1) : 'N/A';
      const salinity = useRealData ? metrics.salinity.toFixed(1) : 'N/A';
      const chl = useRealData ? metrics.chlorophyll.toFixed(2) : 'N/A';
      const velocity = useRealData ? metrics.velocity.toFixed(2) : 'N/A';

      marker.bindPopup(`
        <div class="font-sans min-w-[180px]">
          <h3 class="font-bold text-slate-100 text-sm mb-1">${station.name}</h3>
          <p class="text-xs text-slate-400 mb-2">ID: ${station.id}</p>
          ${useRealData ? `
            <div class="grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-slate-300">
              <span>Temp:</span> <span class="${isCritical ? 'text-red-400 font-bold' : 'text-ocean-400'}">${temp}°C</span>
              <span>Salinity:</span> <span class="text-emerald-400">${salinity} PSU</span>
              <span>Chl-a:</span> <span class="text-teal-400">${chl} mg/m³</span>
              <span>Velocity:</span> <span class="text-blue-400">${velocity} m/s</span>
              <span>Status:</span> <span class="${station.status === 'active' ? 'text-green-400' : 'text-yellow-400'}">${station.status}</span>
            </div>
          ` : `
            <div class="text-xs text-slate-400 py-2">
              <p>Click on a station in the sidebar to view real-time data from Copernicus API</p>
            </div>
          `}
        </div>
      `);

      marker.addTo(markersRef.current!);

      if (isSelected) {
        marker.openPopup();
      }
    });

    // Fly to selected station
    if (selectedStation) {
      mapInstance.current.flyTo(
        [selectedStation.latitude, selectedStation.longitude], 
        9, 
        { duration: 1.5 }
      );
    }

  }, [selectedStation, stations]); // Re-run when selection or stations list changes

  return (
    <div className="relative w-full h-[250px] md:h-[400px] bg-slate-800 rounded-xl overflow-hidden border border-slate-700 shadow-xl group z-0">
      <div ref={mapContainer} className="w-full h-full" />

      {/* Header - GIS Info Panel */}
      <div className="absolute top-4 left-4 bg-slate-900/95 backdrop-blur-md px-4 py-2.5 rounded-lg border border-ocean-500/30 shadow-lg pointer-events-none z-[400]">
        <h3 className="text-xs font-bold text-ocean-100 uppercase tracking-wide mb-1">Atlantic Ocean Monitor</h3>
        <div className="flex items-center gap-2 text-xs text-ocean-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50"></span>
          <span className="font-medium">Real-Time NOAA/NASA Data</span>
        </div>
        <div className="text-[10px] text-slate-500 mt-1 flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span>🌊 Bathymetry (GEBCO)</span>
          </div>
          {showSSTOverlay && (
            <div className="flex items-center gap-2 text-orange-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse"></span>
              <span>🌡️ SST Thermal Gradient</span>
            </div>
          )}
        </div>
      </div>

      {/* SST Overlay Control */}
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
          <span>🌡️ SST Temperature Layer</span>
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-slate-900/95 backdrop-blur-md px-3 py-2 rounded-lg border border-ocean-500/30 shadow-lg z-[400]">
        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Station Status</h4>
        <div className="space-y-1.5 mb-3">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <div className="w-3 h-3 rounded-full bg-ocean-400 border border-slate-900"></div>
            <span>Active</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <div className="w-3 h-3 rounded-full bg-white border-2 border-ocean-500"></div>
            <span>Selected</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <div className="w-3 h-3 rounded-full bg-red-500 border border-slate-900 animate-pulse"></div>
            <span>Critical</span>
          </div>
        </div>

        {showSSTOverlay && (
          <>
            <div className="border-t border-slate-700/50 my-2 pt-2">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Temperature</h4>
              <div className="flex items-center gap-1 mb-1">
                <div className="w-full h-3 rounded" style={{
                  background: 'linear-gradient(to right, rgb(0, 0, 255), rgb(0, 128, 255), rgb(255, 128, 0), rgb(255, 0, 0))'
                }}></div>
              </div>
              <div className="flex justify-between text-[9px] text-slate-400">
                <span>Cold</span>
                <span>Warm</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Coordinates Display */}
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