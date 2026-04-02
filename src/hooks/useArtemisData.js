import { useState, useEffect, useCallback, useRef } from "react";
import { fetchHorizons } from "../services/nasaApi";
import { getMockData, decomposeMET, getPhase } from "../services/mockData";

// Mission start: April 2, 2026 00:00:00 UTC
export const MISSION_START = new Date("2026-04-02T00:00:00Z");

const DEFAULT_POLL_MS = 30_000;

/**
 * useArtemisData — primary telemetry hook for the Artemis II dashboard.
 *
 * Data strategy (in priority order):
 *   1. NASA JPL Horizons API  — live geocentric state vectors for spacecraft -1024.
 *      (AROW does not expose a public JSON endpoint; Horizons carries the same data.)
 *   2. Mock trajectory        — activated when Horizons returns no data, or when
 *      `mockMode` is forced. Simulates the planned free-return trajectory including
 *      the TLI burn.
 *
 * @param {object}  options
 * @param {boolean} options.mockMode      — force mock data regardless of API availability
 * @param {boolean} options.tliImminent   — (mock only) offset clock so TLI burn is ~3 min away
 * @param {number}  options.pollMs        — polling interval in ms (default: 30 000)
 *
 * @returns {ArtemisSnapshot}
 *
 * ArtemisSnapshot shape:
 * {
 *   met: {
 *     days: number, hours: number, minutes: number,
 *     seconds: number, totalSeconds: number
 *   },
 *   velocity:          number,   // km/s  — scalar magnitude
 *   distanceFromEarth: number,   // km    — geocentric distance
 *   distanceToMoon:    number,   // km    — approximate lunar distance
 *   stateVector: {
 *     position: { x, y, z },    // km    — geocentric J2000
 *     velocity: { x, y, z },    // km/s  — geocentric J2000
 *   },
 *   phase: string,               // mission phase label (see getPhase)
 *   dataSource: "live" | "mock",
 *   status:     "loading" | "live" | "mock" | "error",
 *   lastUpdated: Date | null,
 *   error: string | null,
 * }
 */
export function useArtemisData({
  mockMode     = false,
  tliImminent  = false,
  pollMs       = DEFAULT_POLL_MS,
  missionStart = MISSION_START,
} = {}) {
  const [snapshot, setSnapshot] = useState(null);
  const [status,   setStatus]   = useState("loading");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error,    setError]    = useState(null);
  const timerRef = useRef(null);

  const fetchData = useCallback(async () => {
    try {
      // ── Mock mode: skip API entirely ────────────────────────────────────────
      if (mockMode) {
        const mock = getMockData(missionStart, tliImminent);
        setSnapshot(buildSnapshot(mock, "mock"));
        setStatus("mock");
        setLastUpdated(new Date());
        setError(null);
        return;
      }

      // ── Attempt live fetch from JPL Horizons ────────────────────────────────
      const live = await fetchHorizons();

      if (live) {
        // Horizons returns scalars + stateVector; compute MET and phase on client
        const elapsedSec = Math.max(
          0,
          Math.floor((Date.now() - missionStart.getTime()) / 1_000)
        );
        const enriched = {
          ...live,
          met:    decomposeMET(elapsedSec),
          phase:  getPhase(elapsedSec),
          dataSource: "live",
        };
        setSnapshot(buildSnapshot(enriched, "live"));
        setStatus("live");
        setError(null);
      } else {
        // Horizons unavailable — fall back to mock trajectory
        const mock = getMockData(missionStart, tliImminent);
        setSnapshot(buildSnapshot(mock, "mock"));
        setStatus("mock");
        setError("JPL Horizons unavailable — showing simulated trajectory");
      }

      setLastUpdated(new Date());
    } catch (err) {
      console.error("[useArtemisData]", err);
      // Always keep the dashboard running; never show a blank screen
      const mock = getMockData(missionStart, tliImminent);
      setSnapshot(buildSnapshot(mock, "mock"));
      setStatus("error");
      setError(err.message ?? "Unknown error");
      setLastUpdated(new Date());
    }
  }, [mockMode, tliImminent, missionStart]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchData();
    timerRef.current = setInterval(fetchData, pollMs);
    return () => clearInterval(timerRef.current);
  }, [fetchData, pollMs]);

  return { ...snapshot, status, lastUpdated, error };
}

// ── Internal helpers ──────────────────────────────────────────────────────────

/**
 * Normalise any raw telemetry object into the canonical ArtemisSnapshot shape.
 * Handles both live (Horizons) and mock payloads safely.
 */
function buildSnapshot(raw, source) {
  return {
    met:               raw.met               ?? zeroDuration(),
    velocity:          raw.velocity          ?? 0,
    distanceFromEarth: raw.distanceFromEarth ?? 0,
    distanceToMoon:    raw.distanceToMoon    ?? 0,
    stateVector:       raw.stateVector       ?? nullVector(),
    phase:             raw.phase             ?? "UNKNOWN",
    dataSource:        source,
  };
}

function zeroDuration() {
  return { days: 0, hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 };
}

function nullVector() {
  return {
    position: { x: 0, y: 0, z: 0 },
    velocity: { x: 0, y: 0, z: 0 },
  };
}
