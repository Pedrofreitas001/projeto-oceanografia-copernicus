# Ocean Data Pipeline — NOAA NDBC

End-to-end data pipeline that ingests real-time buoy data from the National Data Buoy Center into Supabase and serves it to a React dashboard.

---

## Architecture

```
NOAA NDBC (public text files)
        │
        ▼
  ┌─────────────┐
  │  Ingestion   │  Python script OR Supabase Edge Function
  │  (hourly)    │  Parses station_table.txt + latest_obs.txt
  └──────┬───────┘
         │  UPSERT
         ▼
  ┌─────────────┐
  │  Supabase    │  PostgreSQL: stations, measurements, ingestion_log
  │  Database    │  RPC Functions: get_stations_with_latest(), etc.
  └──────┬───────┘
         │  REST / RPC
         ▼
  ┌─────────────┐
  │  React App   │  Leaflet map + Recharts dashboards
  │  (Vite)      │  @supabase/supabase-js client
  └─────────────┘
```

---

## 1. Setup Supabase

### Create Project
1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Create a new project
3. Note down:
   - **Project URL**: `https://xxx.supabase.co`
   - **anon (public) key**: for the frontend
   - **service_role key**: for the ingestion script (never expose in frontend)

### Run Migrations
In the Supabase SQL Editor, execute these files in order:

```
supabase/migrations/001_create_ocean_schema.sql
supabase/migrations/002_create_rpc_functions.sql
```

Or if using the Supabase CLI:
```bash
supabase db push
```

---

## 2. Data Ingestion

### Option A: Python Script (Recommended for initial load)

```bash
cd scripts/
pip install -r requirements.txt

# Set environment variables
export SUPABASE_URL=https://your-project.supabase.co
export SUPABASE_SERVICE_KEY=your-service-role-key

# Run: latest observations only (fast, ~30 seconds)
python ingest_ndbc.py

# Run: with 45-day historical data for key stations (~5 minutes)
python ingest_ndbc.py --historical

# Run: historical data for specific stations
python ingest_ndbc.py --historical --stations 41001 46042 51001
```

### Option B: Supabase Edge Function (for ongoing hourly updates)

```bash
# Deploy
supabase functions deploy ingest-ndbc --no-verify-jwt

# Test
curl https://your-project.supabase.co/functions/v1/ingest-ndbc \
  -H "Authorization: Bearer YOUR_SERVICE_KEY"
```

---

## 3. Scheduling (Hourly Updates)

### Option A: pg_cron (Supabase built-in)
Enable the `pg_cron` and `pg_net` extensions in your Supabase dashboard, then run:

```sql
-- Schedule the Edge Function to run every hour
SELECT cron.schedule(
  'ingest-ndbc-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT.supabase.co/functions/v1/ingest-ndbc',
    headers := jsonb_build_object(
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  )
  $$
);

-- Verify it's scheduled
SELECT * FROM cron.job;

-- Clean old measurements weekly (keep 30 days)
SELECT cron.schedule(
  'cleanup-old-data',
  '0 3 * * 0',
  $$ SELECT cleanup_old_measurements(30) $$
);
```

### Option B: External Cron (GitHub Actions)
Create `.github/workflows/ingest.yml`:

```yaml
name: NDBC Ingestion
on:
  schedule:
    - cron: '0 * * * *'  # every hour
  workflow_dispatch: {}   # manual trigger

jobs:
  ingest:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - run: pip install -r scripts/requirements.txt
      - run: python scripts/ingest_ndbc.py
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
```

### Option C: System Crontab
```bash
# Edit crontab
crontab -e

# Add this line (runs every hour at minute 0)
0 * * * * cd /path/to/project && SUPABASE_URL=xxx SUPABASE_SERVICE_KEY=yyy /usr/bin/python3 scripts/ingest_ndbc.py >> /tmp/ndbc_ingest.log 2>&1
```

---

## 4. API Queries

### REST API (direct table access)

```bash
# Get all active stations
curl 'https://YOUR_PROJECT.supabase.co/rest/v1/stations?is_active=eq.true&order=name' \
  -H 'apikey: YOUR_ANON_KEY'

# Get latest 10 measurements for a station
curl 'https://YOUR_PROJECT.supabase.co/rest/v1/measurements?station_id=eq.41001&order=observed_at.desc&limit=10' \
  -H 'apikey: YOUR_ANON_KEY'

# Get Atlantic stations only
curl 'https://YOUR_PROJECT.supabase.co/rest/v1/stations?region=eq.atlantic&is_active=eq.true' \
  -H 'apikey: YOUR_ANON_KEY'
```

### RPC Functions

```bash
# All stations with latest measurement
curl -X POST 'https://YOUR_PROJECT.supabase.co/rest/v1/rpc/get_stations_with_latest' \
  -H 'apikey: YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{}'

# Time series for station 41001 (last 24 hours)
curl -X POST 'https://YOUR_PROJECT.supabase.co/rest/v1/rpc/get_station_timeseries' \
  -H 'apikey: YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"p_station_id": "41001", "p_hours": 24}'

# Stations in bounding box (Gulf of Mexico)
curl -X POST 'https://YOUR_PROJECT.supabase.co/rest/v1/rpc/get_stations_in_bbox' \
  -H 'apikey: YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"p_min_lat": 18, "p_min_lon": -98, "p_max_lat": 31, "p_max_lon": -80}'

# Pipeline status
curl -X POST 'https://YOUR_PROJECT.supabase.co/rest/v1/rpc/get_pipeline_status' \
  -H 'apikey: YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

### JavaScript Client (React)

```typescript
import { supabase } from './services/supabase';

