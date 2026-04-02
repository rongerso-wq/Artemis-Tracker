/**
 * Artemis II mock trajectory — realistic free-return profile.
 *
 * Covers the full ~9.5-day mission with:
 *  - Ascent / parking orbit (circular LEO)
 *  - TLI burn ramp (velocity spike T+1.5 h → T+2 h)
 *  - Trans-lunar coast (outbound Bezier arc)
 *  - Lunar flyby at closest approach
 *  - Trans-Earth coast (return Bezier arc)
 *  - Re-entry / splashdown
 *
 * State vectors are expressed in a simplified geocentric frame:
 *   +X  toward Moon at mission start
 *   +Y  perpendicular in equatorial plane
 *   +Z  north polar axis (small lunar inclination ~5.1°)
 */

// ── Constants ─────────────────────────────────────────────────────────────────
const EARTH_RADIUS    = 6_371;    // km
const LEO_RADIUS      = 6_556;    // km  (~185 km altitude)
const MOON_DISTANCE   = 384_400;  // km  average center-to-center
const INCLINATION_RAD = 5.1 * (Math.PI / 180);

// ── Mission phase time boundaries (elapsed seconds) ───────────────────────────
const T = {
  LAUNCH:         0,
  PARKING_ORBIT:  480,      // T+8 m
  TLI_START:      5_400,    // T+1.5 h
  TLI_END:        7_200,    // T+2 h
  FLYBY:          388_800,  // T+4.5 d  (closest lunar approach)
  REENTRY_START:  777_600,  // T+9 d
  SPLASHDOWN:     820_800,  // T+9.5 d
};

// ── Scalar waypoints: [elapsedSec, distFromEarth km, speed km/s] ──────────────
const WAYPOINTS = [
  [T.LAUNCH,         EARTH_RADIUS, 0.0  ],
  [T.PARKING_ORBIT,  LEO_RADIUS,   7.80 ],
  [T.TLI_START,      LEO_RADIUS,   7.80 ],  // pre-burn
  [T.TLI_END,        8_200,        10.40],  // burn complete  ← TLI spike
  [86_400,           80_000,       2.60 ],
  [172_800,          190_000,      1.30 ],
  [259_200,          290_000,      1.05 ],
  [345_600,          358_500,      1.55 ],
  [T.FLYBY,          375_500,      2.20 ],
  [432_000,          340_000,      1.40 ],
  [518_400,          220_000,      1.20 ],
  [604_800,          120_000,      1.60 ],
  [691_200,           40_000,      3.80 ],
  [T.REENTRY_START,   10_000,      9.50 ],
  [T.SPLASHDOWN,   EARTH_RADIUS,   0.00 ],
];

// ── Bezier arc control points for 3D trajectory ───────────────────────────────
// Outbound arc: LEO → lunar flyby (quadratic Bezier)
const ARC_OUT = {
  P0: { x:   8_200, y:      0, z:     0 },  // post-TLI injection point
  P1: { x: 200_000, y: 42_000, z: 5_000 },  // control (arc apex)
  P2: { x: 375_500, y: 28_000, z: 6_000 },  // lunar flyby point
};

