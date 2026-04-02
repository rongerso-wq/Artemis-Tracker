import React from "react";

export default function MetricCard({ icon, label, value, unit, subtext, accentColor = "#00d4ff" }) {
  return (
    <div
      className="card-hover glow-border scanline rounded-xl p-6 flex flex-col gap-3 relative"
      style={{ backgroundColor: "#0a1628", border: `1px solid #1a3a5c` }}
    >
      {/* Top row: icon + label */}
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <span
          className="text-xs uppercase tracking-widest font-bold"
          style={{ color: "#4a7fa5", fontFamily: "'Orbitron', monospace" }}
        >
          {label}
        </span>
      </div>

      {/* Value */}
      <div className="flex items-end gap-2">
        <span
          className="text-4xl font-black leading-none"
          style={{
            color: accentColor,
            fontFamily: "'Orbitron', monospace",
            textShadow: `0 0 15px ${accentColor}88`,
          }}
        >
          {value}
        </span>
        {unit && (
          <span className="text-sm mb-1" style={{ color: "#4a7fa5" }}>
            {unit}
          </span>
        )}
      </div>

      {/* Subtext */}
      {subtext && (
        <p className="text-xs" style={{ color: "#4a7fa5" }}>
          {subtext}
        </p>
      )}

      {/* Bottom accent line */}
      <div
        className="absolute bottom-0 left-6 right-6 h-px rounded-full"
        style={{ background: `linear-gradient(90deg, transparent, ${accentColor}44, transparent)` }}
      />
    </div>
  );
}
