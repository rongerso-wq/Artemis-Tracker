import React, { useState, useEffect } from "react";

const MISSION_START = new Date("2026-04-02T00:00:00Z");

function pad(n, digits = 2) {
  return String(n).padStart(digits, "0");
}

function getElapsed() {
  const now  = new Date();
  const diff = Math.max(0, Math.floor((now - MISSION_START) / 1000));
  return {
    days:    Math.floor(diff / 86400),
    hours:   Math.floor((diff % 86400) / 3600),
    minutes: Math.floor((diff % 3600) / 60),
    seconds: diff % 60,
  };
}

/**
 * MissionClock
 * @param {object} props.met — optional MET from useArtemisData (mock/TLI override).
 *   If omitted, the clock ticks independently from wall-clock time.
 */
export default function MissionClock({ met }) {
  const [wallElapsed, setWallElapsed] = useState(getElapsed());

  useEffect(() => {
    // Always tick the wall clock so the display stays live even without a prop
    const id = setInterval(() => setWallElapsed(getElapsed()), 1000);
    return () => clearInterval(id);
  }, []);

  // Prefer hook-provided MET (enables TLI preview / mock offset);
  // fall back to wall-clock when hook hasn't resolved yet.
  const elapsed = (met && met.totalSeconds != null) ? met : wallElapsed;

  const segments = [
    { label: "DAYS", value: pad(elapsed.days, 3) },
    { label: "HRS",  value: pad(elapsed.hours) },
    { label: "MIN",  value: pad(elapsed.minutes) },
    { label: "SEC",  value: pad(elapsed.seconds) },
  ];

  return (
    <div
      className="card-hover glow-border scanline rounded-xl p-6 col-span-full relative"
      style={{ backgroundColor: "#0a1628", border: "1px solid #1a3a5c" }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">⏱</span>
        <span
          className="text-xs uppercase tracking-widest font-bold"
          style={{ color: "#4a7fa5", fontFamily: "'Orbitron', monospace" }}
        >
          Mission Elapsed Time
        </span>
        {/* Live indicator */}
        <div className="ml-auto flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: "#39ff14",
              boxShadow: "0 0 8px #39ff14",
              animation: "blink 1.5s ease-in-out infinite",
            }}
          />
          <span className="text-xs" style={{ color: "#39ff14" }}>LIVE</span>
        </div>
      </div>

      {/* Clock segments */}
      <div className="flex justify-center gap-4 md:gap-8">
        {segments.map((seg, i) => (
          <React.Fragment key={seg.label}>
            <div className="flex flex-col items-center">
              <span
                className="text-4xl sm:text-5xl md:text-6xl font-black tabular-nums leading-none"
                style={{
                  color: "#00d4ff",
                  fontFamily: "'Orbitron', monospace",
                  textShadow: "0 0 20px #00d4ff88, 0 0 40px #00d4ff44",
                }}
              >
                {seg.value}
              </span>
              <span
                className="text-xs mt-2 tracking-widest"
                style={{ color: "#4a7fa5", fontFamily: "'Orbitron', monospace" }}
              >
                {seg.label}
              </span>
            </div>
            {/* Separator */}
            {i < segments.length - 1 && (
              <span
                className="text-4xl md:text-5xl font-bold self-start mt-1 blink"
                style={{ color: "#00d4ff88", fontFamily: "'Orbitron', monospace" }}
              >
                :
              </span>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Launch date reference */}
      <div className="mt-6 flex justify-center">
        <span
          className="text-xs px-4 py-1 rounded-full uppercase tracking-widest"
          style={{
            border: "1px solid #1a3a5c",
            color: "#2a4a6a",
            backgroundColor: "#050d1a",
            fontFamily: "'Orbitron', monospace",
          }}
        >
          L+ 2026-04-02 · 00:00:00 UTC
        </span>
      </div>

      {/* Bottom accent */}
      <div
        className="absolute bottom-0 left-6 right-6 h-px rounded-full"
        style={{ background: "linear-gradient(90deg, transparent, #00d4ff44, transparent)" }}
      />
    </div>
  );
}
