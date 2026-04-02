import { useState, useEffect, useCallback, useRef } from "react";
import { fetchHorizons } from "../services/nasaApi";
import { getMockData } from "../services/mockData";

const POLL_INTERVAL_MS = 30_000; // 30 seconds

// Mission start: April 2, 2026 00:00:00 UTC
const MISSION_START = new Date("2026-04-02T00:00:00Z");

/**
 * useMissionData — fetches Artemis II telemetry every 30 seconds.
 *
 * Strategy:
 *   1. Try JPL Horizons (live data, no API key needed).
 *   2. If Horizons returns nothing (mission not launched / rate-limited),
 *      fall back to the mock trajectory generator.
 *
 * Returns:
 *   { velocity, distanceToEarth, distanceToMoon, dataSource, status, lastUpdated }
 */
export function useMissionData() {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading"); // "loading" | "live" | "mock" | "error"
  const [lastUpdated, setLastUpdated] = useState(null);
  const timerRef = useRef(null);

  const fetchData = useCallback(async () => {
    try {
      // Attempt live Horizons fetch
      const live = await fetchHorizons();

      if (live) {
        // Live data available — derive distanceToMoon from Earth distance
        const distanceToMoon = Math.max(
          0,
          384_400 - live.distanceToEarth
        );
        setData({ ...live, distanceToMoon, dataSource: "live" });
        setStatus("live");
      } else {
        // Fall back to mock trajectory
        const mock = getMockData(MISSION_START);
        setData(mock);
        setStatus("mock");
      }

      setLastUpdated(new Date());
    } catch (err) {
      console.error("[useMissionData] fetch error:", err);
      // Even on unexpected error, keep showing mock data
      const mock = getMockData(MISSION_START);
      setData(mock);
      setStatus("mock");
      setLastUpdated(new Date());
    }
  }, []);

  useEffect(() => {
    // Initial fetch immediately
    fetchData();

    // Then poll every 30 seconds
    timerRef.current = setInterval(fetchData, POLL_INTERVAL_MS);

    return () => {
      clearInterval(timerRef.current);
    };
  }, [fetchData]);

  return { data, status, lastUpdated };
}
