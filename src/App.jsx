import React, { useState } from "react";
import MetricCard from "./components/MetricCard";
import MissionClock from "./components/MissionClock";
import TrajectoryView3D from "./components/TrajectoryView3D";
import MissionMilestone from "./components/MissionMilestone";
import MissionLog from "./components/MissionLog";
import SettingsPanel, { loadSettings } from "./components/SettingsPanel";
import { useArtemisData, MISSION_START as DEFAULT_MISSION_START } from "./hooks/useArtemisData";
import { useMilestoneAlerts } from "./hooks/useMilestoneAlerts";
import NasaTVCard from "./components/NasaTVCard";

// ── Embed mode: ?embed=1 hides the header and removes padding ─────────────────
const IS_EMBED = new URLSearchParams(window.location.search).get("embed") === "1";

const STATUS_CONFIG = {
  loading: { color: "#4a7fa5", label: "LOADING"              },
  live:    { color: "#39ff14", label: "LIVE — JPL HORIZONS"  },
  mock:    { color: "#ff6b35", label: "SIM — PRE-LAUNCH"     },
  error:   { color: "#ff3333", label: "DATA ERROR"           },
};

const PHASE_LABELS = {
  ASCENT:         "ASCENT",
  PARKING_ORBIT:  "PARKING ORBIT",
  TLI_BURN:       "TLI BURN ⚡",
  COAST_OUTBOUND: "TRANS-LUNAR COAST",
  LUNAR_APPROACH: "LUNAR APPROACH",
  COAST_RETURN:   "TRANS-EARTH COAST",
  REENTRY:        "RE-ENTRY",
  SPLASHDOWN:     "SPLASHDOWN",
};

function fmt(n)        { return n != null ? Number(n).toLocaleString() : "—"; }
function fmtVec(v)     { return `${v.x.toLocaleString()} / ${v.y.toLocaleString()} / ${v.z.toLocaleString()}`; }
function fmtTime(date) { return date?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) ?? null; }

