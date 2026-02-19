import React from 'react';
import {
  LayoutDashboard,
  Settings,
  Waves,
  Radio
} from 'lucide-react';
import { FilterRegion, Station } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRegion: FilterRegion;
  onRegionChange: (region: FilterRegion) => void;
  stations: Station[];
  selectedStationId: string | null;
  onStationChange: (stationId: string) => void;
  currentView?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  selectedRegion,
  onRegionChange,
  stations,
  selectedStationId,
  onStationChange
}) => {
  const baseClass = "fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0";
  const visibilityClass = isOpen ? "translate-x-0" : "-translate-x-full";

  // Contar estações com dados
  const withData = stations.filter(s => s.water_temp != null).length;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={onClose} />
      )}

      <aside className={`${baseClass} ${visibilityClass}`}>
        <div className="flex flex-col h-full p-4">
          <div className="flex items-center gap-3 px-2 mb-8 mt-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ocean-500 to-ocean-700 flex items-center justify-center shadow-lg shadow-ocean-900/20">
              <Waves className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg tracking-tight text-white">OceanData</h1>
              <p className="text-xs text-ocean-400 font-medium">NOAA NDBC Pipeline</p>
            </div>
          </div>

          <nav className="flex-1 space-y-2">
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-ocean-900/50 text-ocean-400 border border-ocean-800/50">
              <LayoutDashboard size={20} />
              <span className="font-medium">Dashboard</span>
            </div>

            {/* Status da Pipeline */}
            <div className="mt-4 mx-2 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-medium text-emerald-400">Pipeline Active</span>
              </div>
              <div className="text-[10px] text-slate-500 space-y-0.5">
                <div>{stations.length} estações carregadas</div>
                <div>{withData} com dados recentes</div>
              </div>
            </div>

            <div className="mt-8 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Radio size={12} />
              Station Select
            </div>

            <div className="space-y-4 px-2 mt-4">
              <div className="space-y-2">
                <label className="text-xs text-slate-400">Region</label>
                <select
                  value={selectedRegion}
                  onChange={(e) => onRegionChange(e.target.value as FilterRegion)}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg p-2.5 focus:ring-ocean-500 focus:border-ocean-500 outline-none"
                >
                  <option value="all">All Regions</option>
                  <option value="atlantic">Atlantic</option>
                  <option value="pacific">Pacific</option>
                  <option value="gulf">Gulf of Mexico</option>
                  <option value="great_lakes">Great Lakes</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-slate-400">
                  Station ({stations.length})
                </label>
                <select
                  value={selectedStationId || ''}
                  onChange={(e) => onStationChange(e.target.value)}
                  disabled={stations.length === 0}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg p-2.5 focus:ring-ocean-500 focus:border-ocean-500 outline-none disabled:opacity-50"
                >
                  {stations.length === 0 ? (
                    <option>Loading stations...</option>
                  ) : (
                    stations.map(station => (
                      <option key={station.station_id} value={station.station_id}>
                        {station.station_id} - {station.station_name ? station.station_name.substring(0, 30) : 'Unknown'}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>
          </nav>

          <div className="pt-4 border-t border-slate-800">
            <button className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white transition-colors w-full">
              <Settings size={20} />
              <span className="font-medium">Settings</span>
            </button>
            <div className="mt-4 flex items-center gap-3 px-4 py-3 bg-slate-800/50 rounded-xl border border-slate-800">
              <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold text-white">
                DE
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">Data Engineer</p>
                <p className="text-xs text-slate-400 truncate">Ocean Pipeline Ops</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export const KPICard: React.FC<{
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  color: string;
}> = ({ label, value, change, trend, icon, color }) => {
  const trendColor = trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-slate-400';
  const trendArrow = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 sm:p-5 md:p-6 hover:border-ocean-500/30 transition-all duration-300 group">
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <span className="text-slate-400 text-xs sm:text-sm font-medium leading-tight">{label}</span>
        <div className={`p-1.5 sm:p-2 rounded-lg bg-slate-700/50 ${color} group-hover:scale-110 transition-transform shrink-0`}>
          {icon}
        </div>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <h3 className="text-2xl sm:text-3xl font-display font-bold text-white truncate">{value}</h3>
        <span className={`text-xs sm:text-sm font-medium ${trendColor} flex items-center gap-1 bg-slate-900/50 px-2 py-1 rounded whitespace-nowrap self-start sm:self-auto`}>
          {trendArrow} {change}
        </span>
      </div>
    </div>
  );
};
