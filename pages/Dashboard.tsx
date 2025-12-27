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
  stations?: Station[];
}

export const Dashboard: React.FC<DashboardProps> = ({ selectedStation, stations = [] }) => {
  const [loading, setLoading] = useState(true);
  const [recentData, setRecentData] = useState<OceanDataPoint[]>([]);
  const [metrics, setMetrics] = useState({ temp: 0, salinity: 0, chlorophyll: 0, velocity: 0 });
  const [trendData, setTrendData] = useState<any[]>([]);
  const [anomalyCount, setAnomalyCount] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [historicalData, setHistoricalData] = useState<any[]>([]);

  // Detect API mode from environment
  const apiMode = (import.meta as any).env?.VITE_API_MODE || 'demo';
  const isProduction = apiMode === 'production';

  // Load historical data from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('oceanDataHistory');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setHistoricalData(parsed);
      } catch (e) {
        console.error('Failed to parse historical data');
      }
    }
  }, []);

  // Recarregar dados sempre que a estação selecionada mudar
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);

        // Use station coordinates if selected, otherwise default to Santos Basin (-24, -45)
        const lat = selectedStation ? selectedStation.latitude : -24.0;
        const lon = selectedStation ? selectedStation.longitude : -45.0;
        const stationId = selectedStation ? selectedStation.id : undefined;

        // Parallel fetching - AGORA FILTRANDO POR ESTAÇÃO
        const [dashboardData, recentMeasurements, anomalies] = await Promise.all([
          OceanService.getDashboardData(lat, lon),
          OceanService.getRecentMeasurements(stationId),
          OceanService.getAnomalies(stationId)
        ]);

        const now = new Date();

        // Todos os dados vêm da MESMA fonte (Copernicus ou Open-Meteo)
        const newMetrics = {
          temp: dashboardData.currentTemp,
          salinity: dashboardData.currentSalinity,
          chlorophyll: dashboardData.currentChlorophyll,
          velocity: dashboardData.currentVelocity // Agora vem da API, não calculado!
        };

        setMetrics(newMetrics);
        setTrendData(dashboardData.trend);
        setRecentData(recentMeasurements);
        setAnomalyCount(anomalies.length);
        setLastUpdated(now);

        // Save to historical data (keep last 24 entries = 24 hours if updated hourly)
        const historyEntry = {
          timestamp: now.toISOString(),
          stationId: selectedStation?.id || 'overview',
          stationName: selectedStation?.name || 'South Atlantic Overview',
          ...newMetrics
        };

        setHistoricalData(prevHistory => {
          const newHistory = [historyEntry, ...prevHistory].slice(0, 24);
          localStorage.setItem('oceanDataHistory', JSON.stringify(newHistory));
          console.log(`  - Historical entries: ${newHistory.length}`);
          return newHistory;
        });

        console.log(`📊 Loaded data for station: ${selectedStation?.name || 'All Stations'}`);
        console.log(`  - API Mode: ${isProduction ? 'Production (Copernicus)' : 'Demo (Open-Meteo)'}`);
        console.log(`  - Temperature: ${newMetrics.temp}°C`);
        console.log(`  - Salinity: ${newMetrics.salinity} PSU`);
        console.log(`  - Chlorophyll: ${newMetrics.chlorophyll} mg/m³`);
        console.log(`  - Current Velocity: ${newMetrics.velocity} m/s`);
        console.log(`  - Measurements: ${recentMeasurements.length}`);
        console.log(`  - Anomalies: ${anomalies.length}`);
      } catch (err) {
        console.error("Failed to load dashboard", err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-white">
              {selectedStation ? selectedStation.name : 'South Atlantic Overview'}
            </h2>
            {selectedStation && (
              <span className="text-sm font-sans font-normal text-slate-500 bg-slate-800 px-2 py-1 rounded border border-slate-700">
                Station ID: {selectedStation.id}
              </span>
            )}
            <span className={`text-xs font-bold px-2 py-1 rounded border ${
              isProduction
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
            }`}>
              {isProduction ? 'COPERNICUS API' : 'DEMO MODE'}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-2">
            <p className="text-slate-400 flex items-center gap-2">
              <MapPin size={14} />
              {selectedStation
                ? `Lat: ${selectedStation.latitude.toFixed(4)}, Lon: ${selectedStation.longitude.toFixed(4)}`
                : 'Real-time monitoring network status'}
            </p>
            <p className="text-slate-400 flex items-center gap-2">
              <Clock size={14} />
              <span className="text-xs">
                Last updated: {lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
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
          label={selectedStation ? `SST at ${selectedStation.id}` : "SST Temperature"}
          value={`${metrics.temp}°C`}
          change={metrics.temp > 25 ? "High" : "Normal"}
          trend={metrics.temp > 24 ? "up" : "neutral"}
          color="text-ocean-400"
          icon={<Thermometer size={20} />}
        />
        <KPICard
          label={selectedStation ? `Salinity at ${selectedStation.id}` : "Avg Salinity"}
          value={`${metrics.salinity.toFixed(1)} PSU`}
          change={Math.abs(metrics.salinity - 35.2) < 0.5 ? "Normal" : metrics.salinity > 35.2 ? "+High" : "Low"}
          trend={Math.abs(metrics.salinity - 35.2) < 0.5 ? "neutral" : metrics.salinity > 35.2 ? "up" : "down"}
          color="text-emerald-400"
          icon={<Droplets size={20} />}
        />
        <KPICard
          label={selectedStation ? `Chl-a at ${selectedStation.id}` : "Chlorophyll-a"}
          value={`${metrics.chlorophyll.toFixed(2)}`}
          change="mg/m³"
          trend={metrics.chlorophyll > 0.5 ? "up" : "neutral"}
          color="text-teal-400"
          icon={<FlaskConical size={20} />}
        />
        <KPICard
          label={selectedStation ? `Velocity at ${selectedStation.id}` : "Current Velocity"}
          value={`${metrics.velocity.toFixed(2)} m/s`}
          change={metrics.velocity > 0.5 ? "Strong" : metrics.velocity > 0.3 ? "Moderate" : "Calm"}
          trend={metrics.velocity > 0.5 ? "up" : "neutral"}
          color="text-blue-400"
          icon={<Waves size={20} />}
        />
      </div>

      {/* Timestamp indicator below KPIs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 -mt-4 mb-2">
        <div className="flex items-center gap-2">
          <Clock size={12} className="text-slate-500" />
          <span className="text-xs text-slate-500">
            KPIs updated: {lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            {selectedStation && ` • ${selectedStation.name}`}
          </span>
        </div>
        {historicalData.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">
              📊 {historicalData.length} historical {historicalData.length === 1 ? 'entry' : 'entries'} saved
            </span>
            <button
              onClick={() => {
                if (window.confirm('Clear all historical data?')) {
                  setHistoricalData([]);
                  localStorage.removeItem('oceanDataHistory');
                }
              }}
              className="text-xs text-red-400 hover:text-red-300 underline"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Section - Takes up 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          <OceanMap selectedStation={selectedStation} stations={stations} metrics={metrics} />
          
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
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-white">Recent Alerts</h3>
                {anomalyCount > 0 && (
                  <span className="bg-red-500/20 text-red-400 text-xs py-0.5 px-2 rounded-full border border-red-500/20">
                    {anomalyCount}
                  </span>
                )}
              </div>
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
            <div className="p-5 border-b border-slate-700 flex justify-between items-center">
              <h3 className="font-semibold text-white">Live Data Feed</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">
                  {selectedStation ? `${recentData.length} records from ${selectedStation.id}` : `${recentData.length} recent records`}
                </span>
                {recentData.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                )}
              </div>
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

          {/* Historical Data */}
          {historicalData.length > 0 && (
            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
              <div className="p-5 border-b border-slate-700 flex justify-between items-center">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Clock size={18} className="text-blue-400" />
                  Update History
                </h3>
                <span className="text-xs text-slate-400">Last {historicalData.length}</span>
              </div>
              <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-700/50">
                {historicalData.slice(0, 10).map((entry, idx) => (
                  <div key={idx} className="p-3 hover:bg-slate-700/30 transition-colors">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-medium text-slate-300">{entry.stationName}</span>
                      <span className="text-xs text-slate-500 font-mono">
                        {new Date(entry.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Temp:</span>
                        <span className="text-ocean-400 font-medium">{entry.temp}°C</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Sal:</span>
                        <span className="text-emerald-400 font-medium">{entry.salinity.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Chl:</span>
                        <span className="text-teal-400 font-medium">{entry.chlorophyll.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Vel:</span>
                        <span className="text-blue-400 font-medium">{entry.velocity.toFixed(2)} m/s</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};