// Return arc: lunar flyby → re-entry (quadratic Bezier)
const ARC_RET = {
  P0: { x: 375_500, y:  28_000, z:  6_000 },
  P1: { x: 200_000, y: -35_000, z:  2_000 },
  P2: { x:   6_556, y:       0, z:      0 },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function lerp(a, b, t) { return a + (b - a) * t; }

/** Evaluate a quadratic Bezier at parameter t ∈ [0,1]. */
function bezier(P0, P1, P2, t) {
  const s = 1 - t;
  return {
    x: s * s * P0.x + 2 * s * t * P1.x + t * t * P2.x,
    y: s * s * P0.y + 2 * s * t * P1.y + t * t * P2.y,
    z: s * s * P0.z + 2 * s * t * P1.z + t * t * P2.z,
  };
}

/** Tangent direction of a quadratic Bezier (not unit-normalised). */
function bezierTangent(P0, P1, P2, t) {
  const s = 1 - t;
  return {
    x: 2 * s * (P1.x - P0.x) + 2 * t * (P2.x - P1.x),
    y: 2 * s * (P1.y - P0.y) + 2 * t * (P2.y - P1.y),
    z: 2 * s * (P1.z - P0.z) + 2 * t * (P2.z - P1.z),
  };
}

/** Scale a vector to a given magnitude. */
function setMag(vec, mag) {
  const len = Math.sqrt(vec.x * vec.x + vec.y * vec.y + vec.z * vec.z);
  if (len === 0) return { x: mag, y: 0, z: 0 };
  return { x: (vec.x / len) * mag, y: (vec.y / len) * mag, z: (vec.z / len) * mag };
}

/** Round each component to 2 decimal places. */
function roundVec(v) {
  return { x: Math.round(v.x * 100) / 100, y: Math.round(v.y * 100) / 100, z: Math.round(v.z * 100) / 100 };
}

/** Interpolate scalar telemetry from the waypoint table. */
function interpolateScalars(elapsedSec) {
  const t = Math.max(0, elapsedSec);
  if (t >= WAYPOINTS[WAYPOINTS.length - 1][0]) {
    const [, d, v] = WAYPOINTS[WAYPOINTS.length - 1];
    return { distanceFromEarth: d, velocity: v };
  }
  for (let i = 0; i < WAYPOINTS.length - 1; i++) {
    const [t0, d0, v0] = WAYPOINTS[i];
    const [t1, d1, v1] = WAYPOINTS[i + 1];
    if (t >= t0 && t < t1) {
      const p = (t - t0) / (t1 - t0);
      return {
        distanceFromEarth: Math.round(lerp(d0, d1, p)),
        velocity:          parseFloat(lerp(v0, v1, p).toFixed(3)),
      };
    }
  }
  return { distanceFromEarth: EARTH_RADIUS, velocity: 0 };
}

/** Derive mission phase from elapsed seconds. */
export function getPhase(elapsedSec) {
  if (elapsedSec < T.PARKING_ORBIT)   return "ASCENT";
  if (elapsedSec < T.TLI_START)       return "PARKING_ORBIT";
  if (elapsedSec < T.TLI_END)         return "TLI_BURN";
  if (elapsedSec < T.FLYBY - 21_600)  return "COAST_OUTBOUND";   // up to ~T+4d
  if (elapsedSec < T.FLYBY + 21_600)  return "LUNAR_APPROACH";
  if (elapsedSec < T.REENTRY_START)   return "COAST_RETURN";
  if (elapsedSec < T.SPLASHDOWN)      return "REENTRY";
  return "SPLASHDOWN";
}

/** Compute 3D state vectors (position + velocity) for a given elapsed time. */
function computeStateVector(elapsedSec, velocity) {
  // ── Ascent / parking orbit: circular LEO ──────────────────────────────────
  if (elapsedSec < T.TLI_START) {
    const omega = velocity / LEO_RADIUS;           // rad/s
    const theta = omega * elapsedSec;
    const r     = LEO_RADIUS;
    const pos = {
      x: r * Math.cos(theta),
      y: r * Math.sin(theta) * Math.cos(INCLINATION_RAD),
      z: r * Math.sin(theta) * Math.sin(INCLINATION_RAD),
    };
    const velDir = {
      x: -Math.sin(theta),
      y:  Math.cos(theta) * Math.cos(INCLINATION_RAD),
      z:  Math.cos(theta) * Math.sin(INCLINATION_RAD),
    };
    return { position: roundVec(pos), velocity: roundVec(setMag(velDir, velocity)) };
  }

  // ── TLI burn: hold LEO position, velocity ramps along +X ─────────────────
  if (elapsedSec < T.TLI_END) {
    const pos    = { x: LEO_RADIUS, y: 0, z: 0 };
    const velDir = { x: 0.98, y: 0.20, z: 0.05 };  // roughly prograde
    return { position: roundVec(pos), velocity: roundVec(setMag(velDir, velocity)) };
  }

  // ── Trans-lunar coast (outbound) ──────────────────────────────────────────
  if (elapsedSec <= T.FLYBY) {
    const t   = (elapsedSec - T.TLI_END) / (T.FLYBY - T.TLI_END);
    const pos = bezier(ARC_OUT.P0, ARC_OUT.P1, ARC_OUT.P2, t);
    const tan = bezierTangent(ARC_OUT.P0, ARC_OUT.P1, ARC_OUT.P2, t);
    return { position: roundVec(pos), velocity: roundVec(setMag(tan, velocity)) };
  }

  // ── Trans-Earth coast (return) ────────────────────────────────────────────
  const t   = Math.min(1, (elapsedSec - T.FLYBY) / (T.SPLASHDOWN - T.FLYBY));
  const pos = bezier(ARC_RET.P0, ARC_RET.P1, ARC_RET.P2, t);
  const tan = bezierTangent(ARC_RET.P0, ARC_RET.P1, ARC_RET.P2, t);
  return { position: roundVec(pos), velocity: roundVec(setMag(tan, velocity)) };
}

/** Decompose total elapsed seconds into days / hours / minutes / seconds. */
function decomposeMET(totalSeconds) {
  const s = Math.max(0, totalSeconds);
  return {
    days:         Math.floor(s / 86_400),
    hours:        Math.floor((s % 86_400) / 3_600),
    minutes:      Math.floor((s % 3_600) / 60),
    seconds:      s % 60,
    totalSeconds: s,
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Generate mock Artemis II telemetry for a given mission start date.
 *
 * @param {Date}    missionStart  — UTC launch date/time
 * @param {boolean} forceTLI      — if true, offset time so TLI burn is "imminent"
 *                                   (elapsed = T_TLI_START - 180 s)
 */
export function getMockData(missionStart, forceTLI = false) {
  const realElapsed  = Math.max(
    0,
    Math.floor((Date.now() - missionStart.getTime()) / 1_000)
  );

  // When TLI mode is requested, pin the clock 3 minutes before burn start
  const elapsedSec = forceTLI ? T.TLI_START - 180 : realElapsed;

  const { distanceFromEarth, velocity } = interpolateScalars(elapsedSec);

  // ±0.5 % sensor jitter
  const jitter = () => 1 + (Math.random() - 0.5) * 0.005;
  const noisyDist = Math.round(distanceFromEarth * jitter());
  const noisyVel  = parseFloat((velocity * jitter()).toFixed(3));
  const distToMoon = Math.max(0, MOON_DISTANCE - noisyDist);

  const phase       = getPhase(elapsedSec);
  const stateVector = computeStateVector(elapsedSec, noisyVel);
  const met         = decomposeMET(elapsedSec);

  return {
    met,
    velocity:          noisyVel,
    distanceFromEarth: noisyDist,
    distanceToMoon:    distToMoon,
    stateVector,
    phase,
    dataSource:        "mock",
  };
}

export { decomposeMET, T as MISSION_TIMES };
