/**
 * useNDBCStations Hook
 * =====================
 * Fetches all NDBC stations with their latest measurements from Supabase.
 * Includes auto-refresh every 5 minutes.
 */

import { useState, useEffect, useCallback } from "react";
import { NDBCService, NDBCStation } from "../services/ndbc";

interface UseNDBCStationsOptions {
  region?: string;
  refreshInterval?: number; // ms, default 5 min
}

interface UseNDBCStationsResult {
  stations: NDBCStation[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useNDBCStations(
  options: UseNDBCStationsOptions = {}
): UseNDBCStationsResult {
  const { region, refreshInterval = 5 * 60 * 1000 } = options;
  const [stations, setStations] = useState<NDBCStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStations = useCallback(async () => {
    try {
      setError(null);
      const data = region
        ? await NDBCService.getStationsByRegion(region)
        : await NDBCService.getStationsWithLatest();
      setStations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch stations");
      console.error("useNDBCStations error:", err);
    } finally {
      setLoading(false);
    }
  }, [region]);

  useEffect(() => {
    fetchStations();

    if (refreshInterval > 0) {
      const interval = setInterval(fetchStations, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchStations, refreshInterval]);

  return { stations, loading, error, refetch: fetchStations };
}
