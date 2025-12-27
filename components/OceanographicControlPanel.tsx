// components/OceanographicControlPanel.tsx
// Painel de controle para dados oceanográficos da Copernicus

import React, { useState } from 'react';
import { VariableId } from '../types/copernicus';
import { SeasonFilter } from './Filters/SeasonFilter';
import { VariableSelector } from './Filters/VariableSelector';
import { DepthSelector } from './Filters/DepthSelector';
import { useSeasonFilter } from '../hooks/useSeasonFilter';

interface OceanographicControlPanelProps {
  onVariableChange: (variableId: VariableId) => void;
  onElevationChange: (elevation: number) => void;
  onTimeChange: (time: string) => void;
  currentVariable: VariableId;
  currentElevation: number;
}

export function OceanographicControlPanel({
  onVariableChange,
  onElevationChange,
  onTimeChange,
  currentVariable,
  currentElevation
}: OceanographicControlPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const {
    season,
    hemisphere,
    year,
    selectedDate,
    setSeason,
    setHemisphere,
    setYear,
    setSelectedDate
  } = useSeasonFilter();

  // Atualizar tempo quando data selecionada muda
  React.useEffect(() => {
    onTimeChange(selectedDate);
  }, [selectedDate, onTimeChange]);

  return (
    <div className="absolute top-4 left-4 z-[1000] max-w-xs">
      {/* Botão de Toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 bg-slate-900/95 backdrop-blur-md rounded-lg border border-ocean-500/30 shadow-lg flex items-center justify-between mb-2 hover:bg-slate-800/95 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-ocean-400 text-lg">🌊</span>
          <span className="text-sm font-semibold text-slate-200">
            Controles Oceanográficos
          </span>
        </div>
        <span className="text-slate-400 text-sm">
          {isExpanded ? '▼' : '▶'}
        </span>
      </button>

      {/* Painel Expansível */}
      {isExpanded && (
        <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <VariableSelector
            selectedVariable={currentVariable}
            onVariableChange={onVariableChange}
          />

          <DepthSelector
            elevation={currentElevation}
            onElevationChange={onElevationChange}
          />

          <SeasonFilter
            season={season}
            hemisphere={hemisphere}
            year={year}
            onSeasonChange={setSeason}
            onHemisphereChange={setHemisphere}
            onYearChange={setYear}
          />

          {/* Data Selecionada */}
          <div className="px-4 py-3 bg-slate-900/95 backdrop-blur-md rounded-lg border border-ocean-500/30 shadow-lg">
            <div className="text-xs text-slate-400 mb-1">Data Selecionada</div>
            <div className="text-sm font-medium text-slate-200">{selectedDate}</div>
          </div>

          {/* Informações */}
          <div className="px-4 py-3 bg-slate-900/95 backdrop-blur-md rounded-lg border border-ocean-500/30 shadow-lg">
            <div className="text-xs text-slate-400 space-y-1">
              <div>📦 Copernicus Marine Service</div>
              <div>🗺️ Resolução: 1/12° (~8km)</div>
              <div>🔄 Atualização: Diária</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
