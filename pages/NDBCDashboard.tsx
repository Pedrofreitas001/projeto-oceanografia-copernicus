/**
 * NDBCDashboard Page
 * ===================
 * Full dashboard page that displays NOAA NDBC buoy data from Supabase.
 * Shows map, KPI cards, and time-series charts using real ingested data.
 *
 * This demonstrates the complete Supabase integration pattern.
 * Can be added as a new route or replace the existing Dashboard.
 */

import React, { useState, useMemo } from "react";
import {
  Thermometer,
  Wind,
  Waves,
  Gauge,
  Loader2,
  MapPin,
  Clock,
  RefreshCw,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { KPICard } from "../components/Layout";
import { NDBCStationMap } from "../components/NDBCStationMap";
import { useNDBCStations } from "../hooks/useNDBCStations";
import { useNDBCTimeseries } from "../hooks/useNDBCTimeseries";
import { NDBCStation } from "../services/ndbc";

// ---------------------------------------------------------------------------
// Region filter options
// ---------------------------------------------------------------------------
const REGIONS = [
  { value: "all", label: "All Regions" },
  { value: "atlantic", label: "Atlantic" },
  { value: "pacific", label: "Pacific" },
  { value: "gulf", label: "Gulf of Mexico" },
  { value: "great_lakes", label: "Great Lakes" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const NDBCDashboard: React.FC = () => {
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [selectedStationId, setSelectedStationId] = useState<string | null>(
    null
  );

  const { stations, loading, error, refetch } = useNDBCStations({
    region: selectedRegion !== "all" ? selectedRegion : undefined,
  });

  const { data: timeseries, loading: tsLoading } = useNDBCTimeseries({
    stationId: selectedStationId,
    hours: 48,
  });

  // Find selected station object
  const selectedStation = useMemo(
    () => stations.find((s) => s.station_id === selectedStationId) || null,
    [stations, selectedStationId]
  );

  // Compute aggregate KPIs from all stations with data
  const kpis = useMemo(() => {
    const withTemp = stations.filter(
      (s) => s.water_temp !== null && s.water_temp !== undefined
    );
    const withWave = stations.filter(
      (s) => s.wave_height !== null && s.wave_height !== undefined
    );
    const withWind = stations.filter(
      (s) => s.wind_speed !== null && s.wind_speed !== undefined
    );
    const withPressure = stations.filter(
      (s) => s.pressure !== null && s.pressure !== undefined
    );

    const avg = (arr: number[]) =>
      arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

    return {
      avgWaterTemp: avg(withTemp.map((s) => s.water_temp!)),
      maxWaveHeight: withWave.length
        ? Math.max(...withWave.map((s) => s.wave_height!))
        : 0,
      avgWindSpeed: avg(withWind.map((s) => s.wind_speed!)),
      avgPressure: avg(withPressure.map((s) => s.pressure!)),
      stationCount: stations.length,
      withDataCount: withTemp.length,
    };
  }, [stations]);

  // Format time-series for Recharts
  const chartData = useMemo(
    () =>
      timeseries.map((m) => ({
        time: new Date(m.observed_at).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        waterTemp: m.water_temp,
        airTemp: m.air_temp,
        waveHeight: m.wave_height,
        windSpeed: m.wind_speed,
        pressure: m.pressure,
      })),
    [timeseries]
  );

  // Loading state
  if (loading && stations.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4">
        <Loader2 className="animate-spin text-ocean-500" size={48} />
        <p className="animate-pulse">Connecting to NOAA NDBC buoy network...</p>
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
              {selectedStation
                ? selectedStation.station_name
                : "NOAA NDBC Buoy Network"}
            </h2>
            <span className="text-xs font-bold px-2 py-1 rounded border bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
              LIVE DATA
            </span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-2">
            {selectedStation && (
              <p className="text-slate-400 flex items-center gap-2">
                <MapPin size={14} />
                {selectedStation.latitude.toFixed(3)}°,{" "}
                {selectedStation.longitude.toFixed(3)}°
              </p>
            )}
            <p className="text-slate-400 flex items-center gap-2">
              <Clock size={14} />
              <span className="text-xs">
                {kpis.withDataCount} of {kpis.stationCount} stations reporting
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Region filter */}
          <select
            value={selectedRegion}
            onChange={(e) => {
              setSelectedRegion(e.target.value);
              setSelectedStationId(null);
            }}
            className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2 focus:border-ocean-500 focus:ring-1 focus:ring-ocean-500"
          >
            {REGIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>

          <button
            onClick={refetch}
            className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:border-ocean-500 transition-colors"
            title="Refresh data"
          >
            <RefreshCw size={16} />
          </button>

          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 text-sm text-red-300">
          {error}. Check Supabase configuration in .env.local
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KPICard
          label={
            selectedStation
              ? `Water Temp (${selectedStation.station_id})`
              : "Avg Water Temperature"
          }
          value={`${(selectedStation?.water_temp ?? kpis.avgWaterTemp).toFixed(1)}°C`}
          change={
            (selectedStation?.water_temp ?? kpis.avgWaterTemp) > 25
              ? "Warm"
              : "Normal"
          }
          trend={
            (selectedStation?.water_temp ?? kpis.avgWaterTemp) > 24
              ? "up"
              : "neutral"
          }
          color="text-ocean-400"
          icon={<Thermometer size={20} />}
        />
        <KPICard
          label={
            selectedStation
              ? `Wave Height (${selectedStation.station_id})`
              : "Max Wave Height"
          }
          value={`${(selectedStation?.wave_height ?? kpis.maxWaveHeight).toFixed(1)} m`}
          change={
            (selectedStation?.wave_height ?? kpis.maxWaveHeight) > 3
              ? "High Seas"
              : "Moderate"
          }
          trend={
            (selectedStation?.wave_height ?? kpis.maxWaveHeight) > 2
              ? "up"
              : "neutral"
          }
          color="text-blue-400"
          icon={<Waves size={20} />}
        />
        <KPICard
          label={
            selectedStation
              ? `Wind (${selectedStation.station_id})`
              : "Avg Wind Speed"
          }
          value={`${(selectedStation?.wind_speed ?? kpis.avgWindSpeed).toFixed(1)} m/s`}
          change={
            (selectedStation?.wind_speed ?? kpis.avgWindSpeed) > 10
              ? "Strong"
              : "Calm"
          }
          trend={
            (selectedStation?.wind_speed ?? kpis.avgWindSpeed) > 8
              ? "up"
              : "neutral"
          }
          color="text-emerald-400"
          icon={<Wind size={20} />}
        />
        <KPICard
          label={
            selectedStation
              ? `Pressure (${selectedStation.station_id})`
              : "Avg Pressure"
          }
          value={`${(selectedStation?.pressure ?? kpis.avgPressure).toFixed(1)} hPa`}
          change={
            (selectedStation?.pressure ?? kpis.avgPressure) < 1010
              ? "Low"
              : "Normal"
          }
          trend={
            (selectedStation?.pressure ?? kpis.avgPressure) < 1010
              ? "down"
              : "neutral"
          }
          color="text-purple-400"
          icon={<Gauge size={20} />}
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map - 2 columns */}
        <div className="lg:col-span-2 h-[500px]">
          <NDBCStationMap onStationSelect={setSelectedStationId} />
        </div>

        {/* Station list - 1 column */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden flex flex-col h-[500px]">
          <div className="p-4 border-b border-slate-700">
            <h3 className="font-semibold text-white text-sm">
              Active Stations ({stations.length})
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-700/50">
            {stations.slice(0, 50).map((s) => (
              <button
                key={s.station_id}
                onClick={() => setSelectedStationId(s.station_id)}
                className={`w-full text-left p-3 hover:bg-slate-700/30 transition-colors ${
                  selectedStationId === s.station_id ? "bg-ocean-500/10 border-l-2 border-ocean-500" : ""
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className="text-xs font-medium text-slate-200 truncate max-w-[200px]">
                    {s.station_name || `Station ${s.station_id}`}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {s.station_id}
                  </span>
                </div>
                <div className="flex gap-3 mt-1 text-[10px] text-slate-400">
                  {s.water_temp != null && (
                    <span className="text-ocean-400">
                      {s.water_temp.toFixed(1)}°C
                    </span>
                  )}
                  {s.wave_height != null && (
                    <span>{s.wave_height.toFixed(1)}m</span>
                  )}
                  {s.wind_speed != null && (
                    <span>{s.wind_speed.toFixed(1)}m/s</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Time-series Charts (shown when a station is selected) */}
      {selectedStationId && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Temperature chart */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Thermometer size={18} className="text-ocean-400" />
                Temperature (48h)
              </h3>
              {tsLoading && (
                <Loader2 size={14} className="animate-spin text-slate-500" />
              )}
            </div>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis
                    dataKey="time"
                    tick={{ fill: "#94a3b8", fontSize: 10 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line
                    type="monotone"
                    dataKey="waterTemp"
                    stroke="#0ea5e9"
                    name="Water °C"
                    dot={false}
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="airTemp"
                    stroke="#f59e0b"
                    name="Air °C"
                    dot={false}
                    strokeWidth={1.5}
                    strokeDasharray="4 2"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-slate-500 text-sm">
                {tsLoading
                  ? "Loading time series..."
                  : "No data for this station"}
              </div>
            )}
          </div>

          {/* Wave & Wind chart */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Waves size={18} className="text-blue-400" />
                Wave Height & Wind (48h)
              </h3>
            </div>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis
                    dataKey="time"
                    tick={{ fill: "#94a3b8", fontSize: 10 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line
                    type="monotone"
                    dataKey="waveHeight"
                    stroke="#3b82f6"
                    name="Wave (m)"
                    dot={false}
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="windSpeed"
                    stroke="#10b981"
                    name="Wind (m/s)"
                    dot={false}
                    strokeWidth={1.5}
                    strokeDasharray="4 2"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-slate-500 text-sm">
                No data available
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
