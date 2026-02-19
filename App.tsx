import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { FilterRegion, Station } from './types';
import { Menu } from 'lucide-react';
import { NDBCService } from './services/ndbc';

const App: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Filtros e seleção
  const [selectedRegion, setSelectedRegion] = useState<FilterRegion>('all');
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Buscar estações do Supabase quando região muda
  const fetchStations = useCallback(async () => {
    try {
      setLoading(true);
      const data = selectedRegion === 'all'
        ? await NDBCService.getStationsWithLatest()
        : await NDBCService.getStationsByRegion(selectedRegion);

      setStations(data);

      // Selecionar primeira estação se nenhuma selecionada
      if (data.length > 0) {
        if (!selectedStationId || !data.find(s => s.station_id === selectedStationId)) {
          setSelectedStationId(data[0].station_id);
        }
      } else {
        setSelectedStationId(null);
      }
    } catch (err) {
      console.error('Erro ao buscar estações:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedRegion]);

  useEffect(() => {
    fetchStations();
  }, [fetchStations]);

  // Auto-refresh a cada 5 minutos
  useEffect(() => {
    const interval = setInterval(fetchStations, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchStations]);

  const currentStation = stations.find(s => s.station_id === selectedStationId) || null;

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 overflow-hidden font-sans">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        selectedRegion={selectedRegion}
        onRegionChange={setSelectedRegion}
        stations={stations}
        selectedStationId={selectedStationId}
        onStationChange={setSelectedStationId}
      />

      <div className="flex-1 flex flex-col min-w-0 bg-slate-950 relative">
        {/* Mobile Toggle */}
        <div className="md:hidden p-4 border-b border-slate-800 bg-slate-900 flex items-center justify-between">
           <div className="font-display font-bold text-lg text-white">OceanData</div>
           <button
             onClick={() => setIsSidebarOpen(true)}
             className="text-slate-400 hover:text-white"
           >
             <Menu size={24} />
           </button>
        </div>

        <main className="flex-1 overflow-hidden relative">
          <Dashboard
            selectedStation={currentStation}
            stations={stations}
            loading={loading}
          />
        </main>
      </div>
    </div>
  );
};

export default App;
