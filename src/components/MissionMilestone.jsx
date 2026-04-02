import React, { useState, useEffect } from "react";
import { MISSION_TIMES } from "../services/mockData";

const MISSION_START = new Date("2026-04-02T00:00:00Z");

// All major milestones: { label, t, icon }
const MILESTONES = [
  { key: "LAUNCH",          label: "Launch",                   icon: "🚀", t: MISSION_TIMES.LAUNCH        },
  { key: "PARKING_ORBIT",   label: "Parking Orbit Achieved",   icon: "🛰", t: MISSION_TIMES.PARKING_ORBIT },
  { key: "TLI_BURN",        label: "Trans-Lunar Injection",    icon: "⚡", t: MISSION_TIMES.TLI_START     },
  { key: "TLI_COMPLETE",    label: "TLI Burn Complete",        icon: "✅", t: MISSION_TIMES.TLI_END       },
  { key: "LUNAR_APPROACH",  label: "Lunar Flyby",              icon: "🌑", t: MISSION_TIMES.FLYBY         },
  { key: "REENTRY",         label: "Re-Entry Interface",       icon: "🔥", t: MISSION_TIMES.REENTRY_START },
  { key: "SPLASHDOWN",      label: "Splashdown",               icon: "🌊", t: MISSION_TIMES.SPLASHDOWN    },
];

function pad(n) { return String(Math.floor(n)).padStart(2, "0"); }

function formatCountdown(seconds) {
  if (seconds <= 0) return null;
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (d > 0) return `${d}d ${pad(h)}h ${pad(m)}m`;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function formatMET(t) {
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  return `T+${Math.floor(h / 24)}d ${pad(h % 24)}h ${pad(m)}m`;
}

export default function MissionMilestone({ metTotalSeconds = 0 }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const elapsed = Math.max(0, Math.floor((now - MISSION_START.getTime()) / 1000));
  const useElapsed = metTotalSeconds > 0 ? metTotalSeconds : elapsed;

  // Next upcoming milestone
  const next = MILESTONES.find(m => m.t > useElapsed);
  // Last completed milestone
  const lastDone = [...MILESTONES].reverse().find(m => m.t <= useElapsed);

  const secsToNext = next ? next.t - useElapsed : null;
  const countdown  = secsToNext != null ? formatCountdown(secsToNext) : null;

  return (
    <div
      className="glow-border rounded-xl p-5"
      style={{ backgroundColor: "#0a1628", border: "1px solid #1a3a5c" }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xl">🎯</span>
        <span className="text-xs uppercase tracking-widest font-bold"
          style={{ color: "#4a7fa5", fontFamily: "'Orbitron', monospace" }}>
          Mission Milestone
        </span>
      </div>

      {/* Next milestone countdown */}
      {next ? (
        <div>
          <p className="text-xs uppercase tracking-widest mb-1"
            style={{ color: "#2a4a6a", fontFamily: "'Orbitron', monospace" }}>
            Next: {next.icon} {next.label}
          </p>
          <div className="flex items-baseline gap-2 mb-1">
            <span
              className="font-black tabular-nums"
              style={{
                fontSize: 26,
                color: secsToNext < 3600 ? "#ff6b35" : "#00d4ff",
                fontFamily: "'Orbitron', monospace",
                textShadow: secsToNext < 3600
                  ? "0 0 16px #ff6b3588"
                  : "0 0 16px #00d4ff66",
              }}
            >
              {countdown}
            </span>
          </div>
          <p className="text-xs" style={{ color: "#2a4a6a", fontFamily: "'Orbitron', monospace" }}>
            {formatMET(next.t)} · T+{Math.floor(secsToNext / 3600)}h {pad(Math.floor((secsToNext % 3600) / 60))}m away
          </p>
        </div>
      ) : (
        <p className="text-sm font-bold" style={{ color: "#39ff14", fontFamily: "'Orbitron', monospace" }}>
          🌊 Mission Complete
        </p>
      )}

      {/* Divider */}
      <div className="my-4" style={{ height: 1, background: "linear-gradient(90deg,transparent,#1a3a5c,transparent)" }} />

      {/* Last completed */}
      <div>
        <p className="text-xs uppercase tracking-widest mb-1"
          style={{ color: "#2a4a6a", fontFamily: "'Orbitron', monospace" }}>
          Last Event
        </p>
        {lastDone ? (
          <p className="text-xs" style={{ color: "#39ff14", fontFamily: "'Orbitron', monospace" }}>
            {lastDone.icon} {lastDone.label}
            <span style={{ color: "#2a4a6a", marginLeft: 8 }}>{formatMET(lastDone.t)}</span>
          </p>
        ) : (
          <p className="text-xs" style={{ color: "#2a4a6a", fontFamily: "'Orbitron', monospace" }}>—</p>
        )}
      </div>

      {/* Mini milestone bar */}
      <div className="mt-4 flex gap-1">
        {MILESTONES.map(m => (
          <div
            key={m.key}
            title={m.label}
            style={{
              flex: 1, height: 3, borderRadius: 2,
              backgroundColor: m.t <= useElapsed
                ? (m === lastDone ? "#39ff14" : "#1a5a3a")
                : (next && m.key === next.key ? "#00d4ff44" : "#1a2a3a"),
            }}
          />
        ))}
      </div>
    </div>
  );
}
