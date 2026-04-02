import React, { useState, useEffect } from "react";

const STORAGE_KEY = "artemis-settings";

const DEFAULT_SETTINGS = {
  launchIso:      "2026-04-02T00:00:00Z",
  soundEnabled:   true,
  mockMode:       false,
};

export function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { ...DEFAULT_SETTINGS };
}

function saveSettings(s) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

// ── Panel component ───────────────────────────────────────────────────────────
export default function SettingsPanel({ settings, onChange, onClose }) {
  const [draft, setDraft] = useState({ ...settings });
  const [copied, setCopied] = useState(false);

  function set(key, val) {
    setDraft(d => ({ ...d, [key]: val }));
  }

  function apply() {
    saveSettings(draft);
    onChange(draft);
    onClose();
  }

  function reset() {
    setDraft({ ...DEFAULT_SETTINGS });
  }

  function copyShareLink() {
    const url = new URL(window.location.href);
    url.searchParams.set("embed", "1");
    navigator.clipboard?.writeText(url.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Validate ISO date
  const dateValid = !isNaN(new Date(draft.launchIso).getTime());

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        backgroundColor: "#000000bb",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        backgroundColor: "#0a1628",
        border: "1px solid #1a3a5c",
        borderRadius: 12,
        padding: "28px 24px",
        width: "100%", maxWidth: 420,
        fontFamily: "'Orbitron', monospace",
        boxShadow: "0 0 40px #00d4ff18",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
          <span style={{ fontSize: 20 }}>⚙️</span>
          <span style={{ color: "#4a7fa5", fontSize: 11, letterSpacing: "0.15em", fontWeight: "bold", textTransform: "uppercase" }}>
            Mission Settings
          </span>
          <button
            onClick={onClose}
            style={{ marginLeft: "auto", background: "none", border: "none", color: "#2a4a6a", cursor: "pointer", fontSize: 18, lineHeight: 1 }}
          >
            ✕
          </button>
        </div>

        {/* Launch timestamp */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", color: "#2a4a6a", fontSize: 8, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>
            Launch Timestamp (UTC)
          </label>
          <input
            type="text"
            value={draft.launchIso}
            onChange={e => set("launchIso", e.target.value)}
            placeholder="2026-04-02T00:00:00Z"
            style={{
              width: "100%", boxSizing: "border-box",
              backgroundColor: "#050d1a",
              border: `1px solid ${dateValid ? "#1a3a5c" : "#ff3333"}`,
              borderRadius: 5, padding: "8px 10px",
              color: dateValid ? "#00d4ff" : "#ff3333",
              fontFamily: "'Orbitron', monospace", fontSize: 10,
              outline: "none",
            }}
          />
          {!dateValid && (
            <p style={{ color: "#ff3333", fontSize: 8, marginTop: 4 }}>Invalid ISO 8601 date</p>
          )}
          <p style={{ color: "#2a4a6a", fontSize: 7, marginTop: 4 }}>
            Format: YYYY-MM-DDTHH:MM:SSZ · Adjust if launch slips
          </p>
        </div>

        {/* Sound toggle */}
        <div style={{ marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ color: "#4a7fa5", fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", margin: 0 }}>
              Milestone Sound Alerts
            </p>
            <p style={{ color: "#2a4a6a", fontSize: 7, margin: "3px 0 0" }}>
              Chime plays when mission phase changes
            </p>
          </div>
          <button
            onClick={() => set("soundEnabled", !draft.soundEnabled)}
            style={{
              width: 42, height: 22, borderRadius: 11,
              backgroundColor: draft.soundEnabled ? "#00d4ff33" : "#1a2a3a",
              border: `1px solid ${draft.soundEnabled ? "#00d4ff55" : "#1a3a5c"}`,
              cursor: "pointer", position: "relative", transition: "all 0.2s",
              flexShrink: 0,
            }}
          >
            <span style={{
              position: "absolute", top: 2,
              left: draft.soundEnabled ? 22 : 2,
              width: 16, height: 16, borderRadius: "50%",
              backgroundColor: draft.soundEnabled ? "#00d4ff" : "#2a4a6a",
              transition: "left 0.2s",
              display: "block",
            }} />
          </button>
        </div>

        {/* Simulation mode */}
        <div style={{ marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ color: "#4a7fa5", fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", margin: 0 }}>
              Simulation Mode
            </p>
            <p style={{ color: "#2a4a6a", fontSize: 7, margin: "3px 0 0" }}>
              Force mock data instead of live JPL Horizons
            </p>
          </div>
          <button
            onClick={() => set("mockMode", !draft.mockMode)}
            style={{
              width: 42, height: 22, borderRadius: 11,
              backgroundColor: draft.mockMode ? "#ff6b3533" : "#1a2a3a",
              border: `1px solid ${draft.mockMode ? "#ff6b3555" : "#1a3a5c"}`,
              cursor: "pointer", position: "relative", transition: "all 0.2s",
              flexShrink: 0,
            }}
          >
            <span style={{
              position: "absolute", top: 2,
              left: draft.mockMode ? 22 : 2,
              width: 16, height: 16, borderRadius: "50%",
              backgroundColor: draft.mockMode ? "#ff6b35" : "#2a4a6a",
              transition: "left 0.2s",
              display: "block",
            }} />
          </button>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "linear-gradient(90deg,transparent,#1a3a5c,transparent)", marginBottom: 20 }} />

        {/* Share / embed */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ color: "#2a4a6a", fontSize: 8, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
            Share / Embed
          </p>
          <button
            onClick={copyShareLink}
            style={{
              width: "100%", padding: "8px 0",
              backgroundColor: copied ? "#00d4ff18" : "#050d1a",
              border: `1px solid ${copied ? "#00d4ff55" : "#1a3a5c"}`,
              borderRadius: 5, color: copied ? "#00d4ff" : "#4a7fa5",
              fontFamily: "'Orbitron', monospace", fontSize: 9,
              cursor: "pointer", letterSpacing: "0.1em", textTransform: "uppercase",
              transition: "all 0.2s",
            }}
          >
            {copied ? "✓ Copied to clipboard!" : "🔗 Copy Embed URL"}
          </button>
          <p style={{ color: "#1a2a3a", fontSize: 7, marginTop: 5, textAlign: "center" }}>
            Embed URL adds ?embed=1 — hides header, fills viewport
          </p>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={reset}
            style={{
              flex: 1, padding: "9px 0",
              backgroundColor: "transparent",
              border: "1px solid #1a3a5c",
              borderRadius: 5, color: "#2a4a6a",
              fontFamily: "'Orbitron', monospace", fontSize: 8,
              cursor: "pointer", letterSpacing: "0.1em", textTransform: "uppercase",
            }}
          >
            Reset
          </button>
          <button
            onClick={apply}
            disabled={!dateValid}
            style={{
              flex: 2, padding: "9px 0",
              backgroundColor: dateValid ? "#00d4ff18" : "#1a2a3a",
              border: `1px solid ${dateValid ? "#00d4ff55" : "#1a3a5c"}`,
              borderRadius: 5, color: dateValid ? "#00d4ff" : "#2a4a6a",
              fontFamily: "'Orbitron', monospace", fontSize: 9,
              cursor: dateValid ? "pointer" : "not-allowed",
              letterSpacing: "0.1em", textTransform: "uppercase",
              transition: "all 0.2s",
            }}
          >
            Apply &amp; Close
          </button>
        </div>
      </div>
    </div>
  );
}