// All stations with latest data
const { data } = await supabase.rpc('get_stations_with_latest');

// Time series
const { data } = await supabase.rpc('get_station_timeseries', {
  p_station_id: '41001',
  p_hours: 48
});

// Stations in viewport
const { data } = await supabase.rpc('get_stations_in_bbox', {
  p_min_lat: 18, p_min_lon: -98,
  p_max_lat: 31, p_max_lon: -80
});
```

---

## 5. Sample JSON Responses

### `get_stations_with_latest()`

```json
[
  {
    "station_id": "41001",
    "station_name": "LLNR 815 - 150 NM East of Cape HATTERAS",
    "latitude": 34.7,
    "longitude": -72.7,
    "region": "atlantic",
    "station_type": "buoy",
    "is_active": true,
    "observed_at": "2026-02-19T14:00:00+00:00",
    "wave_height": 2.1,
    "wind_speed": 7.3,
    "wind_direction": 220,
    "water_temp": 22.4,
    "air_temp": 19.1,
    "pressure": 1015.2
  },
  {
    "station_id": "46042",
    "station_name": "LLNR 198 - MONTEREY",
    "latitude": 36.8,
    "longitude": -122.4,
    "region": "pacific",
    "station_type": "buoy",
    "is_active": true,
    "observed_at": "2026-02-19T14:00:00+00:00",
    "wave_height": 1.8,
    "wind_speed": 5.1,
    "wind_direction": 310,
    "water_temp": 13.2,
    "air_temp": 11.8,
    "pressure": 1018.7
  }
]
```

### `get_station_timeseries("41001", 24)`

```json
[
  {
    "observed_at": "2026-02-18T15:00:00+00:00",
    "wave_height": 1.9,
    "dominant_period": 8.0,
    "wind_speed": 6.2,
    "wind_direction": 210,
    "wind_gust": 8.1,
    "water_temp": 22.1,
    "air_temp": 18.5,
    "pressure": 1014.8,
    "dewpoint": 16.2
  },
  {
    "observed_at": "2026-02-18T16:00:00+00:00",
    "wave_height": 2.0,
    "dominant_period": 8.5,
    "wind_speed": 6.8,
    "wind_direction": 215,
    "wind_gust": 9.0,
    "water_temp": 22.3,
    "air_temp": 18.9,
    "pressure": 1015.0,
    "dewpoint": 16.4
  }
]
```

### `get_pipeline_status()`

```json
[
  {
    "last_run": "2026-02-19T14:00:02+00:00",
    "status": "success",
    "stations_count": 312,
    "measurements_count": 298,
    "total_stations": 312,
    "total_measurements": 14256,
    "oldest_measurement": "2026-01-20T00:00:00+00:00",
    "newest_measurement": "2026-02-19T14:00:00+00:00"
  }
]
```

---

## 6. Frontend Integration

### Install Supabase Client

```bash
npm install @supabase/supabase-js
```

### Environment Variables (.env.local)

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Quick Integration (add to existing App.tsx)

The NDBC dashboard is available as a new page. To add it as a view:

```tsx
// In App.tsx - add to ViewState type
export type ViewState = 'dashboard' | 'anomalies' | 'ndbc';

// In the render, add:
import { NDBCDashboard } from './pages/NDBCDashboard';

// In the view switch:
{currentView === 'ndbc' && <NDBCDashboard />}
```

### Files Created

| File | Purpose |
|------|---------|
| `services/supabase.ts` | Shared Supabase client instance |
| `services/ndbc.ts` | NDBC data service (wraps Supabase RPC calls) |
| `hooks/useNDBCStations.ts` | Hook: fetch all stations with latest data |
| `hooks/useNDBCTimeseries.ts` | Hook: fetch time-series for one station |
| `components/NDBCStationMap.tsx` | Map component with NDBC markers + popups |
| `pages/NDBCDashboard.tsx` | Full dashboard page (KPIs + map + charts) |

---

## 7. Data Flow Summary

```
Every hour:
  1. Ingestion script fetches NDBC station_table.txt (~300 stations)
  2. Upserts into `stations` table (dedup by station ID)
  3. Fetches NDBC latest_obs.txt (~300 observations)
  4. Upserts into `measurements` table (dedup by station_id + timestamp)
  5. Logs run to `ingestion_log` table

On page load:
  1. React calls supabase.rpc('get_stations_with_latest')
  2. Returns all stations + their most recent observation (LATERAL JOIN)
  3. Map renders colored markers (color = water temperature)
  4. User clicks station → calls get_station_timeseries()
  5. Dashboard renders time-series charts with Recharts
```

---

## 8. NOAA NDBC Data Sources

All public, no authentication required:

| URL | Content | Format |
|-----|---------|--------|
| `ndbc.noaa.gov/data/stations/station_table.txt` | Station metadata | Pipe-delimited text |
| `ndbc.noaa.gov/data/latest_obs/latest_obs.txt` | Latest observation per station | Space-delimited text |
| `ndbc.noaa.gov/data/realtime2/{ID}.txt` | 45-day hourly history | Space-delimited text |

### Variables Available

| Variable | Unit | Column in latest_obs.txt |
|----------|------|--------------------------|
| Wind Direction | degrees | WDIR |
| Wind Speed | m/s | WSPD |
| Wind Gust | m/s | GST |
| Wave Height | m | WVHT |
| Dominant Period | s | DPD |
| Mean Wave Direction | degrees | MWD |
| Sea Level Pressure | hPa | PRES |
| Air Temperature | °C | ATMP |
| Water Temperature | °C | WTMP |
| Dewpoint | °C | DEWP |
| Visibility | nautical miles | VIS |
