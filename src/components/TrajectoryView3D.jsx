import React, { useRef, useMemo, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars, OrbitControls, Line } from "@react-three/drei";
import * as THREE from "three";

// ── Scene constants ───────────────────────────────────────────────────────────
const MOON_DIST   = 100;
const EARTH_R     = 6;
const MOON_R      = 5.5;
const TOTAL_KM    = 384_400;
// SCENE_SCALE = MOON_DIST / TOTAL_KM — used externally for reference
const MOON_PERIOD = 27.32166 * 86_400;           // seconds per lunar orbit

const RETURN_PHASES = new Set(["COAST_RETURN", "REENTRY", "SPLASHDOWN"]);

// #3 ── Phase timeline data ────────────────────────────────────────────────────
const PHASES = [
  { key: "ASCENT",         label: "↑",   fullLabel: "ASCENT"        },
  { key: "PARKING_ORBIT",  label: "○",   fullLabel: "PARKING ORBIT" },
  { key: "TLI_BURN",       label: "⚡",  fullLabel: "TLI BURN"      },
  { key: "COAST_OUTBOUND", label: "→",   fullLabel: "OUTBOUND"      },
  { key: "LUNAR_APPROACH", label: "🌑",  fullLabel: "LUNAR"         },
  { key: "COAST_RETURN",   label: "←",   fullLabel: "RETURN"        },
  { key: "REENTRY",        label: "🔥",  fullLabel: "RE-ENTRY"      },
  { key: "SPLASHDOWN",     label: "🌊",  fullLabel: "SPLASH"        },
];

// ── Trajectory curve — rebuilt dynamically so it always ends at Moon's surface ─
function buildCurve(moonPos) {
  const [mx, my, mz] = moonPos;

  // Direction from Moon back toward Earth — trajectory grazes Moon surface, not center
  const moonVec  = new THREE.Vector3(mx, my, mz);
  const toEarth  = new THREE.Vector3(0, 0, 0).sub(moonVec).normalize();
  // Touch-point on Moon's Earth-facing surface
  const surface  = moonVec.clone().add(toEarth.clone().multiplyScalar(MOON_R + 1.5));
  // Approach: come in from slightly above on the outbound arc
  const approach = moonVec.clone().add(toEarth.clone().multiplyScalar(MOON_R + 18))
    .add(new THREE.Vector3(0, 6, 0));
  // Departure: leave from slightly below on the return arc
  const depart   = moonVec.clone().add(toEarth.clone().multiplyScalar(MOON_R + 18))
    .add(new THREE.Vector3(0, -6, 0));

  const pts = [
    new THREE.Vector3(0,  0,  EARTH_R),
    new THREE.Vector3(mx * 0.08 + 5,  10, 22),
    new THREE.Vector3(mx * 0.4  + 2,  15, 50),
    approach,
    surface,               // graze Moon surface — not center
    depart,
    new THREE.Vector3(-5, -12, 50),
    new THREE.Vector3(-3, -7,  22),
    new THREE.Vector3(0,  0,   EARTH_R),
  ];
  return new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.5);
}

function getCurveT(dist, phase) {
  const frac = Math.min(1, Math.max(0, (isFinite(dist) ? dist : 0) / TOTAL_KM));
  return RETURN_PHASES.has(phase) ? 0.5 + (1 - frac) * 0.5 : frac * 0.5;
}

// #6 ── Moon drifts in a circular orbit (scene XZ plane) ──────────────────────
function getMoonScenePos(metS) {
  const angle = (metS / MOON_PERIOD) * Math.PI * 2;
  return [Math.sin(angle) * MOON_DIST, 0, Math.cos(angle) * MOON_DIST];
}

