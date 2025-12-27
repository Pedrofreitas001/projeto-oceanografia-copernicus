// hooks/useCopernicusWMTS.ts
// Hook para gerenciar camadas WMTS da Copernicus

import { useState, useEffect, useCallback } from 'react';
import { VariableId } from '../types/copernicus';
import { buildWMTSTileUrl } from '../services/copernicusWMTS';

interface UseCopernicusWMTSParams {
  variableId: VariableId;
  time?: string;
  elevation?: number;
  enabled?: boolean;
}

interface UseCopernicusWMTSReturn {
  tileUrl: string;
  isLoading: boolean;
  error: Error | null;
  refresh: () => void;
}

export function useCopernicusWMTS({
  variableId,
  time,
  elevation,
  enabled = true
}: UseCopernicusWMTSParams): UseCopernicusWMTSReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const tileUrl = buildWMTSTileUrl({
    variableId,
    time,
    elevation
  });

  const refresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  // Reset error quando parâmetros mudam
  useEffect(() => {
    setError(null);
  }, [variableId, time, elevation]);

  return {
    tileUrl,
    isLoading,
    error,
    refresh
  };
}
