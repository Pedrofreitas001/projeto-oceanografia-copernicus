import React from 'react';
import { 
  LayoutDashboard, 
  AlertTriangle, 
  Map as MapIcon, 
  Settings, 
  Menu, 
  X,
  Waves,
  Activity,
  Droplets,
  Radio
} from 'lucide-react';
import { ViewState, FilterRegion, Station } from '../types';

interface SidebarProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  isOpen: boolean;
  onClose: () => void;
  // New props for filtering
  selectedRegion: FilterRegion;
  onRegionChange: (region: FilterRegion) => void;
  stations: Station[];
  selectedStationId: string | null;
  onStationChange: (stationId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  onNavigate, 
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

  const navItemClass = (view: ViewState) => `
    flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer
    ${currentView === view 
      ? 'bg-ocean-900/50 text-ocean-400 border border-ocean-800/50' 
      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}
  `;

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
              <p className="text-xs text-ocean-400 font-medium">Pipeline Monitor</p>
            </div>
          </div>

          <nav className="flex-1 space-y-2">
            <div onClick={() => { onNavigate('dashboard'); onClose(); }} className={navItemClass('dashboard')}>
              <LayoutDashboard size={20} />
              <span className="font-medium">Dashboard</span>
            </div>
            <div onClick={() => { onNavigate('anomalies'); onClose(); }} className={navItemClass('anomalies')}>
              <AlertTriangle size={20} />
              <div className="flex items-center justify-between w-full">
                <span className="font-medium">Anomalies</span>
                <span className="bg-red-500/20 text-red-400 text-xs py-0.5 px-2 rounded-full border border-red-500/20">3</span>
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
                  <option value="brazilian_coast">Brazilian Coast</option>
                  <option value="south_atlantic">South Atlantic</option>
                  <option value="pacific">Pacific</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-slate-400">Station</label>
                <select 
                  value={selectedStationId || ''}
                  onChange={(e) => onStationChange(e.target.value)}
                  disabled={stations.length === 0}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg p-2.5 focus:ring-ocean-500 focus:border-ocean-500 outline-none disabled:opacity-50"
                >
                  {stations.length === 0 ? (
                    <option>No stations found</option>
                  ) : (
                    stations.map(station => (
                      <option key={station.id} value={station.id}>
                        {station.name}
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
                JD
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">Jane Doe</p>
                <p className="text-xs text-slate-400 truncate">Lead Oceanographer</p>
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
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 hover:border-ocean-500/30 transition-all duration-300 group">
      <div className="flex items-center justify-between mb-4">
        <span className="text-slate-400 text-sm font-medium">{label}</span>
        <div className={`p-2 rounded-lg bg-slate-700/50 ${color} group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
      </div>
      <div className="flex items-end justify-between">
        <h3 className="text-3xl font-display font-bold text-white">{value}</h3>
        <span className={`text-sm font-medium ${trendColor} flex items-center gap-1 bg-slate-900/50 px-2 py-1 rounded`}>
          {trendArrow} {change}
        </span>
      </div>
    </div>
  );
};