// ── Earth texture (singleton) ─────────────────────────────────────────────────
let _earthTex = null;
function getEarthTexture() {
  if (_earthTex) return _earthTex;
  try {
    const W = 512, H = 256;
    const cvs = document.createElement("canvas");
    cvs.width = W; cvs.height = H;
    const c = cvs.getContext("2d");
    c.fillStyle = "#1a6cb8"; c.fillRect(0, 0, W, H);
    c.fillStyle = "#cce8ff"; c.fillRect(0, 0, W, 22); c.fillRect(0, H - 20, W, 20);
    c.fillStyle = "#2d8040";
    c.beginPath(); c.ellipse(268, 150, 34, 52, 0.05, 0, Math.PI*2); c.fill();
    c.beginPath(); c.ellipse(262, 80,  28, 22, 0,    0, Math.PI*2); c.fill();
    c.beginPath(); c.ellipse(100, 92,  52, 55, -0.2, 0, Math.PI*2); c.fill();
    c.beginPath(); c.ellipse(128, 178, 28, 42, 0.1,  0, Math.PI*2); c.fill();
    c.beginPath(); c.ellipse(368, 82,  82, 50, -0.05,0, Math.PI*2); c.fill();
    c.fillStyle = "#c4a055";
    c.beginPath(); c.ellipse(425, 178, 28, 18, -0.1, 0, Math.PI*2); c.fill();
    _earthTex = new THREE.CanvasTexture(cvs);
    return _earthTex;
  } catch { return null; }
}

// ── Three.js sub-components ───────────────────────────────────────────────────

function EarthMesh() {
  const groupRef = useRef();
  const texture  = useMemo(() => getEarthTexture(), []);
  useFrame(({ clock }) => {
    if (groupRef.current) groupRef.current.rotation.y = clock.getElapsedTime() * 0.06;
  });
  return (
    <group ref={groupRef}>
      <mesh>
        <sphereGeometry args={[EARTH_R, 48, 48]} />
        {texture
          ? <meshStandardMaterial map={texture} roughness={0.75} metalness={0.05} emissive="#0a1a40" emissiveIntensity={0.3} />
          : <meshStandardMaterial color="#1a6cb8" roughness={0.75} emissive="#0a1a40" emissiveIntensity={0.5} />}
      </mesh>
      <mesh>
        <sphereGeometry args={[EARTH_R * 1.05, 32, 32]} />
        <meshStandardMaterial color="#3a88ff" transparent opacity={0.13} side={THREE.BackSide} depthWrite={false} />
      </mesh>
    </group>
  );
}

// #6 — Moon accepts a dynamic position prop
function MoonMesh({ moonPos }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.getElapsedTime() * 0.025;
  });
  return (
    <group position={moonPos}>
      <mesh ref={ref}>
        <sphereGeometry args={[MOON_R, 48, 48]} />
        <meshStandardMaterial color="#8a8a9e" roughness={0.88} emissive="#303040" emissiveIntensity={0.4} />
      </mesh>
      <mesh>
        <sphereGeometry args={[MOON_R * 1.05, 16, 16]} />
        <meshStandardMaterial color="#aaaacc" transparent opacity={0.08} side={THREE.BackSide} depthWrite={false} />
      </mesh>
    </group>
  );
}

// #2 — Split trajectory: flown (cyan) + remaining (dim blue)
function TrajLine({ curvePts, curveT }) {
  const splitIdx  = Math.round(Math.min(1, Math.max(0, curveT)) * (curvePts.length - 1));
  const flown     = useMemo(() => curvePts.slice(0, splitIdx + 1), [curvePts, splitIdx]);
  const remaining = useMemo(() => curvePts.slice(splitIdx),        [curvePts, splitIdx]);
  return (
    <>
      {flown.length     >= 2 && <Line points={flown}     color="#00d4ff" lineWidth={2} />}
      {remaining.length >= 2 && <Line points={remaining} color="#1a3a5c" lineWidth={1} />}
    </>
  );
}

function Capsule({ position, phase }) {
  const ref     = useRef();
  const glowRef = useRef();
  const isRet   = RETURN_PHASES.has(phase);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ref.current)
      ref.current.position.set(position.x, position.y + Math.sin(t * 1.8) * 0.18, position.z);
    if (glowRef.current) {
      const s = 1 + Math.sin(t * 3) * 0.3;
      glowRef.current.scale.setScalar(s);
      glowRef.current.material.opacity = 0.12 + Math.abs(Math.sin(t * 3)) * 0.08;
    }
  });

  return (
    <group ref={ref} position={[position.x, position.y, position.z]}>
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.9, 12, 12]} />
        <meshBasicMaterial color="#00d4ff" transparent opacity={0.15} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, isRet ? Math.PI : 0]}>
        <coneGeometry args={[0.3, 0.8, 8]} />
        <meshStandardMaterial color="#00d4ff" emissive="#00d4ff" emissiveIntensity={1.5} metalness={0.4} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0, isRet ? 0.42 : -0.42]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.07, 12]} />
        <meshStandardMaterial color="#ff6b35" emissive="#ff4400" emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
}

