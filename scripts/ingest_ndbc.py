"""
NOAA NDBC Data Ingestion Script
================================
Fetches real-time buoy station metadata and latest observations
from the National Data Buoy Center (NDBC) and upserts them into Supabase.

Data sources (plain text, no auth required):
  - Station list:       https://www.ndbc.noaa.gov/data/stations/station_table.txt
  - Latest observations: https://www.ndbc.noaa.gov/data/latest_obs/latest_obs.txt
  - Station realtime:    https://www.ndbc.noaa.gov/data/realtime2/{ID}.txt

Usage:
  pip install -r requirements.txt
  export SUPABASE_URL=https://your-project.supabase.co
  export SUPABASE_SERVICE_KEY=your-service-role-key
  python ingest_ndbc.py
"""

import os
import sys
import logging
import re
from datetime import datetime, timezone
from typing import Optional

import requests
from supabase import create_client, Client
from dotenv import load_dotenv

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")

NDBC_STATION_TABLE_URL = "https://www.ndbc.noaa.gov/data/stations/station_table.txt"
NDBC_LATEST_OBS_URL = "https://www.ndbc.noaa.gov/data/latest_obs/latest_obs.txt"
NDBC_REALTIME_BASE = "https://www.ndbc.noaa.gov/data/realtime2"

REQUEST_TIMEOUT = 30  # seconds

# Regions mapped by NDBC station ID prefix patterns
REGION_MAP = {
    "41": "atlantic",     # Western Atlantic
    "42": "gulf",         # Gulf of Mexico
    "44": "atlantic",     # Northeast US Atlantic
    "45": "great_lakes",  # Great Lakes
    "46": "pacific",      # Northeast Pacific
    "51": "pacific",      # Hawaii
    "52": "pacific",      # Pacific Islands
}

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger("ndbc_ingest")


# ---------------------------------------------------------------------------
# Supabase Client
# ---------------------------------------------------------------------------
def get_supabase() -> Client:
    if not SUPABASE_URL or not SUPABASE_KEY:
        log.error("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set.")
        sys.exit(1)
    return create_client(SUPABASE_URL, SUPABASE_KEY)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def safe_float(val: str) -> Optional[float]:
    """Parse a float, returning None for NDBC missing-value markers (e.g. 'MM', '99.0', '999')."""
    if not val or val.strip() in ("MM", ""):
        return None
    try:
        f = float(val.strip())
        # NDBC uses 99.0/999.0/9999.0 as missing values depending on field
        if f in (99.0, 999.0, 9999.0):
            return None
        return f
    except ValueError:
        return None


def classify_region(station_id: str) -> str:
    """Guess ocean region from the NDBC station ID prefix."""
    for prefix, region in REGION_MAP.items():
        if station_id.startswith(prefix):
            return region
    return "other"


# ---------------------------------------------------------------------------
# 1. Fetch & Parse Station Metadata
# ---------------------------------------------------------------------------
def fetch_stations() -> list[dict]:
    """
    Parses NDBC station_table.txt which has lines like:
      | 41001 | LLNR 815 - 150 NM East of Cape HATTERAS | 34.700 N | 72.700 W | ...
    Returns a list of station dicts.
    """
    log.info("Fetching station list from NDBC...")
    resp = requests.get(NDBC_STATION_TABLE_URL, timeout=REQUEST_TIMEOUT)
    resp.raise_for_status()

    stations = []
    for line in resp.text.splitlines():
        line = line.strip()
        if not line or line.startswith("#") or line.startswith("|--"):
            continue

        parts = [p.strip() for p in line.split("|") if p.strip()]
        if len(parts) < 4:
            continue

        station_id = parts[0].strip()
        # Skip header row
        if station_id.lower() in ("station", "stn"):
            continue
        # Only keep numeric station IDs (skip ship reports etc.)
        if not re.match(r"^\d{5}$", station_id):
            continue

        name = parts[1].strip() if len(parts) > 1 else ""

        # Parse latitude: "34.700 N" -> 34.7
        lat_str = parts[2].strip() if len(parts) > 2 else ""
        lon_str = parts[3].strip() if len(parts) > 3 else ""

        lat = parse_coord(lat_str)
        lon = parse_coord(lon_str)
        if lat is None or lon is None:
            continue

        stations.append({
            "id": station_id,
            "name": name[:200],  # Truncate long names
            "latitude": lat,
            "longitude": lon,
            "region": classify_region(station_id),
            "station_type": "buoy",
            "is_active": True,
        })

    log.info(f"Parsed {len(stations)} stations from NDBC.")
    return stations


