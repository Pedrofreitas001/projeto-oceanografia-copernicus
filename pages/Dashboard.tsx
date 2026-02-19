import React, { useEffect, useState, useMemo } from 'react';
import {
  Thermometer,
  Waves,
  Wind,
  Gauge,
  Clock,
  Loader2,
  MapPin,
} from 'lucide-react';
import { KPICard } from '../components/Layout';
import { OceanMap } from '../components/Visualizations';
import { Station, Measurement } from '../types';
import { NDBCService } from '../services/ndbc';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface DashboardProps {
  selectedStation: Station | null;
  stations: Station[];
  loading?: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({ selectedStation, stations, loading: stationsLoading }) => {
  const [timeseries, setTimeseries] = useState<Measurement[]>([]);
  const [tsLoading, setTsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Buscar série temporal quando estação selecionada muda
  useEffect(() => {
    if (!selectedStation) {
      setTimeseries([]);
      return;
    }

    const fetchTimeseries = async () => {
      try {
        setTsLoading(true);
        const data = await NDBCService.getStationTimeseries(selectedStation.station_id, 48);
        setTimeseries(data);
        setLastUpdated(new Date());
      } catch (err) {
        console.error('Erro ao buscar série temporal:', err);
        setTimeseries([]);
      } finally {
        setTsLoading(false);
      }
    };

    fetchTimeseries();
  }, [selectedStation?.station_id]);

  // Formatar dados da série temporal para os gráficos
  const chartData = useMemo(() =>
    timeseries.map(m => ({
      time: new Date(m.observed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      waterTemp: m.water_temp,
      airTemp: m.air_temp,
      waveHeight: m.wave_height,
      windSpeed: m.wind_speed,
      pressure: m.pressure,
    })),
    [timeseries]
  );

  // Dados do Live Data Feed — últimas medições da série temporal
  const recentMeasurements = useMemo(() =>
    timeseries.slice(-10).reverse(),
    [timeseries]
  );

  // Estado de loading
  if (stationsLoading && stations.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4">
        <Loader2 className="animate-spin text-ocean-500" size={48} />
        <p className="animate-pulse">Connecting to NOAA NDBC buoy network...</p>
      </div>
    );
  }

  // Valores da estação selecionada para os KPIs
  const waterTemp = selectedStation?.water_temp;
  const waveHeight = selectedStation?.wave_height;
  const windSpeed = selectedStation?.wind_speed;
  const pressure = selectedStation?.pressure;

  return (
    <div className="p-6 md:p-8 space-y-8 h-full overflow-y-auto pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-white">
              {selectedStation
                ? selectedStation.station_name || `Station ${selectedStation.station_id}`
                : 'NOAA NDBC Buoy Network'}
            </h2>
            {selectedStation && (
              <span className="text-sm font-sans font-normal text-slate-500 bg-slate-800 px-2 py-1 rounded border border-slate-700">
                ID: {selectedStation.station_id}
              </span>
            )}
            <span className="text-xs font-bold px-2 py-1 rounded border bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
              LIVE DATA
            </span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-2">
            {selectedStation && (
              <p className="text-slate-400 flex items-center gap-2">
                <MapPin size={14} />
                Lat: {selectedStation.latitude.toFixed(3)}°, Lon: {selectedStation.longitude.toFixed(3)}°
                &middot; {selectedStation.region}
              </p>
            )}
            <p className="text-slate-400 flex items-center gap-2">
              <Clock size={14} />
              <span className="text-xs">
                Updated: {lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                {selectedStation?.observed_at && (
                  <> &middot; Obs: {new Date(selectedStation.observed_at).toLocaleString('pt-BR')}</>
                )}
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

      {/* KPIs — dados reais da estação selecionada */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KPICard
          label="Water Temperature"
          value={waterTemp != null ? `${waterTemp.toFixed(1)}°C` : 'N/A'}
          change={waterTemp != null ? (waterTemp > 25 ? 'Warm' : waterTemp > 15 ? 'Moderate' : 'Cold') : 'No data'}
          trend={waterTemp != null ? (waterTemp > 25 ? 'up' : waterTemp < 15 ? 'down' : 'neutral') : 'neutral'}
          color="text-ocean-400"
          icon={<Thermometer size={20} />}
        />
        <KPICard
          label="Wave Height"
          value={waveHeight != null ? `${waveHeight.toFixed(1)} m` : 'N/A'}
          change={waveHeight != null ? (waveHeight > 3 ? 'High Seas' : waveHeight > 1.5 ? 'Moderate' : 'Calm') : 'No data'}
          trend={waveHeight != null ? (waveHeight > 3 ? 'up' : 'neutral') : 'neutral'}
          color="text-blue-400"
          icon={<Waves size={20} />}
        />
        <KPICard
          label="Wind Speed"
          value={windSpeed != null ? `${windSpeed.toFixed(1)} m/s` : 'N/A'}
          change={windSpeed != null ? (windSpeed > 10 ? 'Strong' : windSpeed > 5 ? 'Moderate' : 'Calm') : 'No data'}
          trend={windSpeed != null ? (windSpeed > 10 ? 'up' : 'neutral') : 'neutral'}
          color="text-emerald-400"
          icon={<Wind size={20} />}
        />
        <KPICard
          label="Pressure"
          value={pressure != null ? `${pressure.toFixed(1)} hPa` : 'N/A'}
          change={pressure != null ? (pressure < 1010 ? 'Low' : pressure > 1020 ? 'High' : 'Normal') : 'No data'}
          trend={pressure != null ? (pressure < 1010 ? 'down' : 'neutral') : 'neutral'}
          color="text-purple-400"
          icon={<Gauge size={20} />}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map + Charts — 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          <OceanMap selectedStation={selectedStation} stations={stations} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Temperature Chart (48h) */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Thermometer size={18} className="text-ocean-400" />
                  Temperature (48h)
                </h3>
                {tsLoading && <Loader2 size={14} className="animate-spin text-slate-500" />}
              </div>
              {chartData.length > 0 ? (
                <div className="h-[250px] md:h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                      <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                      <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} domain={['auto', 'auto']} width={40} />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Line type="monotone" dataKey="waterTemp" stroke="#0ea5e9" name="Water °C" dot={false} strokeWidth={2} connectNulls />
                      <Line type="monotone" dataKey="airTemp" stroke="#f59e0b" name="Air °C" dot={false} strokeWidth={1.5} strokeDasharray="4 2" connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[250px] md:h-[300px] flex items-center justify-center text-slate-500 text-sm">
                  {tsLoading ? 'Loading...' : 'Select a station to view temperature data'}
                </div>
              )}
            </div>

            {/* Wave & Wind Chart (48h) */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Waves size={18} className="text-blue-400" />
                  Wave Height & Wind (48h)
                </h3>
              </div>
              {chartData.length > 0 ? (
                <div className="h-[250px] md:h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                      <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                      <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} domain={['auto', 'auto']} width={40} />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Line type="monotone" dataKey="waveHeight" stroke="#3b82f6" name="Wave (m)" dot={false} strokeWidth={2} connectNulls />
                      <Line type="monotone" dataKey="windSpeed" stroke="#10b981" name="Wind (m/s)" dot={false} strokeWidth={1.5} strokeDasharray="4 2" connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[250px] md:h-[300px] flex items-center justify-center text-slate-500 text-sm">
                  {tsLoading ? 'Loading...' : 'Select a station to view wave & wind data'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Widgets — 1 column */}
        <div className="space-y-6">
          {/* Live Data Feed */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden flex flex-col h-[500px]">
            <div className="p-5 border-b border-slate-700 flex justify-between items-center">
              <h3 className="font-semibold text-white">Live Data Feed</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">
                  {selectedStation ? `${recentMeasurements.length} records` : 'No station'}
                </span>
                {recentMeasurements.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left text-sm text-slate-400">
                <thead className="bg-slate-900/50 text-xs uppercase font-medium text-slate-500 sticky top-0">
                  <tr>
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3">Temp</th>
                    <th className="px-4 py-3">Wave</th>
                    <th className="px-4 py-3">Wind</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {recentMeasurements.length > 0 ? (
                    recentMeasurements.map((m, i) => (
                      <tr key={i} className="hover:bg-slate-700/20">
                        <td className="px-4 py-3 font-mono text-xs">
                          {new Date(m.observed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className={`px-4 py-3 ${m.water_temp != null && m.water_temp > 28 ? 'text-red-400 font-bold' : 'text-ocean-400'}`}>
                          {m.water_temp != null ? `${m.water_temp.toFixed(1)}°` : '-'}
                        </td>
                        <td className="px-4 py-3">
                          {m.wave_height != null ? `${m.wave_height.toFixed(1)}m` : '-'}
                        </td>
                        <td className="px-4 py-3">
                          {m.wind_speed != null ? `${m.wind_speed.toFixed(1)}` : '-'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-500 text-xs">
                        {tsLoading ? 'Loading measurements...' : 'Select a station to view live data'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pressure Chart */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Gauge size={18} className="text-purple-400" />
                Pressure (48h)
              </h3>
            </div>
            {chartData.length > 0 ? (
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} domain={['auto', 'auto']} width={50} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: 12 }} />
                    <Line type="monotone" dataKey="pressure" stroke="#a855f7" name="hPa" dot={false} strokeWidth={2} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-slate-500 text-sm">
                No data
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
