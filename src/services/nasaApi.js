/**
 * NASA JPL Horizons API — Artemis II (Orion) spacecraft
 *
 * Spacecraft ID : -1024  (Artemis II Orion)
 * API docs      : https://ssd-api.jpl.nasa.gov/doc/horizons.html
 * No API key required.
 *
 * NOTE: NASA AROW (Artemis Real-time Orbital Web) does not expose a public
 * JSON endpoint — it is a web/mobile UI backed by proprietary telemetry.
 * JPL Horizons is the closest publicly accessible programmatic source and
 * carries the same state-vector data, updated every ~1 minute.
 *
 * Returns full geocentric J2000 state vectors:
 *   position  (X, Y, Z)   km
 *   velocity  (VX, VY, VZ) km/s
 */

const HORIZONS_BASE = "https://ssd.jpl.nasa.gov/api/horizons.api";
const ORION_ID      = "-1024";

function buildHorizonsUrl() {
  const now   = new Date();
  const start = now.toISOString().slice(0, 16).replace("T", " ");
  const stop  = new Date(now.getTime() + 60_000)
    .toISOString().slice(0, 16).replace("T", " ");

  const params = new URLSearchParams({
    format:     "json",
    COMMAND:    ORION_ID,
    OBJ_DATA:   "NO",
    MAKE_EPHEM: "YES",
    EPHEM_TYPE: "VECTORS",
    CENTER:     "500@399",   // geocenter (Earth)
    START_TIME: `'${start}'`,
    STOP_TIME:  `'${stop}'`,
    STEP_SIZE:  "1m",
    OUT_UNITS:  "KM-S",
    VEC_TABLE:  "2",         // outputs X Y Z  VX VY VZ
    CSV_FORMAT: "NO",
  });

  return `${HORIZONS_BASE}?${params.toString()}`;
}

/**
 * Parse the Horizons plain-text vector table.
 * Returns a full telemetry object or null if unparseable / no data.
 */
function parseHorizonsResponse(text) {
  try {
    const soeIdx = text.indexOf("$$SOE");
    const eoeIdx = text.indexOf("$$EOE");
    if (soeIdx === -1 || eoeIdx === -1) return null;

    const block = text.slice(soeIdx + 5, eoeIdx).trim();
    const lines  = block.split("\n").map((l) => l.trim()).filter(Boolean);

    // Horizons vector table layout (VEC_TABLE=2):
    //   line 0: JDTDB, Calendar date
    //   line 1: X = ...   Y = ...   Z = ...
    //   line 2: VX= ...   VY= ...   VZ= ...
    //   line 3: LT= ...   RG= ...   RR= ...
    const xyzLine = lines.find((l) => l.startsWith("X ="));
    const vLine   = lines.find((l) => l.startsWith("VX="));
    if (!xyzLine || !vLine) return null;

    const x  = parseFloat(xyzLine.match(/X =\s*([-\d.E+]+)/)?.[1]);
    const y  = parseFloat(xyzLine.match(/Y =\s*([-\d.E+]+)/)?.[1]);
    const z  = parseFloat(xyzLine.match(/Z =\s*([-\d.E+]+)/)?.[1]);
    const vx = parseFloat(vLine.match(/VX=\s*([-\d.E+]+)/)?.[1]);
    const vy = parseFloat(vLine.match(/VY=\s*([-\d.E+]+)/)?.[1]);
    const vz = parseFloat(vLine.match(/VZ=\s*([-\d.E+]+)/)?.[1]);

    if ([x, y, z, vx, vy, vz].some(isNaN)) return null;

    const distanceFromEarth = Math.sqrt(x*x + y*y + z*z);
    const velocity          = Math.sqrt(vx*vx + vy*vy + vz*vz);

    return {
      velocity:          parseFloat(velocity.toFixed(3)),
      distanceFromEarth: Math.round(distanceFromEarth),
      distanceToMoon:    Math.max(0, 384_400 - Math.round(distanceFromEarth)),
      stateVector: {
        position: { x, y, z },
        velocity: { x: vx, y: vy, z: vz },
      },
    };
  } catch {
    return null;
  }
}

/**
 * Fetch live state vectors from JPL Horizons.
 * Returns a telemetry object or null on any failure.
 */
export async function fetchHorizons() {
  try {
    const res = await fetch(buildHorizonsUrl(), {
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return null;

    const json = await res.json();
    if (!json.result) return null;

    return parseHorizonsResponse(json.result);
  } catch {
    return null;
  }
}
