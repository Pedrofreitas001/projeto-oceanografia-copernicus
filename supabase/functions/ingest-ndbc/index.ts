/**
 * Supabase Edge Function: ingest-ndbc
 * ====================================
 * Fetches latest observations from NOAA NDBC and upserts into Supabase.
 *
 * This is designed to be called by Supabase Cron (pg_cron) every hour.
 *
 * Deploy:
 *   supabase functions deploy ingest-ndbc --no-verify-jwt
 *
 * Test locally:
 *   supabase functions serve ingest-ndbc --no-verify-jwt
 *   curl http://localhost:54321/functions/v1/ingest-ndbc
 *
 * Schedule via Supabase Dashboard > Database > Extensions > pg_cron:
 *   SELECT cron.schedule('ingest-ndbc-hourly', '0 * * * *',
 *     $$SELECT net.http_post(
 *       url := 'https://YOUR_PROJECT.supabase.co/functions/v1/ingest-ndbc',
 *       headers := jsonb_build_object('Authorization', 'Bearer YOUR_SERVICE_KEY'),
 *       body := '{}'::jsonb
 *     )$$
 *   );
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const NDBC_LATEST_OBS_URL =
  "https://www.ndbc.noaa.gov/data/latest_obs/latest_obs.txt";
const NDBC_STATION_TABLE_URL =
  "https://www.ndbc.noaa.gov/data/stations/station_table.txt";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function safeFloat(val: string): number | null {
  if (!val || val.trim() === "MM" || val.trim() === "") return null;
  const f = parseFloat(val.trim());
  if (isNaN(f) || f === 99.0 || f === 999.0 || f === 9999.0) return null;
  return f;
}

function parseCoord(coord: string): number | null {
  const match = coord.match(/([\d.]+)\s*([NSEW])/i);
  if (!match) return null;
  let value = parseFloat(match[1]);
  const dir = match[2].toUpperCase();
  if (dir === "S" || dir === "W") value = -value;
  return value;
}

const REGION_MAP: Record<string, string> = {
  "41": "atlantic",
  "42": "gulf",
  "44": "atlantic",
  "45": "great_lakes",
  "46": "pacific",
  "51": "pacific",
  "52": "pacific",
};

function classifyRegion(stationId: string): string {
  for (const [prefix, region] of Object.entries(REGION_MAP)) {
    if (stationId.startsWith(prefix)) return region;
  }
  return "other";
}

// ---------------------------------------------------------------------------
// Parsers
// ---------------------------------------------------------------------------

interface StationRow {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  region: string;
  station_type: string;
  is_active: boolean;
}

interface MeasurementRow {
  station_id: string;
  observed_at: string;
  wind_direction: number | null;
  wind_speed: number | null;
  wind_gust: number | null;
  wave_height: number | null;
  dominant_period: number | null;
  wave_direction: number | null;
  pressure: number | null;
  air_temp: number | null;
  water_temp: number | null;
  dewpoint: number | null;
  visibility: number | null;
}

function parseStations(text: string): StationRow[] {
  const stations: StationRow[] = [];

  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("|--"))
      continue;

    const parts = trimmed
      .split("|")
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length < 4) continue;

    const stationId = parts[0];
    if (!/^\d{5}$/.test(stationId)) continue;

    const lat = parseCoord(parts[2]);
    const lon = parseCoord(parts[3]);
    if (lat === null || lon === null) continue;

    stations.push({
      id: stationId,
      name: parts[1].substring(0, 200),
      latitude: lat,
      longitude: lon,
      region: classifyRegion(stationId),
      station_type: "buoy",
      is_active: true,
    });
  }

  return stations;
}

function parseLatestObs(text: string): MeasurementRow[] {
  const measurements: MeasurementRow[] = [];

  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const parts = trimmed.split(/\s+/);
    if (parts.length < 19) continue;

    const stationId = parts[0];
    if (!/^\d{5}$/.test(stationId)) continue;

    try {
      const year = parseInt(parts[3]);
      const month = parseInt(parts[4]) - 1;
      const day = parseInt(parts[5]);
      const hour = parseInt(parts[6]);
      const minute = parseInt(parts[7]);
      const observedAt = new Date(Date.UTC(year, month, day, hour, minute));

      measurements.push({
        station_id: stationId,
        observed_at: observedAt.toISOString(),
        wind_direction: safeFloat(parts[8]),
        wind_speed: safeFloat(parts[9]),
        wind_gust: safeFloat(parts[10]),
        wave_height: safeFloat(parts[11]),
        dominant_period: safeFloat(parts[12]),
        wave_direction: safeFloat(parts[14]),
        pressure: safeFloat(parts[15]),
        air_temp: safeFloat(parts[16]),
        water_temp: safeFloat(parts[17]),
        dewpoint: safeFloat(parts[18]),
        visibility: parts.length > 19 ? safeFloat(parts[19]) : null,
      });
    } catch {
      continue;
    }
  }

  return measurements;
}

// ---------------------------------------------------------------------------
// Main Handler
// ---------------------------------------------------------------------------

Deno.serve(async (_req: Request) => {
  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    // Log the ingestion run
    const { data: logData } = await sb
      .from("ingestion_log")
      .insert({ status: "running", source: "ndbc-edge" })
      .select("id")
      .single();
    const logId = logData?.id;

    // 1. Fetch station metadata
    console.log("Fetching NDBC station list...");
    const stationResp = await fetch(NDBC_STATION_TABLE_URL);
    const stationText = await stationResp.text();
    const stations = parseStations(stationText);
    console.log(`Parsed ${stations.length} stations`);

    // Upsert stations in batches
    let stationsCount = 0;
    const STATION_BATCH = 200;
    for (let i = 0; i < stations.length; i += STATION_BATCH) {
      const batch = stations.slice(i, i + STATION_BATCH);
      await sb.from("stations").upsert(batch, { onConflict: "id" });
      stationsCount += batch.length;
    }

    // 2. Fetch latest observations
    console.log("Fetching NDBC latest observations...");
    const obsResp = await fetch(NDBC_LATEST_OBS_URL);
    const obsText = await obsResp.text();
    const measurements = parseLatestObs(obsText);
    console.log(`Parsed ${measurements.length} observations`);

    // Upsert measurements in batches
    let measurementsCount = 0;
    const MEAS_BATCH = 500;
    for (let i = 0; i < measurements.length; i += MEAS_BATCH) {
      const batch = measurements.slice(i, i + MEAS_BATCH);
      try {
        await sb
          .from("measurements")
          .upsert(batch, { onConflict: "station_id,observed_at" });
        measurementsCount += batch.length;
      } catch (e) {
        console.warn(`Batch upsert error (skipping): ${e}`);
      }
    }

    // Update log
    const elapsed = Date.now() - startTime;
    if (logId) {
      await sb
        .from("ingestion_log")
        .update({
          finished_at: new Date().toISOString(),
          status: "success",
          stations_count: stationsCount,
          measurements_count: measurementsCount,
        })
        .eq("id", logId);
    }

    const result = {
      ok: true,
      elapsed_ms: elapsed,
      stations_upserted: stationsCount,
      measurements_upserted: measurementsCount,
    };

    console.log("Ingestion complete:", result);

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error("Ingestion failed:", error);

    return new Response(
      JSON.stringify({
        ok: false,
        elapsed_ms: elapsed,
        error: String(error),
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
