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
}

export const OceanMap: React.FC<OceanMapProps> = ({ selectedStation }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainer.current) return;
    if (mapInstance.current) return;

    const map = L.map(mapContainer.current, {
      zoomControl: false,
      attributionControl: false
    }).setView([-23.5, -45.0], 6);
    
    mapInstance.current = map;
    markersRef.current = L.layerGroup().addTo(map);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

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

    // Add markers for static data (Mocking visualization of network)
    RECENT_DATA.forEach(point => {
      const isSelected = selectedStation && 
                         Math.abs(point.latitude - selectedStation.latitude) < 0.1 && 
                         Math.abs(point.longitude - selectedStation.longitude) < 0.1;

      const isCritical = point.status === 'critical';
      
      let icon;
      if (isCritical) icon = createPulseIcon('bg-red-500', 'bg-red-500');
      else icon = createStationIcon(!!isSelected);

      const marker = L.marker([point.latitude, point.longitude], { icon });
      
      const chl = (point as any).chlorophyll ? (point as any).chlorophyll : (Math.random() * 0.5 + 0.1).toFixed(2);
      
      marker.bindPopup(`
        <div class="font-sans min-w-[150px]">
          <h3 class="font-bold text-slate-100 text-sm mb-1">Station #${point.id}</h3>
          <div class="grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-slate-300">
            <span>Temp:</span> <span class="${isCritical ? 'text-red-400 font-bold' : 'text-ocean-400'}">${point.temperature}°C</span>
            <span>Salinity:</span> <span>${point.salinity} PSU</span>
            <span>Chl-a:</span> <span class="text-teal-400">${chl}</span>
          </div>
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

  }, [selectedStation]); // Re-run when selection changes

  return (
    <div className="relative w-full h-[250px] md:h-[400px] bg-slate-800 rounded-xl overflow-hidden border border-slate-700 shadow-xl group z-0">
      <div ref={mapContainer} className="w-full h-full" />
      <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur px-4 py-2 rounded border border-slate-700 pointer-events-none z-[400]">
        <h3 className="text-sm font-semibold text-ocean-100">South Atlantic Monitor</h3>
        <div className="flex items-center gap-2 text-xs text-ocean-400">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          Live Feed • Leaflet API
        </div>
      </div>
    </div>
  );
};