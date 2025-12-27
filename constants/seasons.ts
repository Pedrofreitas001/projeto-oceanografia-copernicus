// constants/seasons.ts
// Definições de estações do ano por hemisfério

import { Season, SeasonDateRange, Hemisphere } from '../types/copernicus';

// Estações para Hemisfério Sul (Brasil, Austrália, etc.)
export const SEASONS_SOUTH: Record<Season, SeasonDateRange> = {
  summer: { start: { month: 12, day: 21 }, end: { month: 3, day: 20 } },
  autumn: { start: { month: 3, day: 21 }, end: { month: 6, day: 20 } },
  winter: { start: { month: 6, day: 21 }, end: { month: 9, day: 22 } },
  spring: { start: { month: 9, day: 23 }, end: { month: 12, day: 20 } }
};

// Estações para Hemisfério Norte
export const SEASONS_NORTH: Record<Season, SeasonDateRange> = {
  spring: { start: { month: 3, day: 21 }, end: { month: 6, day: 20 } },
  summer: { start: { month: 6, day: 21 }, end: { month: 9, day: 22 } },
  autumn: { start: { month: 9, day: 23 }, end: { month: 12, day: 20 } },
  winter: { start: { month: 12, day: 21 }, end: { month: 3, day: 20 } }
};

/**
 * Retorna o intervalo de datas para uma estação específica
 */
export function getSeasonDates(
  season: Season,
  year: number,
  hemisphere: Hemisphere = 'south'
): { start: Date; end: Date } {
  const seasons = hemisphere === 'south' ? SEASONS_SOUTH : SEASONS_NORTH;
  const { start, end } = seasons[season];

  // Tratamento especial para estações que cruzam o ano
  const startYear = start.month === 12 ? year : year;
  const endYear = end.month <= 3 && start.month === 12 ? year + 1 : year;

  return {
    start: new Date(startYear, start.month - 1, start.day),
    end: new Date(endYear, end.month - 1, end.day)
  };
}
