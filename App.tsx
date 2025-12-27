import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { AnomaliesPage } from './pages/Anomalies';
import { ViewState, FilterRegion, Station } from './types';
import { Menu } from 'lucide-react';
import { OceanService } from './services/api';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // State for Filters/Selection
  const [selectedRegion, setSelectedRegion] = useState<FilterRegion>('all');
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);

  // Load Stations when region changes
  useEffect(() => {
    const fetchStations = async () => {
      const data = await OceanService.getStations(selectedRegion);
      setStations(data);
      
      // Select first station by default if none selected or if filtering invalidated current selection
      if (data.length > 0) {
        // If current selection is not in the new list, select the first one
        if (!selectedStationId || !data.find(s => s.id === selectedStationId)) {
            setSelectedStationId(data[0].id);
        }
      } else {
        setSelectedStationId(null);
      }
    };
    fetchStations();
  }, [selectedRegion]);

  const handleStationChange = (id: string) => {
    setSelectedStationId(id);
  };

  const currentStation = stations.find(s => s.id === selectedStationId) || null;

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 overflow-hidden font-sans">
      <Sidebar 
        currentView={currentView} 
        onNavigate={setCurrentView} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        // Props for filtering
        selectedRegion={selectedRegion}
        onRegionChange={setSelectedRegion}
        stations={stations}
        selectedStationId={selectedStationId}
        onStationChange={handleStationChange}
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

        {/* View Content */}
        <main className="flex-1 overflow-hidden relative">
           {currentView === 'dashboard' ? (
             <Dashboard selectedStation={currentStation} stations={stations} />
           ) : (
             <AnomaliesPage selectedStation={currentStation} />
           )}
        </main>
      </div>
    </div>
  );
};

export default App;