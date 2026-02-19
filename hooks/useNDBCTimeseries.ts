/**
 * useNDBCTimeseries Hook
 * =======================
 * Fetches time-series measurement data for a specific NDBC station.
 */

import { useState, useEffect, useCallback } from "react";
import { NDBCService, NDBCMeasurement } from "../services/ndbc";

interface UseNDBCTimeseriesOptions {
  stationId: string | null;
  hours?: number;
}

interface UseNDBCTimeseriesResult {
  data: NDBCMeasurement[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useNDBCTimeseries(
  options: UseNDBCTimeseriesOptions
): UseNDBCTimeseriesResult {
  const { stationId, hours = 48 } = options;
  const [data, setData] = useState<NDBCMeasurement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!stationId) {
      setData([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await NDBCService.getStationTimeseries(stationId, hours);
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch timeseries"
      );
      console.error("useNDBCTimeseries error:", err);
    } finally {
      setLoading(false);
    }
  }, [stationId, hours]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
