import React, { useMemo } from "react";

// ── SVG layout constants ──────────────────────────────────────────────────────
const VW = 900, VH = 290;
const EARTH_X = 90,  MOON_X  = 810, CY = 145;
const EARTH_R = 28,  MOON_R  = 18;
const ARC_H   = 78;  // vertical amplitude of the arcs

// ── Free-return trajectory: two cubic Bezier arcs ────────────────────────────
// Outbound (upper arc): Earth → Moon
const OUT_P = [
  [EARTH_X, CY],
  [230, CY - ARC_H],
  [670, CY - ARC_H],
  [MOON_X, CY],
];

// Return (lower arc): Moon → Earth
const RET_P = [
  [MOON_X, CY],
  [670, CY + ARC_H],
  [230, CY + ARC_H],
  [EARTH_X, CY],
];

// SVG path attribute strings
const OUT_D = `M ${OUT_P[0]} C ${OUT_P[1]} ${OUT_P[2]} ${OUT_P[3]}`;
const RET_D = `M ${RET_P[0]} C ${RET_P[1]} ${RET_P[2]} ${RET_P[3]}`;

// ── Math helpers ──────────────────────────────────────────────────────────────
function cubicBezier(P, t) {
  const s = 1 - t;
  return [
    s**3 * P[0][0] + 3*s**2*t * P[1][0] + 3*s*t**2 * P[2][0] + t**3 * P[3][0],
    s**3 * P[0][1] + 3*s**2*t * P[1][1] + 3*s*t**2 * P[2][1] + t**3 * P[3][1],
  ];
}

// Unit tangent for label placement offsets
function cubicTangent(P, t) {
  const s = 1 - t;
  const dx = -3*s**2*P[0][0] + 3*(s**2 - 2*s*t)*P[1][0] + 3*(2*s*t - t**2)*P[2][0] + 3*t**2*P[3][0];
  const dy = -3*s**2*P[0][1] + 3*(s**2 - 2*s*t)*P[1][1] + 3*(2*s*t - t**2)*P[2][1] + 3*t**2*P[3][1];
  const len = Math.sqrt(dx*dx + dy*dy) || 1;
  return [dx/len, dy/len];
}

const RETURN_PHASES = new Set(["COAST_RETURN", "REENTRY", "SPLASHDOWN"]);
const TOTAL_DIST    = 384_400; // km