def parse_coord(coord_str: str) -> Optional[float]:
    """Parse '34.700 N' or '72.700 W' into a signed float."""
    match = re.match(r"([\d.]+)\s*([NSEW])", coord_str, re.IGNORECASE)
    if not match:
        return None
    value = float(match.group(1))
    direction = match.group(2).upper()
    if direction in ("S", "W"):
        value = -value
    return value


# ---------------------------------------------------------------------------
# 2. Fetch & Parse Latest Observations
# ---------------------------------------------------------------------------
def fetch_latest_observations() -> list[dict]:
    """
    Parses NDBC latest_obs.txt which contains the most recent observation
    from every active station in a fixed-width text format.

    Header columns (space-separated):
    #STN  LAT    LON   YYYY MM DD hh mm  WDIR WSPD GST  WVHT  DPD  APD MWD  PRES  ATMP  WTMP  DEWP  VIS  TIDE
    """
    log.info("Fetching latest observations from NDBC...")
    resp = requests.get(NDBC_LATEST_OBS_URL, timeout=REQUEST_TIMEOUT)
    resp.raise_for_status()

    lines = resp.text.splitlines()
    measurements = []

    for line in lines:
        line = line.strip()
        if not line or line.startswith("#"):
            continue

        parts = line.split()
        if len(parts) < 19:
            continue

        station_id = parts[0]
        if not re.match(r"^\d{5}$", station_id):
            continue

        try:
            year = int(parts[3])
            month = int(parts[4])
            day = int(parts[5])
            hour = int(parts[6])
            minute = int(parts[7])
            observed_at = datetime(year, month, day, hour, minute, tzinfo=timezone.utc)
        except (ValueError, IndexError):
            continue

        measurements.append({
            "station_id": station_id,
            "observed_at": observed_at.isoformat(),
            "wind_direction": safe_float(parts[8]),
            "wind_speed": safe_float(parts[9]),
            "wind_gust": safe_float(parts[10]),
            "wave_height": safe_float(parts[11]),
            "dominant_period": safe_float(parts[12]),
            # parts[13] = APD (avg period), parts[14] = MWD (mean wave dir)
            "wave_direction": safe_float(parts[14]),
            "pressure": safe_float(parts[15]),
            "air_temp": safe_float(parts[16]),
            "water_temp": safe_float(parts[17]),
            "dewpoint": safe_float(parts[18]),
            "visibility": safe_float(parts[19]) if len(parts) > 19 else None,
        })

    log.info(f"Parsed {len(measurements)} latest observations.")
    return measurements


# ---------------------------------------------------------------------------
# 3. Fetch Historical Realtime Data for a Station (last 45 days)
# ---------------------------------------------------------------------------
def fetch_station_realtime(station_id: str) -> list[dict]:
    """
    Fetches the realtime2 .txt file for a specific station.
    Contains ~45 days of hourly observations.
    """
    url = f"{NDBC_REALTIME_BASE}/{station_id}.txt"
    try:
        resp = requests.get(url, timeout=REQUEST_TIMEOUT)
        if resp.status_code != 200:
            return []
    except requests.RequestException:
        return []

    lines = resp.text.splitlines()
    measurements = []

    for line in lines:
        line = line.strip()
        if not line or line.startswith("#"):
            continue

        parts = line.split()
        if len(parts) < 17:
            continue

        try:
            year = int(parts[0])
            month = int(parts[1])
            day = int(parts[2])
            hour = int(parts[3])
            minute = int(parts[4])
            observed_at = datetime(year, month, day, hour, minute, tzinfo=timezone.utc)
        except (ValueError, IndexError):
            continue

        measurements.append({
            "station_id": station_id,
            "observed_at": observed_at.isoformat(),
            "wind_direction": safe_float(parts[5]),
            "wind_speed": safe_float(parts[6]),
            "wind_gust": safe_float(parts[7]),
            "wave_height": safe_float(parts[8]),
            "dominant_period": safe_float(parts[9]),
            "wave_direction": safe_float(parts[11]) if len(parts) > 11 else None,
            "pressure": safe_float(parts[12]) if len(parts) > 12 else None,
            "air_temp": safe_float(parts[13]) if len(parts) > 13 else None,
            "water_temp": safe_float(parts[14]) if len(parts) > 14 else None,
            "dewpoint": safe_float(parts[15]) if len(parts) > 15 else None,
            "visibility": safe_float(parts[16]) if len(parts) > 16 else None,
        })

    return measurements


