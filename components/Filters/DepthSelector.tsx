// components/Filters/DepthSelector.tsx
// Componente para seleção de profundidade

import React from 'react';

interface DepthSelectorProps {
  elevation: number;
  onElevationChange: (elevation: number) => void;
}

// Níveis de profundidade pré-definidos (em metros, valores negativos)
const DEPTH_LEVELS = [
  { value: -0.5, label: 'Superfície (0.5m)' },
  { value: -10, label: '10m' },
  { value: -20, label: '20m' },
  { value: -50, label: '50m' },
  { value: -100, label: '100m' },
  { value: -200, label: '200m' },
  { value: -500, label: '500m' },
  { value: -1000, label: '1000m' },
  { value: -2000, label: '2000m' },
];

export function DepthSelector({
  elevation,
  onElevationChange
}: DepthSelectorProps) {
  return (
    <div className="flex flex-col gap-3 p-4 bg-slate-900/95 backdrop-blur-md rounded-lg border border-ocean-500/30 shadow-lg">
      <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
        Profundidade
      </h3>

      <select
        value={elevation}
        onChange={(e) => onElevationChange(Number(e.target.value))}
        className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:ring-2 focus:ring-ocean-500 focus:outline-none"
      >
        {DEPTH_LEVELS.map((level) => (
          <option key={level.value} value={level.value}>
            {level.label}
          </option>
        ))}
      </select>

      <div className="text-xs text-slate-400">
        {Math.abs(elevation)} metros de profundidade
      </div>
    </div>
  );
}