function getCapsule(distanceFromEarth, distanceToMoon, phase) {
  // Guard against NaN / undefined inputs
  const dfe  = (isFinite(distanceFromEarth) && distanceFromEarth > 0) ? distanceFromEarth : 0;
  const rawT = Math.min(1, Math.max(0, dfe / TOTAL_DIST));

  if (RETURN_PHASES.has(phase)) {
    const t   = Math.min(1, Math.max(0, 1 - rawT));
    const pos = cubicBezier(RET_P, t);
    const tan = cubicTangent(RET_P, t);
    const safe = (v) => (isFinite(v) ? v : 0);
    return {
      pos: [safe(pos[0]), safe(pos[1])],
      tan: [safe(tan[0]), safe(tan[1])],
      arc: "return", t, outT: 1, retT: t,
    };
  }

  const pos = cubicBezier(OUT_P, rawT);
  const tan = cubicTangent(OUT_P, rawT);
  const safe = (v) => (isFinite(v) ? v : 0);
  return {
    pos: [safe(pos[0]), safe(pos[1])],
    tan: [safe(tan[0]), safe(tan[1])],
    arc: "out", t: rawT, outT: rawT, retT: 0,
  };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function EarthGlyph({ x, y, r }) {
  const id = "earthGrad";
  return (
    <g>
      <defs>
        <radialGradient id={id} cx="40%" cy="35%" r="65%">
          <stop offset="0%"   stopColor="#2a6acc" />
          <stop offset="50%"  stopColor="#143a8c" />
          <stop offset="100%" stopColor="#060e2a" />
        </radialGradient>
        <filter id="earthGlow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Atmosphere halo */}
      <circle cx={x} cy={y} r={r + 7} fill="none" stroke="#2a6acc" strokeWidth="5" opacity="0.12" />
      <circle cx={x} cy={y} r={r + 4} fill="none" stroke="#3a8aee" strokeWidth="2" opacity="0.2" />

      {/* Globe */}
      <circle cx={x} cy={y} r={r} fill={`url(#${id})`} filter="url(#earthGlow)" />

      {/* Continent silhouette hints */}
      <ellipse cx={x - 5}  cy={y - 6}  rx={9}  ry={6}  fill="#1f8a4c" opacity="0.55" />
      <ellipse cx={x + 8}  cy={y + 4}  rx={6}  ry={8}  fill="#1f8a4c" opacity="0.45" />
      <ellipse cx={x - 11} cy={y + 8}  rx={5}  ry={4}  fill="#1f8a4c" opacity="0.40" />
      <ellipse cx={x + 4}  cy={y - 12} rx={4}  ry={3}  fill="#c8d8e0" opacity="0.30" />

      {/* Terminator shadow (clipped to globe via mask) */}
      <circle cx={x + r * 0.3} cy={y} r={r * 0.9} fill="#00000055" opacity="0.6" />

      {/* Rim glow */}
      <circle cx={x} cy={y} r={r} fill="none" stroke="#00d4ff" strokeWidth="0.8" opacity="0.35" />

      {/* Label */}
      <text x={x} y={y + r + 16} textAnchor="middle" fill="#4a7fa5" fontSize="9"
        fontFamily="'Orbitron', monospace" letterSpacing="1">EARTH</text>
    </g>
  );
}

function MoonGlyph({ x, y, r }) {
  const id = "moonGrad";
  return (
    <g>
      <defs>
        <radialGradient id={id} cx="38%" cy="32%" r="65%">
          <stop offset="0%"   stopColor="#8c8c9e" />
          <stop offset="60%"  stopColor="#4a4a5e" />
          <stop offset="100%" stopColor="#1e1e2a" />
        </radialGradient>
        <filter id="moonGlow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Subtle halo */}
      <circle cx={x} cy={y} r={r + 5} fill="none" stroke="#8c8c9e" strokeWidth="2" opacity="0.12" />

      {/* Globe */}
      <circle cx={x} cy={y} r={r} fill={`url(#${id})`} filter="url(#moonGlow)" />

      {/* Craters */}
      <circle cx={x - 6} cy={y - 4} r={3.5} fill="none" stroke="#333" strokeWidth="1.2" opacity="0.6" />
      <circle cx={x + 5} cy={y + 5} r={2.5} fill="none" stroke="#333" strokeWidth="1"   opacity="0.5" />
      <circle cx={x - 2} cy={y + 7} r={2}   fill="none" stroke="#333" strokeWidth="0.8" opacity="0.45" />
      <circle cx={x + 8} cy={y - 6} r={1.5} fill="none" stroke="#333" strokeWidth="0.8" opacity="0.4" />

      {/* Terminator shadow */}
      <circle cx={x + r * 0.35} cy={y} r={r * 0.88} fill="#00000055" opacity="0.55" />

      <circle cx={x} cy={y} r={r} fill="none" stroke="#8c8c9e" strokeWidth="0.6" opacity="0.4" />
      <text x={x} y={y + r + 14} textAnchor="middle" fill="#4a7fa5" fontSize="9"
        fontFamily="'Orbitron', monospace" letterSpacing="1">MOON</text>
    </g>
  );
}

function CapsuleDot({ x, y }) {
  return (
    <g>
      {/* Pulse rings */}
      <circle cx={x} cy={y} r="7" fill="none" stroke="#00d4ff" strokeWidth="1.5" opacity="0.7">
        <animate attributeName="r"       values="7;20;7"     dur="2.2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.7;0;0.7"  dur="2.2s" repeatCount="indefinite" />
      </circle>
      <circle cx={x} cy={y} r="7" fill="none" stroke="#00d4ff" strokeWidth="1" opacity="0.4">
        <animate attributeName="r"       values="7;28;7"     dur="2.2s" begin="0.55s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.4;0;0.4"  dur="2.2s" begin="0.55s" repeatCount="indefinite" />
      </circle>

      {/* Core glow */}
      <circle cx={x} cy={y} r="7" fill="#00d4ff" opacity="0.25" />
      <circle cx={x} cy={y} r="4.5" fill="#00d4ff" />
      <circle cx={x} cy={y} r="2.5" fill="#ffffff" opacity="0.9" />

      {/* Label */}
      <text x={x} y={y - 14} textAnchor="middle" fill="#00d4ff" fontSize="8.5"
        fontFamily="'Orbitron', monospace" letterSpacing="0.5"
        style={{ textShadow: "0 0 6px #00d4ff" }}>
        ORION
      </text>
    </g>
  );
}

// ── Direction arrow along a path ──────────────────────────────────────────────
function Arrow({ P, t, color = "#1a3a5c" }) {
  const [x, y] = cubicBezier(P, t);
  const [tx, ty] = cubicTangent(P, t);
  const len = 10;
  const x2 = x + tx * len, y2 = y + ty * len;
  return (
    <line x1={x - tx*4} y1={y - ty*4} x2={x2} y2={y2}
      stroke={color} strokeWidth="1.2" markerEnd={`url(#arr-${color.replace("#","")})`} opacity="0.5" />
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function OrbitalDiagram({ distanceFromEarth = 0, distanceToMoon = 0, phase = "COAST_OUTBOUND" }) {
  const { pos: [cx, cy], outT, retT } = useMemo(
    () => getCapsule(distanceFromEarth, distanceToMoon, phase),
    [distanceFromEarth, distanceToMoon, phase]
  );

  const isReturn = RETURN_PHASES.has(phase);

  return (
    <div
      className="card-hover glow-border scanline rounded-xl p-5 relative"
      style={{ backgroundColor: "#0a1628", border: "1px solid #1a3a5c" }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-xl">🛸</span>
        <span className="text-xs uppercase tracking-widest font-bold"
          style={{ color: "#4a7fa5", fontFamily: "'Orbitron', monospace" }}>
          Trajectory Overview — Free Return
        </span>
        <span className="ml-auto text-xs px-2 py-0.5 rounded uppercase tracking-widest"
          style={{ border: "1px solid #1a3a5c", color: isReturn ? "#aaaacc" : "#00d4ff",
            backgroundColor: "#050d1a", fontFamily: "'Orbitron', monospace" }}>
          {isReturn ? "↩ Trans-Earth" : "→ Trans-Lunar"}
        </span>
      </div>

      {/* SVG */}
      <svg
        viewBox={`0 0 ${VW} ${VH}`}
        className="w-full"
        style={{ maxHeight: 240, overflow: "visible" }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Arrow markers */}
          <marker id="arr-1a3a5c" markerWidth="5" markerHeight="5" refX="5" refY="2.5" orient="auto">
            <path d="M0,0 L5,2.5 L0,5 Z" fill="#1a3a5c" />
          </marker>
          <marker id="arr-00d4ff" markerWidth="5" markerHeight="5" refX="5" refY="2.5" orient="auto">
            <path d="M0,0 L5,2.5 L0,5 Z" fill="#00d4ff" opacity="0.6" />
          </marker>
          <marker id="arr-aaaacc" markerWidth="5" markerHeight="5" refX="5" refY="2.5" orient="auto">
            <path d="M0,0 L5,2.5 L0,5 Z" fill="#aaaacc" opacity="0.6" />
          </marker>
        </defs>

        {/* ── Full trajectory (dim ghost) ── */}
        <path d={OUT_D} fill="none" stroke="#1a3a5c" strokeWidth="1.5" strokeDasharray="5 7" />
        <path d={RET_D} fill="none" stroke="#1a3a5c" strokeWidth="1.5" strokeDasharray="5 7" />

        {/* ── Traveled outbound portion (brighter) ── */}
        {outT > 0 && (
          <path
            d={OUT_D}
            fill="none"
            stroke="#00d4ff"
            strokeWidth="1.8"
            strokeDasharray={`${outT} 1`}
            pathLength="1"
            opacity="0.6"
          />
        )}

        {/* ── Traveled return portion (moon color) ── */}
        {retT > 0 && (
          <path
            d={RET_D}
            fill="none"
            stroke="#aaaacc"
            strokeWidth="1.8"
            strokeDasharray={`${retT} 1`}
            pathLength="1"
            opacity="0.5"
          />
        )}

        {/* ── Direction arrows ── */}
        <Arrow P={OUT_P} t={0.25} color="#1a3a5c" />
        <Arrow P={OUT_P} t={0.6}  color="#1a3a5c" />
        <Arrow P={RET_P} t={0.25} color="#1a3a5c" />
        <Arrow P={RET_P} t={0.6}  color="#1a3a5c" />

        {/* ── Celestial bodies ── */}
        <EarthGlyph x={EARTH_X} y={CY} r={EARTH_R} />
        <MoonGlyph  x={MOON_X}  y={CY} r={MOON_R}  />

        {/* ── Orion capsule ── */}
        <CapsuleDot x={cx} y={cy} />

        {/* ── Distance readout next to capsule ── */}
        {distanceFromEarth > 0 && (
          <text
            x={Math.min(cx + 16, VW - 80)} y={cy + 5}
            fill="#4a7fa5" fontSize="8" fontFamily="'Orbitron', monospace"
          >
            {Math.round(distanceFromEarth).toLocaleString()} km
          </text>
        )}
      </svg>

      {/* ── Progress bar ── */}
      <div className="mt-3 flex items-center gap-3">
        <span className="text-xs" style={{ color: "#4a7fa5", fontFamily: "'Orbitron', monospace" }}>EARTH</span>
        <div className="flex-1 relative h-1.5 rounded-full" style={{ backgroundColor: "#0d2035" }}>
          {/* Full bar background */}
          <div className="absolute inset-0 rounded-full" style={{ backgroundColor: "#1a3a5c", opacity: 0.4 }} />
          {/* Outbound progress */}
          <div
            className="absolute top-0 left-0 h-full rounded-full transition-all duration-1000"
            style={{
              width: `${outT * 50}%`,
              background: "linear-gradient(90deg, #3a6acc, #00d4ff)",
              boxShadow: "0 0 8px #00d4ff88",
            }}
          />
          {/* Return progress (right half, reversed) */}
          {retT > 0 && (
            <div
              className="absolute top-0 h-full rounded-full transition-all duration-1000"
              style={{
                right: 0,
                width: `${(1 - retT) * 50}%`,
                background: "linear-gradient(90deg, #aaaacc, #6666aa)",
                boxShadow: "0 0 8px #aaaacc55",
              }}
            />
          )}
          {/* Midpoint tick (Moon position) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-3 rounded-full"
            style={{ backgroundColor: "#4a4a6a", marginTop: "-2px" }} />
        </div>
        <span className="text-xs" style={{ color: "#4a7fa5", fontFamily: "'Orbitron', monospace" }}>EARTH</span>
      </div>

      {/* Leg labels under progress bar */}
      <div className="flex justify-between mt-1 px-12">
        <span className="text-xs" style={{ color: "#2a4a6a", fontFamily: "'Orbitron', monospace" }}>Outbound</span>
        <span className="text-xs" style={{ color: "#2a4a6a", fontFamily: "'Orbitron', monospace" }}>🌑 Moon flyby</span>
        <span className="text-xs" style={{ color: "#2a4a6a", fontFamily: "'Orbitron', monospace" }}>Return</span>
      </div>
    </div>
  );
}
