import React from "react";

// All log events keyed by the elapsed seconds at which they fire.
// Each entry: { t (seconds), icon, message, category }
const LOG_EVENTS = [
  { t:       0, icon: "🚀", category: "LAUNCH",   message: "SLS Core Stage ignition — nominal" },
  { t:     120, icon: "✅", category: "ASCENT",   message: "Max-Q passed — vehicle structural load nominal" },
  { t:     480, icon: "🛰", category: "ORBIT",    message: "Core Stage separation successful" },
  { t:     600, icon: "☀️", category: "SYSTEMS",  message: "Solar arrays deployed and generating power" },
  { t:    2400, icon: "📡", category: "COMMS",    message: "Deep Space Network contact established" },
  { t:    5400, icon: "⚡", category: "PROPULSION",message: "TLI burn ignition — RL-10 engines nominal" },
  { t:    7200, icon: "✅", category: "PROPULSION",message: "TLI burn complete — trans-lunar trajectory confirmed" },
  { t:   18000, icon: "🔧", category: "SYSTEMS",  message: "Navigation state update via star tracker" },
  { t:   86400, icon: "📡", category: "COMMS",    message: "MCC-1 trajectory correction maneuver complete" },
  { t:  172800, icon: "🌍", category: "NAV",      message: "Earth departure phase confirmed — 190,000 km" },
  { t:  259200, icon: "📡", category: "COMMS",    message: "MCC-2 minor delta-V correction applied" },
  { t:  345600, icon: "🧭", category: "NAV",      message: "Lunar sphere of influence entry" },
  { t:  367200, icon: "🌑", category: "ORBIT",    message: "Proximity ops underway — lunar approach maneuver" },
  { t:  388800, icon: "🌑", category: "FLYBY",    message: "Closest lunar approach — 100 km altitude confirmed" },
  { t:  432000, icon: "🔄", category: "NAV",      message: "Trans-Earth injection trajectory locked" },
  { t:  604800, icon: "📡", category: "COMMS",    message: "Mid-course correction burn nominal" },
  { t:  777600, icon: "🔥", category: "REENTRY",  message: "Re-entry interface — EI at 400,000 ft altitude" },
  { t:  820800, icon: "🌊", category: "RECOVERY", message: "Splashdown confirmed — recovery operations underway" },
];

const CATEGORY_COLORS = {
  LAUNCH:     "#ff6b35",
  ASCENT:     "#ff9944",
  ORBIT:      "#3a9aff",
  SYSTEMS:    "#39ff14",
  COMMS:      "#aaaacc",
  PROPULSION: "#ff6b35",
  NAV:        "#00d4ff",
  FLYBY:      "#9999bb",
  REENTRY:    "#ff3333",
  RECOVERY:   "#39ff14",
};

function formatMET(t) {
  const d = Math.floor(t / 86400);
  const h = Math.floor((t % 86400) / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  if (d > 0) return `T+${d}d ${String(h).padStart(2,"0")}h ${String(m).padStart(2,"0")}m`;
  return `T+${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

export default function MissionLog({ metTotalSeconds = 0 }) {
  // Find last 3 events that have elapsed
  const elapsed = Math.max(0, metTotalSeconds);
  const pastEvents = LOG_EVENTS.filter(e => e.t <= elapsed);
  const recent = pastEvents.slice(-3).reverse();   // newest first

  return (
    <div
      className="glow-border rounded-xl p-5"
      style={{ backgroundColor: "#0a1628", border: "1px solid #1a3a5c" }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xl">📋</span>
        <span className="text-xs uppercase tracking-widest font-bold"
          style={{ color: "#4a7fa5", fontFamily: "'Orbitron', monospace" }}>
          Mission Control Log
        </span>
        <span className="ml-auto text-xs px-2 py-0.5 rounded"
          style={{ border: "1px solid #1a3a5c", color: "#2a4a6a",
            backgroundColor: "#050d1a", fontFamily: "'Orbitron', monospace" }}>
          {pastEvents.length} events
        </span>
      </div>

      {recent.length === 0 ? (
        <p className="text-xs" style={{ color: "#2a4a6a", fontFamily: "'Orbitron', monospace" }}>
          Awaiting launch…
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {recent.map((ev, i) => (
            <div
              key={ev.t}
              style={{
                display: "flex", gap: 10, alignItems: "flex-start",
                opacity: i === 0 ? 1 : i === 1 ? 0.65 : 0.35,
                transition: "opacity 0.4s",
              }}
            >
              {/* Left: icon + vertical connector */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%",
                  border: `1px solid ${CATEGORY_COLORS[ev.category] ?? "#1a3a5c"}44`,
                  backgroundColor: i === 0 ? `${CATEGORY_COLORS[ev.category] ?? "#1a3a5c"}18` : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, flexShrink: 0,
                }}>
                  {ev.icon}
                </div>
                {i < recent.length - 1 && (
                  <div style={{ width: 1, flex: 1, minHeight: 8, backgroundColor: "#1a3a5c44", marginTop: 3 }} />
                )}
              </div>

              {/* Right: content */}
              <div style={{ paddingTop: 4 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 2 }}>
                  <span style={{
                    fontSize: 7, fontFamily: "'Orbitron', monospace",
                    color: CATEGORY_COLORS[ev.category] ?? "#4a7fa5",
                    textTransform: "uppercase", letterSpacing: "0.1em",
                  }}>
                    {ev.category}
                  </span>
                  <span style={{
                    fontSize: 7, fontFamily: "'Orbitron', monospace",
                    color: "#2a4a6a", letterSpacing: "0.05em",
                  }}>
                    {formatMET(ev.t)}
                  </span>
                </div>
                <p style={{
                  fontSize: 10, fontFamily: "'Orbitron', monospace",
                  color: i === 0 ? "#c0d8f0" : "#4a7fa5",
                  lineHeight: 1.5, margin: 0,
                }}>
                  {ev.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bottom accent */}
      <div className="mt-4" style={{ height: 1, background: "linear-gradient(90deg,transparent,#1a3a5c,transparent)" }} />
      <p className="mt-2 text-xs text-center" style={{ color: "#1a2a3a", fontFamily: "'Orbitron', monospace" }}>
        Auto-updates with mission phase
      </p>
    </div>
  );
}
