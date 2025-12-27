// components/Filters/SeasonFilter.tsx
// Componente de filtro por estação do ano

import React from 'react';
import { Season, Hemisphere } from '../../types/copernicus';

interface SeasonFilterProps {
  season: Season | null;
  hemisphere: Hemisphere;
  year: number;
  onSeasonChange: (season: Season | null) => void;
  onHemisphereChange: (hemisphere: Hemisphere) => void;
  onYearChange: (year: number) => void;
}

const SEASON_LABELS: Record<Season, { pt: string; icon: string }> = {
  summer: { pt: 'Verão', icon: '☀️' },
  autumn: { pt: 'Outono', icon: '🍂' },
  winter: { pt: 'Inverno', icon: '❄️' },
  spring: { pt: 'Primavera', icon: '🌸' }
};

export function SeasonFilter({
  season,
  hemisphere,
  year,
  onSeasonChange,
  onHemisphereChange,
  onYearChange
}: SeasonFilterProps) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 3 }, (_, i) => currentYear - 1 + i);

  return (
    <div className="flex flex-col gap-4 p-4 bg-slate-900/95 backdrop-blur-md rounded-lg border border-ocean-500/30 shadow-lg">
      <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
        Filtro por Estação
      </h3>

      {/* Seletor de Hemisfério */}
      <div className="flex gap-2">
        <button
          className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
            hemisphere === 'south'
              ? 'bg-ocean-500 text-white'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
          onClick={() => onHemisphereChange('south')}
        >
          🌎 Sul
        </button>
        <button
          className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
            hemisphere === 'north'
              ? 'bg-ocean-500 text-white'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
          onClick={() => onHemisphereChange('north')}
        >
          🌍 Norte
        </button>
      </div>

      {/* Seletor de Ano */}
      <select
        value={year}
        onChange={(e) => onYearChange(Number(e.target.value))}
        className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:ring-2 focus:ring-ocean-500 focus:outline-none"
      >
        {years.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>

      {/* Grid de Estações */}
      <div className="grid grid-cols-2 gap-2">
        {(Object.keys(SEASON_LABELS) as Season[]).map((s) => (
          <button
            key={s}
            className={`px-3 py-2 rounded-lg flex items-center gap-2 text-xs font-medium transition-colors ${
              season === s
                ? 'bg-ocean-500 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
            onClick={() => onSeasonChange(season === s ? null : s)}
          >
            <span>{SEASON_LABELS[s].icon}</span>
            <span>{SEASON_LABELS[s].pt}</span>
          </button>
        ))}
      </div>

      {season && (
        <p className="text-xs text-slate-400">
          Mostrando dados de {SEASON_LABELS[season].pt.toLowerCase()} {year}
          {hemisphere === 'south' ? ' (Hemisfério Sul)' : ' (Hemisfério Norte)'}
        </p>
      )}
    </div>
  );
}