function Label({ position, text, color = "#4a7fa5" }) {
  const ref = useRef();
  const tex = useMemo(() => {
    const cvs = document.createElement("canvas");
    cvs.width = 256; cvs.height = 64;
    const ctx = cvs.getContext("2d");
    ctx.font = "bold 22px 'Courier New', monospace";
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 128, 32);
    return new THREE.CanvasTexture(cvs);
  }, [text, color]);

  useFrame(({ camera }) => {
    if (ref.current) ref.current.quaternion.copy(camera.quaternion);
  });

  return (
    <mesh ref={ref} position={position}>
      <planeGeometry args={[5, 1.2]} />
      <meshBasicMaterial map={tex} transparent depthWrite={false} />
    </mesh>
  );
}

// #2 — Camera mode controller: smoothly transitions between Global and Orion POV
function CameraController({ mode, capsulePos, moonPos, controlsRef }) {
  const lerpedRef = useRef(false);
  useFrame(({ camera }) => {
    if (mode !== "orion") {
      lerpedRef.current = false;
      return;
    }
    // Position camera 8 units behind the capsule (away from Moon), 2 up
    const moonVec    = new THREE.Vector3(...moonPos);
    const capVec     = new THREE.Vector3(capsulePos.x, capsulePos.y, capsulePos.z);
    const toMoon     = moonVec.clone().sub(capVec).normalize();
    const camTarget  = capVec.clone()
      .sub(toMoon.clone().multiplyScalar(8))
      .add(new THREE.Vector3(0, 2, 0));

    camera.position.lerp(camTarget, 0.04);
    camera.lookAt(capVec.clone().add(toMoon.clone().multiplyScalar(20)));

    if (controlsRef.current) {
      controlsRef.current.target.lerp(capVec, 0.04);
      controlsRef.current.update();
    }
  });
  return null;
}

// #5 — Listens inside the Canvas for the lock signal and moves OrbitControls target
function CameraLocker({ lockRef, controlsRef, capsulePos }) {
  useFrame(() => {
    if (!lockRef.current) return;
    lockRef.current = false;
    if (controlsRef.current) {
      controlsRef.current.target.set(capsulePos.x, capsulePos.y, capsulePos.z);
      controlsRef.current.update();
    }
  });
  return null;
}

