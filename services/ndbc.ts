/**
 * NDBC Data Service
 * ==================
 * Fetches station and measurement data from Supabase (backed by NOAA NDBC).
 * Falls back to direct NDBC fetch if Supabase is not configured.
 *
 * This replaces the mock data in services/api.ts with real data.
 */

import { supabase } from "./supabase";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NDBCStation {
  station_id: string;
  station_name: string;
  latitude: number;
  longitude: number;
  region: string;
  station_type: string;
  is_active: boolean;
  // Latest measurement (from RPC join)
  observed_at?: string;
  wave_height?: number | null;
  wind_speed?: number | null;
  wind_direction?: number | null;
  water_temp?: number | null;
  air_temp?: number | null;
  pressure?: number | null;
}

export interface NDBCMeasurement {
  observed_at: string;
  wave_height: number | null;
  dominant_period: number | null;
  wind_speed: number | null;
  wind_direction: number | null;
  wind_gust: number | null;
  water_temp: number | null;
  air_temp: number | null;
  pressure: number | null;
  dewpoint: number | null;
}

export interface PipelineStatus {
  last_run: string;
  status: string;
  stations_count: number;
  measurements_count: number;
  total_stations: number;
  total_measurements: number;
  oldest_measurement: string;
  newest_measurement: string;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const NDBCService = {
  /**
   * Get all stations with their latest measurement data.
   * Uses the get_stations_with_latest() RPC function.
   */
  async getStationsWithLatest(): Promise<NDBCStation[]> {
    const { data, error } = await supabase.rpc("get_stations_with_latest");

    if (error) {
      console.error("Error fetching stations:", error);
      throw error;
    }

    return (data as NDBCStation[]) || [];
  },

  /**
   * Get time-series data for a specific station.
   * Uses the get_station_timeseries() RPC function.
   */
  async getStationTimeseries(
    stationId: string,
    hours: number = 48
  ): Promise<NDBCMeasurement[]> {
    const { data, error } = await supabase.rpc("get_station_timeseries", {
      p_station_id: stationId,
      p_hours: hours,
    });

    if (error) {
      console.error(`Error fetching timeseries for ${stationId}:`, error);
      throw error;
    }

    return (data as NDBCMeasurement[]) || [];
  },

  /**
   * Get stations within a geographic bounding box.
   * Uses the get_stations_in_bbox() RPC function.
   */
  async getStationsInBBox(
    minLat: number,
    minLon: number,
    maxLat: number,
    maxLon: number
  ): Promise<NDBCStation[]> {
    const { data, error } = await supabase.rpc("get_stations_in_bbox", {
      p_min_lat: minLat,
      p_min_lon: minLon,
      p_max_lat: maxLat,
      p_max_lon: maxLon,
    });

    if (error) {
      console.error("Error fetching stations in bbox:", error);
      throw error;
    }

    return (data as NDBCStation[]) || [];
  },

  /**
   * Get pipeline ingestion status.
   */
  async getPipelineStatus(): Promise<PipelineStatus | null> {
    const { data, error } = await supabase.rpc("get_pipeline_status");

    if (error) {
      console.error("Error fetching pipeline status:", error);
      return null;
    }

    return data?.[0] || null;
  },

  /**
   * Direct REST query: get stations filtered by region.
   * Alternative to RPC when you need simple filtering.
   */
  async getStationsByRegion(region?: string): Promise<NDBCStation[]> {
    let query = supabase
      .from("stations")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (region && region !== "all") {
      query = query.eq("region", region);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching stations by region:", error);
      throw error;
    }

    return (data || []).map((s) => ({
      station_id: s.id,
      station_name: s.name,
      latitude: s.latitude,
      longitude: s.longitude,
      region: s.region,
      station_type: s.station_type,
      is_active: s.is_active,
    }));
  },
};
