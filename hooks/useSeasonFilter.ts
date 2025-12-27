// hooks/useSeasonFilter.ts
// Hook personalizado para filtro por estação do ano

import { useState, useCallback, useMemo } from 'react';
import { Season, Hemisphere } from '../types/copernicus';
import { getSeasonDates } from '../constants/seasons';

interface UseSeasonFilterReturn {
  season: Season | null;
  hemisphere: Hemisphere;
  year: number;
  dateRange: { start: Date; end: Date } | null;
  selectedDate: string;
  setSeason: (season: Season | null) => void;
  setHemisphere: (hemisphere: Hemisphere) => void;
  setYear: (year: number) => void;
  setSelectedDate: (date: string) => void;
  getAvailableDates: () => string[];
}

export function useSeasonFilter(): UseSeasonFilterReturn {
  const [season, setSeason] = useState<Season | null>(null);
  const [hemisphere, setHemisphere] = useState<Hemisphere>('south');
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  const dateRange = useMemo(() => {
    if (!season) return null;
    return getSeasonDates(season, year, hemisphere);
  }, [season, year, hemisphere]);

  const getAvailableDates = useCallback(() => {
    if (!dateRange) return [];

    const dates: string[] = [];
    const current = new Date(dateRange.start);

    while (current <= dateRange.end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }

    return dates;
  }, [dateRange]);

  // Quando muda a estação, ajusta a data selecionada
  const handleSetSeason = useCallback((newSeason: Season | null) => {
    setSeason(newSeason);

    if (newSeason) {
      const range = getSeasonDates(newSeason, year, hemisphere);
      // Define a data como o meio da estação
      const midDate = new Date(
        (range.start.getTime() + range.end.getTime()) / 2
      );
      setSelectedDate(midDate.toISOString().split('T')[0]);
    }
  }, [year, hemisphere]);

  return {
    season,
    hemisphere,
    year,
    dateRange,
    selectedDate,
    setSeason: handleSetSeason,
    setHemisphere,
    setYear,
    setSelectedDate,
    getAvailableDates
  };
}