# ---------------------------------------------------------------------------
# 4. Upsert to Supabase
# ---------------------------------------------------------------------------
def upsert_stations(sb: Client, stations: list[dict]) -> int:
    """Upsert station metadata. Returns count of upserted rows."""
    if not stations:
        return 0

    # Upsert in batches of 200
    batch_size = 200
    total = 0
    for i in range(0, len(stations), batch_size):
        batch = stations[i : i + batch_size]
        sb.table("stations").upsert(batch, on_conflict="id").execute()
        total += len(batch)
        log.info(f"  Upserted stations batch: {total}/{len(stations)}")

    return total


def upsert_measurements(sb: Client, measurements: list[dict]) -> int:
    """Upsert measurements. Returns count of upserted rows."""
    if not measurements:
        return 0

    # Filter out measurements without a valid station_id
    valid = [m for m in measurements if m.get("station_id")]

    # Upsert in batches of 500
    batch_size = 500
    total = 0
    for i in range(0, len(valid), batch_size):
        batch = valid[i : i + batch_size]
        try:
            sb.table("measurements").upsert(
                batch,
                on_conflict="station_id,observed_at"
            ).execute()
            total += len(batch)
        except Exception as e:
            log.warning(f"  Batch upsert error (skipping): {e}")
            # Try individual inserts for this batch
            for m in batch:
                try:
                    sb.table("measurements").upsert(
                        m,
                        on_conflict="station_id,observed_at"
                    ).execute()
                    total += 1
                except Exception:
                    pass  # Skip orphan measurements (station not in DB)

        if total % 1000 == 0 or i + batch_size >= len(valid):
            log.info(f"  Upserted measurements: {total}/{len(valid)}")

    return total


# ---------------------------------------------------------------------------
# 5. Main Pipeline
# ---------------------------------------------------------------------------
def run_pipeline(fetch_historical: bool = False, historical_stations: list[str] | None = None):
    """
    Main ingestion pipeline.

    Args:
        fetch_historical: If True, also fetch 45-day realtime data for select stations.
        historical_stations: List of station IDs to fetch historical data for.
                             If None and fetch_historical is True, uses a default set.
    """
    sb = get_supabase()
    log.info("=" * 60)
    log.info("NDBC Data Ingestion Pipeline - Starting")
    log.info("=" * 60)

    # Log the ingestion run
    log_entry = sb.table("ingestion_log").insert({
        "status": "running",
        "source": "ndbc",
    }).execute()
    log_id = log_entry.data[0]["id"] if log_entry.data else None

    try:
        # Step 1: Fetch and upsert stations
        stations = fetch_stations()
        stations_count = upsert_stations(sb, stations)

        # Step 2: Fetch and upsert latest observations
        observations = fetch_latest_observations()
        obs_count = upsert_measurements(sb, observations)

        # Step 3 (optional): Fetch historical data for key stations
        hist_count = 0
        if fetch_historical:
            target_stations = historical_stations or [
                "41001", "41002", "41004", "41008", "41009",  # Atlantic
                "42001", "42002", "42003", "42019", "42020",  # Gulf
                "44013", "44017", "44025",                     # NE Atlantic
                "46001", "46005", "46011", "46025", "46042",  # Pacific
                "51001", "51002", "51003",                     # Hawaii
            ]
            log.info(f"Fetching historical data for {len(target_stations)} stations...")
            for sid in target_stations:
                hist = fetch_station_realtime(sid)
                if hist:
                    count = upsert_measurements(sb, hist)
                    hist_count += count
                    log.info(f"  Station {sid}: {count} historical records")

        total_measurements = obs_count + hist_count

        # Update ingestion log
        if log_id:
            sb.table("ingestion_log").update({
                "finished_at": datetime.now(timezone.utc).isoformat(),
                "status": "success",
                "stations_count": stations_count,
                "measurements_count": total_measurements,
            }).eq("id", log_id).execute()

        log.info("=" * 60)
        log.info(f"Pipeline Complete!")
        log.info(f"  Stations upserted:       {stations_count}")
        log.info(f"  Latest observations:     {obs_count}")
        log.info(f"  Historical measurements: {hist_count}")
        log.info(f"  Total measurements:      {total_measurements}")
        log.info("=" * 60)

    except Exception as e:
        log.error(f"Pipeline failed: {e}")
        if log_id:
            sb.table("ingestion_log").update({
                "finished_at": datetime.now(timezone.utc).isoformat(),
                "status": "error",
                "error_message": str(e)[:500],
            }).eq("id", log_id).execute()
        raise


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="NOAA NDBC data ingestion pipeline")
    parser.add_argument(
        "--historical",
        action="store_true",
        help="Also fetch 45-day historical data for key stations",
    )
    parser.add_argument(
        "--stations",
        nargs="*",
        help="Specific station IDs to fetch historical data for",
    )
    args = parser.parse_args()

    run_pipeline(
        fetch_historical=args.historical,
        historical_stations=args.stations,
    )