// ── Main component ────────────────────────────────────────────────────────────
export default function TrajectoryView3D({
  distanceFromEarth = 0,
  distanceToMoon    = 0,
  phase             = "COAST_OUTBOUND",
  stateVector       = null,
  velocity          = 0,
  metTotalSeconds   = 0,
  embedMode         = false,
}) {
  const controlsRef  = useRef();
  const lockRef      = useRef(false);
  const [cameraMode, setCameraMode] = useState("global"); // "global" | "orion"

  // #6 — Moon position drifts with lunar period
  const moonPos = useMemo(() => getMoonScenePos(metTotalSeconds), [metTotalSeconds]);

  // Dynamic curve that always ends at the Moon's actual position
  const { curve, curvePts } = useMemo(() => {
    const c   = buildCurve(moonPos);
    const pts = c.getPoints(200);
    return { curve: c, curvePts: pts };
  }, [moonPos]);

  // #1 — Use state vector magnitude for more accurate distance when available
  const dist = useMemo(() => {
    const sv = stateVector?.position;
    if (sv && isFinite(sv.x) && isFinite(sv.y) && isFinite(sv.z)) {
      const mag = Math.sqrt(sv.x ** 2 + sv.y ** 2 + sv.z ** 2);
      if (mag > 0) return mag;
    }
    return distanceFromEarth;
  }, [stateVector, distanceFromEarth]);

  const curveT     = useMemo(() => getCurveT(dist, phase), [dist, phase]);
  const capsulePos = useMemo(() => curve.getPoint(Math.min(1, Math.max(0, curveT))), [curve, curveT]);
  const isReturn   = RETURN_PHASES.has(phase);
  const phaseIdx   = PHASES.findIndex(p => p.key === phase);

  return (
    <div>
      {/* ── 3D canvas panel ── */}
      <div
        className="glow-border rounded-xl overflow-hidden"
        style={{ backgroundColor: "#020810", border: embedMode ? "none" : "1px solid #1a3a5c", height: embedMode ? "100%" : "clamp(280px, 55vw, 440px)", position: "relative", borderRadius: embedMode ? 0 : undefined }}
      >
        {/* Header */}
        <div
          className="absolute top-0 left-0 right-0 z-10 flex items-center gap-3 px-5 py-3 pointer-events-none"
          style={{ background: "linear-gradient(180deg,#020810f2 0%,transparent 100%)" }}
        >
          <span className="text-xl">🛸</span>
          <span className="text-xs uppercase tracking-widest font-bold"
            style={{ color: "#4a7fa5", fontFamily: "'Orbitron', monospace" }}>
            Trajectory Overview — 3D Free Return
          </span>
          <span className="ml-auto text-xs px-2 py-0.5 rounded uppercase tracking-widest"
            style={{ border: "1px solid #1a3a5c", color: isReturn ? "#aaaacc" : "#00d4ff",
              backgroundColor: "#020810aa", fontFamily: "'Orbitron', monospace" }}>
            {isReturn ? "↩ Trans-Earth" : "→ Trans-Lunar"}
          </span>
        </div>

        {/* #4 ── HUD telemetry overlay ── */}
        <div style={{
          position: "absolute", top: 44, right: 8, zIndex: 10,
          backgroundColor: "#020810dd", border: "1px solid #1a3a5c44",
          borderRadius: 5, padding: "6px 9px",
          fontFamily: "'Orbitron', monospace", pointerEvents: "none",
          minWidth: 120,
        }}>
          <div style={{ color: "#2a4a6a", fontSize: 7, letterSpacing: "0.1em", marginBottom: 5, textTransform: "uppercase" }}>
            Live Telemetry
          </div>
          {[
            { label: "VEL",   color: "#00d4ff", val: velocity ? Number(velocity).toLocaleString(undefined, { maximumFractionDigits: 2 }) + " km/s" : "—" },
            { label: "EARTH", color: "#3a9aff", val: distanceFromEarth ? Math.round(distanceFromEarth).toLocaleString() + " km" : "—" },
            { label: "MOON",  color: "#aaaacc", val: distanceToMoon > 0 ? Math.round(distanceToMoon).toLocaleString() + " km" : "—" },
          ].map(({ label, color, val }) => (
            <div key={label} style={{ color, fontSize: 9, marginBottom: 3, display: "flex", justifyContent: "space-between", gap: 8 }}>
              <span style={{ color: "#2a4a6a" }}>{label}</span>
              <span>{val}</span>
            </div>
          ))}
        </div>

        {/* #5 / Camera Mode buttons ── bottom-left cluster */}
        <div style={{ position: "absolute", bottom: 36, left: 12, zIndex: 10, display: "flex", gap: 6 }}>
          {/* Lock on Orion */}
          <button
            onClick={() => { lockRef.current = true; setCameraMode("global"); }}
            style={{
              backgroundColor: "#0a1628cc", border: "1px solid #1a3a5c",
              color: "#4a7fa5", fontFamily: "'Orbitron', monospace",
              fontSize: 8, padding: "5px 10px", borderRadius: 4,
              cursor: "pointer", letterSpacing: "0.10em", textTransform: "uppercase",
              transition: "border-color 0.2s, color 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#00d4ff66"; e.currentTarget.style.color = "#00d4ff"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#1a3a5c";   e.currentTarget.style.color = "#4a7fa5"; }}
          >
            ⊕ Lock on Orion
          </button>

          {/* Camera Mode toggle */}
          <button
            onClick={() => setCameraMode(m => m === "global" ? "orion" : "global")}
            style={{
              backgroundColor: cameraMode === "orion" ? "#00d4ff18" : "#0a1628cc",
              border: `1px solid ${cameraMode === "orion" ? "#00d4ff66" : "#1a3a5c"}`,
              color: cameraMode === "orion" ? "#00d4ff" : "#4a7fa5",
              fontFamily: "'Orbitron', monospace",
              fontSize: 8, padding: "5px 10px", borderRadius: 4,
              cursor: "pointer", letterSpacing: "0.10em", textTransform: "uppercase",
              transition: "all 0.3s",
            }}
          >
            {cameraMode === "orion" ? "🎥 Orion POV" : "🌐 Global View"}
          </button>
        </div>

        {/* Hint */}
        <div className="absolute bottom-3 right-4 z-10 pointer-events-none text-xs"
          style={{ color: "#2a4a6a", fontFamily: "'Orbitron', monospace" }}>
          SCROLL · DRAG · PINCH
        </div>

        <Canvas
          camera={{ position: [85, 28, 50], fov: 75, near: 0.1, far: 700 }}
          gl={{ antialias: true }}
          style={{ width: "100%", height: "100%" }}
        >
          <color attach="background" args={["#020810"]} />

          <ambientLight intensity={0.9} />
          <directionalLight position={[80, 60, -30]} intensity={2.2} color="#fff8f0" />
          <pointLight position={[0, 0, -40]}   intensity={0.8} color="#ffffff" />
          <pointLight position={[-40, -20, 60]} intensity={0.4} color="#2244ff" />
          <pointLight position={[moonPos[0] + 30, moonPos[1] + 20, moonPos[2] - 20]} intensity={1.8} color="#fffaf0" />

          <Stars radius={220} depth={60} count={5000} factor={5} saturation={0.1} fade speed={0.4} />

          <EarthMesh />
          <MoonMesh moonPos={moonPos} />
          <TrajLine curvePts={curvePts} curveT={curveT} />
          <Capsule position={capsulePos} phase={phase} />

          <Label position={[0, EARTH_R + 3, 0]}                              text="EARTH" color="#6699ff" />
          <Label position={[moonPos[0], moonPos[1] + MOON_R + 2.5, moonPos[2]]} text="MOON"  color="#9999bb" />
          <Label position={[capsulePos.x, capsulePos.y + 2, capsulePos.z]}   text="ORION" color="#00d4ff" />

          <CameraLocker lockRef={lockRef} controlsRef={controlsRef} capsulePos={capsulePos} />
          <CameraController mode={cameraMode} capsulePos={capsulePos} moonPos={moonPos} controlsRef={controlsRef} />

          <OrbitControls
            ref={controlsRef}
            makeDefault
            enablePan={cameraMode === "global"}
            enableZoom={cameraMode === "global"}
            enableRotate={cameraMode === "global"}
            target={[moonPos[0] * 0.5, moonPos[1] * 0.5, moonPos[2] * 0.5]}
            minDistance={5}
            maxDistance={350}
            zoomSpeed={1.2}
            rotateSpeed={0.6}
          />
        </Canvas>
      </div>

      {/* #3 ── Mission phase timeline strip ── */}
      <div style={{
        marginTop: 6,
        padding: "8px 10px",
        backgroundColor: "#0a1628",
        border: "1px solid #1a3a5c",
        borderRadius: 8,
        overflowX: "auto",
      }}>
        <div style={{ display: "flex", gap: 4, alignItems: "stretch", height: 56, minWidth: 480 }}>
          {PHASES.map((p, i) => {
            const isPast    = i < phaseIdx;
            const isCurrent = i === phaseIdx;
            return (
              <div
                key={p.key}
                title={p.fullLabel}
                style={{
                  flex: 1,
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                  backgroundColor: isCurrent ? "#00d4ff1a" : isPast ? "#1a3a5c33" : "transparent",
                  border: `1px solid ${isCurrent ? "#00d4ff55" : isPast ? "#1a3a5c66" : "#1a3a5c22"}`,
                  borderRadius: 5,
                  textAlign: "center",
                  padding: "4px 2px",
                  transition: "background-color 0.4s, border-color 0.4s, color 0.4s",
                  position: "relative",
                  gap: 3,
                }}
              >
                {isCurrent && (
                  <span style={{
                    position: "absolute", bottom: 0, left: 0, right: 0,
                    height: 2,
                    background: "linear-gradient(90deg, transparent, #00d4ff, transparent)",
                    borderRadius: "0 0 5px 5px",
                  }} />
                )}
                <span style={{ fontSize: 16, lineHeight: 1 }}>{p.label}</span>
                <span style={{
                  fontSize: 8,
                  fontFamily: "'Orbitron', monospace",
                  color: isCurrent ? "#00d4ff" : isPast ? "#3a5a7a" : "#1a2a3a",
                  letterSpacing: "0.04em",
                  lineHeight: 1,
                  whiteSpace: "nowrap",
                  padding: "0 2px",
                }}>
                  {p.fullLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
