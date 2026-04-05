import React, { useState } from "react";

/**
 * NasaTVCard — embeds two NASA-related live streams with a tab switcher.
 * Stream A: NASA TV official YouTube channel (always-on programming)
 * Stream B: User-specified stream (e.g. mission-specific live coverage)
 */

const STREAMS = [
  {
    id: "nasatv",
    label: "NASA TV",
    icon: "🚀",
    embedSrc: "https://www.youtube.com/embed/live_stream?channel=UCLA_DiR1FfKNvjuUpBHmylQ&autoplay=1&rel=0&modestbranding=1",
    externalUrl: "https://www.youtube.com/@NASA/live",
    description: "NASA TV · Official channel",
    footerNote: "NASA TV PUBLIC CHANNEL · MISSION COVERAGE PREEMPTS REGULAR PROGRAMMING",
    footerLink: "nasa.gov/nasatv",
    footerHref: "https://www.nasa.gov/nasatv",
  },
  {
    id: "mission",
    label: "MISSION FEED",
    icon: "📡",
    embedSrc: "https://www.youtube.com/embed/6PUAd0Bj1UA?autoplay=1&rel=0&modestbranding=1",
    externalUrl: "https://www.youtube.com/live/6PUAd0Bj1UA",
    description: "Mission Live Feed",
    footerNote: "LIVE MISSION STREAM · ARTEMIS II COVERAGE",
    footerLink: "youtube.com/live ↗",
    footerHref: "https://www.youtube.com/live/6PUAd0Bj1UA",
  },
];

function StreamPlayer({ stream }) {
  const [loaded, setLoaded] = useState(false);
  const [activated, setActivated] = useState(true);

  // Reset state when stream changes
  // (key prop on parent handles this — see below)

  return (
    <div style={{ position: "relative", paddingTop: "56.25%", backgroundColor: "#050d1a" }}>
      {!activated ? (
        <div
          onClick={() => setActivated(true)}
          style={{
            position: "absolute", inset: 0,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            cursor: "pointer",
            background: "radial-gradient(ellipse at center, #0a1a2a 0%, #050d1a 100%)",
            gap: 16,
          }}
        >
          <div style={{
            width: 80, height: 80, borderRadius: "50%",
            border: "2px solid #00d4ff22",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 30px #00d4ff11",
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              border: "2px solid #00d4ff44",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: 28, lineHeight: 1 }}>▶</span>
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{
              fontFamily: "'Orbitron', monospace",
              color: "#4a7fa5", fontSize: 10,
              letterSpacing: "0.15em", textTransform: "uppercase",
              marginBottom: 6,
            }}>
              {stream.description}
            </p>
            <p style={{ color: "#2a4a6a", fontSize: 9, fontFamily: "'Orbitron', monospace" }}>
              Click to load stream
            </p>
          </div>
        </div>
      ) : (
        <>
          {!loaded && (
            <div style={{
              position: "absolute", inset: 0,
              backgroundColor: "#050d1a",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <p style={{ color: "#2a4a6a", fontFamily: "'Orbitron', monospace", fontSize: 9, letterSpacing: "0.1em" }}>
                LOADING STREAM…
              </p>
            </div>
          )}
          <iframe
            title={stream.label}
            src={stream.embedSrc}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            onLoad={() => setLoaded(true)}
            style={{
              position: "absolute", inset: 0,
              width: "100%", height: "100%",
              border: "none",
              opacity: loaded ? 1 : 0,
              transition: "opacity 0.4s",
            }}
          />
        </>
      )}
    </div>
  );
}

export default function NasaTVCard() {
  const [activeId, setActiveId] = useState("nasatv");
  const active = STREAMS.find(s => s.id === activeId);

  return (
    <div
      className="glow-border rounded-xl overflow-hidden"
      style={{
        backgroundColor: "#0a1628",
        border: "1px solid #1a3a5c",
        boxShadow: "0 0 24px #00d4ff08",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-5 py-3"
        style={{ borderBottom: "1px solid #1a3a5c" }}
      >
        <span style={{ fontSize: 16 }}>📺</span>
        <span
          className="text-xs uppercase tracking-widest font-bold"
          style={{ color: "#4a7fa5", fontFamily: "'Orbitron', monospace" }}
        >
          Live Streams
        </span>

        {/* LIVE badge */}
        <span
          className="flex items-center gap-1.5 px-2 py-0.5 rounded-full"
          style={{
            border: "1px solid #ff333355",
            backgroundColor: "#1a0000",
            fontFamily: "'Orbitron', monospace",
            fontSize: "0.55rem",
            color: "#ff3333",
          }}
        >
          <span style={{
            width: 5, height: 5, borderRadius: "50%",
            backgroundColor: "#ff3333",
            boxShadow: "0 0 6px #ff3333",
            display: "inline-block",
          }} />
          LIVE
        </span>

        {/* External link for active stream */}
        <a
          href={active.externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            marginLeft: "auto",
            color: "#2a4a6a", fontSize: 11,
            textDecoration: "none",
            border: "1px solid #1a3a5c",
            borderRadius: 5,
            padding: "3px 8px",
            fontFamily: "'Orbitron', monospace",
            letterSpacing: "0.05em",
            transition: "color 0.2s, border-color 0.2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.color = "#4a7fa5"; e.currentTarget.style.borderColor = "#00d4ff44"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "#2a4a6a"; e.currentTarget.style.borderColor = "#1a3a5c"; }}
        >
          ↗ YouTube
        </a>
      </div>

      {/* Tab switcher */}
      <div
        className="flex"
        style={{ borderBottom: "1px solid #1a3a5c", backgroundColor: "#050d1a" }}
      >
        {STREAMS.map(s => {
          const isActive = s.id === activeId;
          return (
            <button
              key={s.id}
              onClick={() => setActiveId(s.id)}
              style={{
                flex: 1,
                padding: "8px 0",
                background: "none",
                border: "none",
                borderBottom: isActive ? "2px solid #00d4ff" : "2px solid transparent",
                color: isActive ? "#00d4ff" : "#2a4a6a",
                fontFamily: "'Orbitron', monospace",
                fontSize: 8,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                cursor: "pointer",
                transition: "color 0.2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
              }}
            >
              <span>{s.icon}</span>
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Player — keyed by stream id so it fully remounts on switch */}
      <StreamPlayer key={activeId} stream={active} />

      {/* Footer */}
      <div
        className="px-5 py-2 flex items-center justify-between"
        style={{ borderTop: "1px solid #1a3a5c" }}
      >
        <p style={{ color: "#2a4a6a", fontFamily: "'Orbitron', monospace", fontSize: 6.5, letterSpacing: "0.08em" }}>
          {active.footerNote}
        </p>
        <a
          href={active.footerHref}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#2a4a6a", fontSize: 6.5, fontFamily: "'Orbitron', monospace", textDecoration: "none" }}
          onMouseEnter={e => { e.currentTarget.style.color = "#4a7fa5"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "#2a4a6a"; }}
        >
          {active.footerLink}
        </a>
      </div>
    </div>
  );
}
