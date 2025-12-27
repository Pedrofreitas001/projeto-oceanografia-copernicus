import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Thermometer,
  Droplets,
  Wind,
  Search,
  MapPin,
  Calendar,
  ChevronDown,
  Loader2
} from 'lucide-react';
import { OceanService } from '../services/api';
import { Station } from '../types';

interface AnomaliesPageProps {
  selectedStation: Station | null;
}

export const AnomaliesPage: React.FC<AnomaliesPageProps> = ({ selectedStation }) => {
  const [filter, setFilter] = useState<'all' | 'temperature' | 'salinity' | 'currents'>('all');
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch anomalies when selected station changes
  useEffect(() => {
    const loadAnomalies = async () => {
      try {
        setLoading(true);
        const stationId = selectedStation ? selectedStation.id : undefined;
        const data = await OceanService.getAnomalies(stationId);
        setAnomalies(data);
        console.log(`🚨 Loaded ${data.length} anomalies for station: ${selectedStation?.name || 'All Stations'}`);
      } catch (error) {
        console.error('Failed to load anomalies', error);
      } finally {
        setLoading(false);
      }
    };
    loadAnomalies();
  }, [selectedStation]);

  const filteredAnomalies = filter === 'all'
    ? anomalies
    : anomalies.filter(a => a.type === filter);

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4">
        <Loader2 className="animate-spin text-ocean-500" size={48} />
        <p className="animate-pulse">
          {selectedStation ? `Loading anomalies for ${selectedStation.name}...` : 'Loading anomalies...'}
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8 h-full overflow-y-auto pb-24">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl md:text-3xl font-display font-bold text-white flex items-center gap-3">
          <AlertTriangle className="text-yellow-500" size={32} />
          Detected Anomalies
          {selectedStation && (
            <span className="text-sm font-sans font-normal text-slate-500 bg-slate-800 px-2 py-1 rounded border border-slate-700">
              {selectedStation.name}
            </span>
          )}
        </h2>
        <p className="text-slate-400 max-w-2xl">
          AI-driven detection of oceanographic irregularities.
          {anomalies.length > 0 && (
            <span className="text-red-400 font-semibold ml-1">
              {anomalies.length} {anomalies.length === 1 ? 'issue' : 'issues'} detected
            </span>
          )}
        </p>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-wrap gap-4 items-center justify-between bg-slate-800 p-2 rounded-xl border border-slate-700">
        <div className="flex gap-2 p-1">
          <button 
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'all' ? 'bg-ocean-600 text-white shadow-lg shadow-ocean-900/50' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
          >
            All Issues
          </button>
           <button 
            onClick={() => setFilter('temperature')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${filter === 'temperature' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
          >
            <Thermometer size={16} /> Temperature
          </button>
           <button 
            onClick={() => setFilter('salinity')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${filter === 'salinity' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
          >
            <Droplets size={16} /> Salinity
          </button>
        </div>
        
        <div className="relative hidden md:block mr-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
                type="text" 
                placeholder="Search station ID..." 
                className="bg-slate-900 border border-slate-700 rounded-full pl-10 pr-4 py-1.5 text-sm text-white focus:ring-2 focus:ring-ocean-500 focus:border-transparent outline-none w-64"
            />
        </div>
      </div>

      {/* Grid of Anomaly Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAnomalies.map((anomaly) => (
            <div key={anomaly.id} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden hover:border-ocean-500/50 transition-all group flex flex-col">
                {/* Card Header with Image Background */}
                <div className="h-32 bg-slate-700 relative overflow-hidden">
                    <div 
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                         style={{ backgroundImage: `url('https://picsum.photos/seed/${anomaly.id}/600/300')` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent"></div>
                    
                    <div className="absolute top-4 left-4">
                        <span className={`
                            inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border
                            ${anomaly.severity === 'critical' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 
                              anomaly.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : 
                              'bg-blue-500/20 text-blue-400 border-blue-500/30'}
                        `}>
                            {anomaly.severity.toUpperCase()}
                        </span>
                    </div>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono text-slate-500 flex items-center gap-1">
                            <Calendar size={12} /> {anomaly.timestamp}
                        </span>
                        <span className="text-xs font-medium text-ocean-400 flex items-center gap-1">
                             {anomaly.type.charAt(0).toUpperCase() + anomaly.type.slice(1)} Issue
                        </span>
                    </div>
                    
                    <h3 className="text-lg font-bold text-white mb-2">{anomaly.location.name}</h3>
                    <p className="text-sm text-slate-400 mb-6 flex-1">
                        {anomaly.description}
                    </p>

                    {/* Stats Box */}
                    <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700 mb-6 grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Recorded</p>
                            <p className={`text-xl font-display font-bold ${anomaly.severity === 'critical' ? 'text-red-400' : 'text-white'}`}>
                                {anomaly.value}
                                <span className="text-sm text-slate-500 font-normal ml-1">
                                    {anomaly.type === 'temperature' ? '°C' : anomaly.type === 'salinity' ? 'PSU' : 'm/s'}
                                </span>
                            </p>
                        </div>
                        <div className="border-l border-slate-700 pl-4">
                             <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Expected</p>
                            <p className="text-xl font-display font-bold text-slate-300">
                                {anomaly.expected}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3 mt-auto">
                        <button className="flex-1 bg-ocean-600 hover:bg-ocean-500 text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
                            View Details
                        </button>
                         <button className="bg-slate-700 hover:bg-slate-600 text-white p-2.5 rounded-lg transition-colors" title="Locate on Map">
                            <MapPin size={20} />
                        </button>
                    </div>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};
