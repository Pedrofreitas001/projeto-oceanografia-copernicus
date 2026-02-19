-- ============================================================
-- NOAA NDBC Ocean Data Pipeline - Database Schema
-- ============================================================
-- This migration creates the core tables for ingesting and
-- serving real-time buoy data from the National Data Buoy Center.
-- ============================================================

-- Enable PostGIS if available (optional, for spatial queries)
-- CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================================
-- 1. STATIONS TABLE
-- ============================================================
-- Stores metadata for each NOAA NDBC buoy station.
-- Station IDs come directly from NDBC (e.g., "41001", "46042").

CREATE TABLE IF NOT EXISTS stations (
    id          TEXT PRIMARY KEY,           -- NDBC station ID (e.g. "41001")
    name        TEXT NOT NULL DEFAULT '',   -- Human-readable name
    latitude    DOUBLE PRECISION NOT NULL,
    longitude   DOUBLE PRECISION NOT NULL,
    region      TEXT NOT NULL DEFAULT 'unknown',  -- atlantic, pacific, gulf, great_lakes, etc.
    station_type TEXT DEFAULT 'buoy',       -- buoy, fixed, ship, dart
    owner       TEXT DEFAULT '',            -- Station owner/operator
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for spatial queries (bounding box lookups)
CREATE INDEX IF NOT EXISTS idx_stations_coords
    ON stations (latitude, longitude);

CREATE INDEX IF NOT EXISTS idx_stations_region
    ON stations (region);

CREATE INDEX IF NOT EXISTS idx_stations_active
    ON stations (is_active) WHERE is_active = true;

-- ============================================================
-- 2. MEASUREMENTS TABLE
-- ============================================================
-- Stores time-series observation data from each station.
-- One row per station per observation timestamp.

CREATE TABLE IF NOT EXISTS measurements (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    station_id      TEXT NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
    observed_at     TIMESTAMPTZ NOT NULL,       -- Observation timestamp from NDBC
    -- Wave data
    wave_height     DOUBLE PRECISION,           -- Significant wave height (m)
    dominant_period DOUBLE PRECISION,           -- Dominant wave period (s)
    wave_direction  DOUBLE PRECISION,           -- Mean wave direction (deg)
    -- Wind data
    wind_speed      DOUBLE PRECISION,           -- Wind speed (m/s)
    wind_direction  DOUBLE PRECISION,           -- Wind direction (deg)
    wind_gust       DOUBLE PRECISION,           -- Wind gust (m/s)
    -- Temperature & Pressure
    water_temp      DOUBLE PRECISION,           -- Sea surface temperature (°C)
    air_temp        DOUBLE PRECISION,           -- Air temperature (°C)
    pressure        DOUBLE PRECISION,           -- Sea level pressure (hPa)
    -- Visibility & other
    dewpoint        DOUBLE PRECISION,           -- Dewpoint temperature (°C)
    visibility      DOUBLE PRECISION,           -- Visibility (nautical miles)
    -- Metadata
    ingested_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Prevent duplicate observations per station
CREATE UNIQUE INDEX IF NOT EXISTS idx_measurements_station_time
    ON measurements (station_id, observed_at);

-- Fast lookups for recent data
CREATE INDEX IF NOT EXISTS idx_measurements_observed
    ON measurements (observed_at DESC);

-- Fast lookups for station time series
CREATE INDEX IF NOT EXISTS idx_measurements_station_observed
    ON measurements (station_id, observed_at DESC);

-- ============================================================
-- 3. INGESTION LOG TABLE
-- ============================================================
-- Tracks each ingestion run for observability.

CREATE TABLE IF NOT EXISTS ingestion_log (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    finished_at     TIMESTAMPTZ,
    status          TEXT NOT NULL DEFAULT 'running',  -- running, success, error
    stations_count  INTEGER DEFAULT 0,
    measurements_count INTEGER DEFAULT 0,
    error_message   TEXT,
    source          TEXT DEFAULT 'ndbc'               -- ndbc, manual, etc.
);

-- ============================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================
-- Enable RLS but allow public read access (this is public data).

ALTER TABLE stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingestion_log ENABLE ROW LEVEL SECURITY;

-- Public read access for all tables
CREATE POLICY "Public read access on stations"
    ON stations FOR SELECT
    USING (true);

CREATE POLICY "Public read access on measurements"
    ON measurements FOR SELECT
    USING (true);

CREATE POLICY "Public read access on ingestion_log"
    ON ingestion_log FOR SELECT
    USING (true);

-- Service role can write (for ingestion scripts)
CREATE POLICY "Service role can insert stations"
    ON stations FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Service role can update stations"
    ON stations FOR UPDATE
    USING (true);

CREATE POLICY "Service role can insert measurements"
    ON measurements FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Service role can insert ingestion_log"
    ON ingestion_log FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Service role can update ingestion_log"
    ON ingestion_log FOR UPDATE
    USING (true);

-- ============================================================
-- 5. UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER stations_updated_at
    BEFORE UPDATE ON stations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
