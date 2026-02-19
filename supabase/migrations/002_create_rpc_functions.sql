-- ============================================================
-- RPC Functions - API Layer for the Ocean Data Pipeline
-- ============================================================
-- These functions are called via Supabase's `.rpc()` client
-- or via the REST API at /rest/v1/rpc/<function_name>
-- ============================================================

-- ============================================================
-- 1. GET ALL STATIONS WITH LATEST MEASUREMENT
-- ============================================================
-- Returns each active station joined with its most recent observation.
-- Used by the map to render markers with live data tooltips.

CREATE OR REPLACE FUNCTION get_stations_with_latest()
RETURNS TABLE (
    station_id      TEXT,
    station_name    TEXT,
    latitude        DOUBLE PRECISION,
    longitude       DOUBLE PRECISION,
    region          TEXT,
    station_type    TEXT,
    is_active       BOOLEAN,
    observed_at     TIMESTAMPTZ,
    wave_height     DOUBLE PRECISION,
    wind_speed      DOUBLE PRECISION,
    wind_direction  DOUBLE PRECISION,
    water_temp      DOUBLE PRECISION,
    air_temp        DOUBLE PRECISION,
    pressure        DOUBLE PRECISION
)
LANGUAGE sql STABLE
AS $$
    SELECT
        s.id            AS station_id,
        s.name          AS station_name,
        s.latitude,
        s.longitude,
        s.region,
        s.station_type,
        s.is_active,
        m.observed_at,
        m.wave_height,
        m.wind_speed,
        m.wind_direction,
        m.water_temp,
        m.air_temp,
        m.pressure
    FROM stations s
    LEFT JOIN LATERAL (
        SELECT *
        FROM measurements
        WHERE measurements.station_id = s.id
        ORDER BY observed_at DESC
        LIMIT 1
    ) m ON true
    WHERE s.is_active = true
    ORDER BY s.region, s.name;
$$;

-- ============================================================
-- 2. GET TIME SERIES FOR A SPECIFIC STATION
-- ============================================================
-- Returns the last N hours of measurements for a given station.
-- Used by the dashboard charts for time-series visualization.

CREATE OR REPLACE FUNCTION get_station_timeseries(
    p_station_id TEXT,
    p_hours INTEGER DEFAULT 48
)
RETURNS TABLE (
    observed_at     TIMESTAMPTZ,
    wave_height     DOUBLE PRECISION,
    dominant_period DOUBLE PRECISION,
    wind_speed      DOUBLE PRECISION,
    wind_direction  DOUBLE PRECISION,
    wind_gust       DOUBLE PRECISION,
    water_temp      DOUBLE PRECISION,
    air_temp        DOUBLE PRECISION,
    pressure        DOUBLE PRECISION,
    dewpoint        DOUBLE PRECISION
)
LANGUAGE sql STABLE
AS $$
    SELECT
        m.observed_at,
        m.wave_height,
        m.dominant_period,
        m.wind_speed,
        m.wind_direction,
        m.wind_gust,
        m.water_temp,
        m.air_temp,
        m.pressure,
        m.dewpoint
    FROM measurements m
    WHERE m.station_id = p_station_id
      AND m.observed_at >= now() - (p_hours || ' hours')::INTERVAL
    ORDER BY m.observed_at ASC;
$$;

-- ============================================================
-- 3. GET STATIONS BY BOUNDING BOX
-- ============================================================
-- Returns stations within a geographic bounding box.
-- Used for map viewport filtering.

CREATE OR REPLACE FUNCTION get_stations_in_bbox(
    p_min_lat DOUBLE PRECISION,
    p_min_lon DOUBLE PRECISION,
    p_max_lat DOUBLE PRECISION,
    p_max_lon DOUBLE PRECISION
)
RETURNS TABLE (
    station_id      TEXT,
    station_name    TEXT,
    latitude        DOUBLE PRECISION,
    longitude       DOUBLE PRECISION,
    region          TEXT,
    station_type    TEXT,
    water_temp      DOUBLE PRECISION,
    wave_height     DOUBLE PRECISION,
    wind_speed      DOUBLE PRECISION,
    observed_at     TIMESTAMPTZ
)
LANGUAGE sql STABLE
AS $$
    SELECT
        s.id            AS station_id,
        s.name          AS station_name,
        s.latitude,
        s.longitude,
        s.region,
        s.station_type,
        m.water_temp,
        m.wave_height,
        m.wind_speed,
        m.observed_at
    FROM stations s
    LEFT JOIN LATERAL (
        SELECT *
        FROM measurements
        WHERE measurements.station_id = s.id
        ORDER BY observed_at DESC
        LIMIT 1
    ) m ON true
    WHERE s.is_active = true
      AND s.latitude  BETWEEN p_min_lat AND p_max_lat
      AND s.longitude BETWEEN p_min_lon AND p_max_lon
    ORDER BY s.name;
$$;

-- ============================================================
-- 4. GET PIPELINE STATUS (OBSERVABILITY)
-- ============================================================
-- Returns the latest ingestion run status.

CREATE OR REPLACE FUNCTION get_pipeline_status()
RETURNS TABLE (
    last_run        TIMESTAMPTZ,
    status          TEXT,
    stations_count  INTEGER,
    measurements_count INTEGER,
    total_stations  BIGINT,
    total_measurements BIGINT,
    oldest_measurement TIMESTAMPTZ,
    newest_measurement TIMESTAMPTZ
)
LANGUAGE sql STABLE
AS $$
    SELECT
        il.started_at       AS last_run,
        il.status,
        il.stations_count,
        il.measurements_count,
        (SELECT count(*) FROM stations WHERE is_active)    AS total_stations,
        (SELECT count(*) FROM measurements)                AS total_measurements,
        (SELECT min(observed_at) FROM measurements)        AS oldest_measurement,
        (SELECT max(observed_at) FROM measurements)        AS newest_measurement
    FROM ingestion_log il
    ORDER BY il.started_at DESC
    LIMIT 1;
$$;

-- ============================================================
-- 5. CLEANUP OLD MEASUREMENTS
-- ============================================================
-- Deletes measurements older than N days to keep the database lean.
-- Call this periodically (e.g., weekly).

CREATE OR REPLACE FUNCTION cleanup_old_measurements(p_days INTEGER DEFAULT 30)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM measurements
    WHERE observed_at < now() - (p_days || ' days')::INTERVAL;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;
