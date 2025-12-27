import React, { useEffect, useState } from 'react';
import { 
  Thermometer, 
  Droplets, 
  AlertOctagon, 
  Clock,
  ArrowRight,
  Loader2,
  FlaskConical,
  MapPin,
  Waves
} from 'lucide-react';
import { KPICard } from '../components/Layout';
import { OceanMap, TemperatureChart, SalinityChart } from '../components/Visualizations';
import { OceanService } from '../services/api';
import { OceanDataPoint, Station } from '../types';

interface DashboardProps {
  selectedStation: Station | null;
}

export const Dashboard: React.FC<DashboardProps> = ({ selectedStation }) => {
  const [loading, setLoading] = useState(true);
  const [recentData, setRecentData] = useState<OceanDataPoint[]>([]);
  const [metrics, setMetrics] = useState({ temp: 0, salinity: 0, chlorophyll: 0 });
  const [trendData, setTrendData] = useState<any[]>([]);

  // Recarregar dados sempre que a estação selecionada mudar
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        
        // Use station coordinates if selected, otherwise default to Santos Basin (-24, -45)
        const lat = selectedStation ? selectedStation.latitude : -24.0;
        const lon = selectedStation ? selectedStation.longitude : -45.0;

        // Parallel fetching
        const [dashboardData, recentMeasurements] = await Promise.all([
          OceanService.getDashboardData(lat, lon),
          OceanService.getRecentMeasurements()
        ]);

        setMetrics({
          temp: dashboardData.currentTemp,
          salinity: dashboardData.currentSalinity,
          chlorophyll: dashboardData.currentChlorophyll
        });
        setTrendData(dashboardData.trend);
        setRecentData(recentMeasurements);
      } catch (err) {
        console.error("Failed to load dashboard", err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [selectedStation]);

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4">
        <Loader2 className="animate-spin text-ocean-500" size={48} />
        <p className="animate-pulse">
            {selectedStation ? `Connecting to ${selectedStation.name}...` : 'Synchronizing with Ocean buoys...'}
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8 h-full overflow-y-auto pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-display font-bold text-white flex items-center gap-3">
            {selectedStation ? selectedStation.name : 'South Atlantic Overview'}
            {selectedStation && <span className="text-sm font-sans font-normal text-slate-500 bg-slate-800 px-2 py-1 rounded border border-slate-700">Station ID: {selectedStation.id}</span>}
          </h2>
          <p className="text-slate-400 mt-1 flex items-center gap-2">
            <MapPin size={14} />
            {selectedStation 
              ? `Lat: ${selectedStation.latitude.toFixed(4)}, Lon: ${selectedStation.longitude.toFixed(4)}` 
              : 'Real-time monitoring network status'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span className="text-sm font-medium text-emerald-400">Pipeline Active</span>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KPICard 
          label="SST Temperature" 
          value={`${metrics.temp}°C`} 
          change={metrics.temp > 25 ? "High" : "Normal"} 
          trend={metrics.temp > 24 ? "up" : "neutral"}
          color="text-ocean-400"
          icon={<Thermometer size={20} />}
        />
        <KPICard 
          label="Avg Salinity" 
          value={`${metrics.salinity.toFixed(1)} PSU`} 
          change="0.0" 
          trend="neutral"
          color="text-emerald-400"
          icon={<Droplets size={20} />}
        />
        <KPICard 
          label="Chlorophyll-a" 
          value={`${metrics.chlorophyll.toFixed(2)}`} 
          change="mg/m³" 
          trend="neutral"
          color="text-teal-400"
          icon={<FlaskConical size={20} />}
        />
        <KPICard 
          label="Current Velocity" 
          value="0.4 m/s" 
          change="Stable" 
          trend="neutral"
          color="text-blue-400"
          icon={<Waves size={20} />}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Section - Takes up 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          <OceanMap selectedStation={selectedStation} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Thermometer size={18} className="text-ocean-400" />
                  Temperature (24h Forecast)
                </h3>
                <span className="text-xs text-slate-500">Source: Open-Meteo</span>
              </div>
              <TemperatureChart data={trendData} />
            </div>
            
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
               <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Droplets size={18} className="text-emerald-400" />
                  Salinity Profile
                </h3>
                <span className="text-xs text-slate-500">Annual</span>
              </div>
              <SalinityChart />
            </div>
          </div>
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-6">
          {/* Anomaly Quick List */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
            <div className="p-5 border-b border-slate-700 flex justify-between items-center">
              <h3 className="font-semibold text-white">Recent Alerts</h3>
              <button className="text-xs text-ocean-400 hover:text-ocean-300 font-medium">View All</button>
            </div>
            <div className="divide-y divide-slate-700/50">
              <div className="p-4 hover:bg-slate-700/30 transition-colors border-l-2 border-red-500">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-sm font-medium text-red-400">Temp Spike</span>
                  <span className="text-xs text-slate-500">14:30</span>
                </div>
                <p className="text-xs text-slate-400">Station 42 reports +4.5°C deviation.</p>
              </div>
               <div className="p-4 hover:bg-slate-700/30 transition-colors border-l-2 border-yellow-500">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-sm font-medium text-yellow-400">Salinity Drop</span>
                  <span className="text-xs text-slate-500">10:15</span>
                </div>
                <p className="text-xs text-slate-400">Potential sensor drift at Buoy 09.</p>
              </div>
            </div>
          </div>

          {/* Recent Data Table */}
           <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden flex flex-col h-[400px]">
            <div className="p-5 border-b border-slate-700">
              <h3 className="font-semibold text-white">Live Data Feed</h3>
            </div>
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left text-sm text-slate-400">
                <thead className="bg-slate-900/50 text-xs uppercase font-medium text-slate-500 sticky top-0">
                  <tr>
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3">Loc</th>
                    <th className="px-4 py-3">Temp</th>
                    <th className="px-4 py-3">Bio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {recentData.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-700/20">
                      <td className="px-4 py-3 font-mono text-xs">{new Date(row.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                      <td className="px-4 py-3">{row.latitude.toFixed(1)}, {row.longitude.toFixed(1)}</td>
                      <td className={`px-4 py-3 ${row.temperature > 28 ? 'text-red-400 font-bold' : ''}`}>{row.temperature}°</td>
                      <td className="px-4 py-3 text-teal-400">{row.chlorophyll?.toFixed(2) || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};