export default function App() {
  const [settings, setSettings]       = useState(() => loadSettings());
  const [showSettings, setShowSettings] = useState(false);

  // Derive mission start from settings
  const missionStart = new Date(settings.launchIso) || DEFAULT_MISSION_START;

  const {
    met,
    velocity,
    distanceFromEarth,
    distanceToMoon,
    stateVector,
    phase,
    status,
    lastUpdated,
    error,
  } = useArtemisData({ mockMode: settings.mockMode, missionStart });

  // Sound alerts on phase change
  useMilestoneAlerts(phase, settings.soundEnabled);

  const badge      = STATUS_CONFIG[status] ?? STATUS_CONFIG.loading;
  const phaseLabel = PHASE_LABELS[phase] ?? phase ?? "—";
  const isTLI      = phase === "TLI_BURN";

  return (
    <div className="relative min-h-screen z-10" style={{ color: "#e0f0ff" }}>

      {/* ── Settings modal ── */}
      {showSettings && (
        <SettingsPanel
          settings={settings}
          onChange={setSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* ── Header (hidden in embed mode) ── */}
      {!IS_EMBED && (
        <header
          className="sticky top-0 z-20 flex items-center justify-between px-3 py-3 md:px-6 md:py-4"
          style={{ backgroundColor: "#050d1acc", backdropFilter: "blur(12px)", borderBottom: "1px solid #1a3a5c" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-xs md:text-sm font-black flex-shrink-0"
              style={{
                background: "radial-gradient(circle at 35% 35%, #1a5cb8, #0a2a5a)",
                border: "2px solid #00d4ff44",
                fontFamily: "'Orbitron', monospace",
                color: "#00d4ff",
                boxShadow: "0 0 12px #00d4ff33",
              }}
            >
              A2
            </div>
            <div>
              <h1
                className="text-base md:text-lg font-black tracking-widest leading-none"
                style={{ fontFamily: "'Orbitron', monospace", color: "#00d4ff", textShadow: "0 0 12px #00d4ff88" }}
              >
                ARTEMIS II
              </h1>
              <p className="text-xs tracking-widest hidden sm:block" style={{ color: "#4a7fa5" }}>
                MISSION CONTROL DASHBOARD
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Settings button */}
            <button
              onClick={() => setShowSettings(true)}
              title="Settings"
              style={{
                background: "none", border: "1px solid #1a3a5c",
                borderRadius: 6, padding: "5px 8px",
                color: "#2a4a6a", cursor: "pointer", fontSize: 14,
                transition: "border-color 0.2s, color 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#00d4ff44"; e.currentTarget.style.color = "#4a7fa5"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#1a3a5c";   e.currentTarget.style.color = "#2a4a6a"; }}
            >
              ⚙️
            </button>

            <div className="flex flex-col items-end gap-1">
              {/* Data source badge */}
              <div className="flex items-center gap-2 px-2 py-1 rounded-full md:px-3"
                style={{ border: "1px solid #1a3a5c", backgroundColor: "#0a1628" }}>
                <span className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: badge.color, boxShadow: `0 0 8px ${badge.color}` }} />
                <span className="uppercase tracking-widest"
                  style={{ color: badge.color, fontFamily: "'Orbitron', monospace", fontSize: "0.6rem" }}>
                  {badge.label}
                </span>
              </div>
              {/* Phase badge */}
              <div className="flex items-center gap-2 px-2 py-1 rounded-full md:px-3"
                style={{
                  border: `1px solid ${isTLI ? "#ff6b3588" : "#1a3a5c"}`,
                  backgroundColor: isTLI ? "#1a0a00" : "#0a1628",
                }}>
                <span className="uppercase tracking-widest"
                  style={{ color: isTLI ? "#ff6b35" : "#4a7fa5", fontFamily: "'Orbitron', monospace", fontSize: "0.6rem" }}>
                  {phaseLabel}
                </span>
              </div>
              {lastUpdated && (
                <span className="hidden sm:block" style={{ color: "#2a4a6a", fontFamily: "'Orbitron', monospace", fontSize: "0.55rem" }}>
                  UPDATED {fmtTime(lastUpdated)}
                </span>
              )}
            </div>
          </div>
        </header>
      )}

      {/* ── Main Content ── */}
      <main className={`max-w-6xl mx-auto px-3 py-6 md:px-6 md:py-8 ${IS_EMBED ? "pt-4" : ""}`}>

        {/* Mission Clock */}
        {!IS_EMBED && (
          <div className="mb-4 md:mb-6">
            <MissionClock met={met} />
          </div>
        )}

        {/* Metric Cards — 1 col mobile, 3 col desktop */}
        {!IS_EMBED && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 md:mb-6">
            <MetricCard
              icon="⚡"
              label="Velocity"
              value={fmt(velocity)}
              unit="km/s"
              subtext={isTLI ? "TLI BURN IN PROGRESS — VELOCITY RISING" : "Relative to Earth center · geocentric J2000"}
              accentColor={isTLI ? "#ff6b35" : "#00d4ff"}
            />
            <MetricCard
              icon="🌍"
              label="Distance from Earth"
              value={fmt(distanceFromEarth)}
              unit="km"
              subtext="From Earth center of mass · geocentric"
              accentColor="#3a9aff"
            />
            <MetricCard
              icon="🌑"
              label="Distance to Moon"
              value={distanceToMoon > 0 ? fmt(distanceToMoon) : "—"}
              unit="km"
              subtext="Approximate lunar distance"
              accentColor="#aaaacc"
            />
          </div>
        )}

        {/* NASA TV + Milestone side by side — visible on first load */}
        {!IS_EMBED && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 md:mb-6">
            <NasaTVCard />
            <MissionMilestone metTotalSeconds={met?.totalSeconds ?? 0} />
          </div>
        )}

        {/* State Vectors */}
        {!IS_EMBED && stateVector && (
          <div
            className="glow-border scanline rounded-xl p-5 mb-4 md:mb-6"
            style={{ backgroundColor: "#0a1628", border: "1px solid #1a3a5c" }}
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xl">📡</span>
              <span className="text-xs uppercase tracking-widest font-bold"
                style={{ color: "#4a7fa5", fontFamily: "'Orbitron', monospace" }}>
                State Vectors
              </span>
              <span className="ml-auto text-xs px-2 py-0.5 rounded"
                style={{ backgroundColor: "#0a1628", border: "1px solid #1a3a5c", color: "#4a7fa5", fontFamily: "'Orbitron', monospace" }}>
                RAW TELEMETRY
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs mb-1 uppercase tracking-widest" style={{ color: "#4a7fa5" }}>Position (X / Y / Z) km</p>
                <p className="text-xs font-mono break-all" style={{ color: "#00d4ff" }}>
                  {fmtVec(stateVector.position)}
                </p>
              </div>
              <div>
                <p className="text-xs mb-1 uppercase tracking-widest" style={{ color: "#4a7fa5" }}>Velocity (VX / VY / VZ) km·s⁻¹</p>
                <p className="text-xs font-mono break-all" style={{ color: "#39ff14" }}>
                  {fmtVec(stateVector.velocity)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 3D Trajectory — always visible, fills viewport in embed mode */}
        <div style={IS_EMBED ? { height: "100dvh" } : {}}>
          <TrajectoryView3D
            distanceFromEarth={distanceFromEarth ?? 0}
            distanceToMoon={distanceToMoon ?? 0}
            phase={phase ?? "COAST_OUTBOUND"}
            stateVector={stateVector ?? null}
            velocity={velocity ?? 0}
            metTotalSeconds={met?.totalSeconds ?? 0}
            embedMode={IS_EMBED}
          />
        </div>

        {/* Mission Log */}
        {!IS_EMBED && (
          <div className="mt-4 md:mt-6">
            <MissionLog metTotalSeconds={met?.totalSeconds ?? 0} />
          </div>
        )}

        {/* Error / info banner */}
        {error && !IS_EMBED && (
          <p className="text-center text-xs mt-4" style={{ color: "#ff6b35", fontFamily: "'Orbitron', monospace" }}>
            ⚠ {error}
          </p>
        )}

        {!IS_EMBED && (
          <p className="text-center text-xs mt-4" style={{ color: "#2a4a6a", fontFamily: "'Orbitron', monospace" }}>
            {status === "live"
              ? "LIVE DATA — JPL HORIZONS API · REFRESHES EVERY 30 SECONDS"
              : "SIMULATION MODE — MOCK TRAJECTORY"}
          </p>
        )}
      </main>
    </div>
  );
}
