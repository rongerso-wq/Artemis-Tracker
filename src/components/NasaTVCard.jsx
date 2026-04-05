import React, { useState } from "react";

const STREAMS = [
  {
    id: "nasatv",
    label: "NASA TV",
    icon: "🚀",
    videoId: "21X5lGlDOfg",
    externalUrl: "https://www.youtube.com/@NASA/live",
    description: "NASA TV · Official Live Channel",
    footerNote: "NASA TV PUBLIC CHANNEL · MISSION COVERAGE PREEMPTS REGULAR PROGRAMMING",
    footerLink: "nasa.gov/nasatv",
    footerHref: "https://www.nasa.gov/nasatv",
  },
  {
    id: "mission",
    label: "MISSION FEED",
    icon: "📡",
    videoId: "6PUAd0Bj1UA",
    externalUrl: "https://www.youtube.com/live/6PUAd0Bj1UA",
    description: "Artemis II · Mission Live Feed",
    footerNote: "LIVE MISSION STREAM · ARTEMIS II COVERAGE",
    footerLink: "youtube.com/live ↗",
    footerHref: "https://www.youtube.com/live/6PUAd0Bj1UA",
  },
];

function StreamPlayer({ stream }) {
  const [playing, setPlaying] = useState(false);

  const embedSrc =
    `https://www.youtube-nocookie.com/embed/${stream.videoId}` +
    `?autoplay=1&mute=0&rel=0&modestbranding=1&playsinline=1&enablejsapi=1`;

  const thumb = `https://img.youtube.com/vi/${stream.videoId}/hqdefault.jpg`;

  return (
    <div style={{ position: "relative", paddingTop: "56.25%", backgroundColor: "#050d1a", overflow: "hidden" }}>
      {playing ? (
        <iframe
          title={stream.label}
          src={embedSrc}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          style={{
            position: "absolute", inset: 0,
            width: "100%", height: "100%",
            border: "none",
          }}
        />
      ) : (
        /* Poster / click-to-play */
        <div
          onClick={() => setPlaying(true)}
          style={{
            position: "absolute", inset: 0,
            cursor: "pointer",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            gap: 14,
            background: `linear-gradient(rgba(5,13,26,0.55), rgba(5,13,26,0.55)),
                         url(${thumb}) center/cover no-repeat`,
          }}
        >
          {/* Play button ring */}
          <div style={{
            width: 72, height: 72, borderRadius: "50%",
            background: "rgba(0,212,255,0.15)",
            border: "2px solid #00d4ff88",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 28px #00d4ff44",
            transition: "transform 0.15s",
          }}
            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
          >
            <span style={{ fontSize: 28, color: "#00d4ff", marginLeft: 4 }}>▶</span>
          </div>

          <div style={{ textAlign: "center" }}>
            <p style={{
              fontFamily: "'Orbitron', monospace",
              color: "#e0f0ff", fontSize: 10,
              letterSpacing: "0.15em", textTransform: "uppercase",
              marginBottom: 4,
              textShadow: "0 1px 6px #000",
            }}>
              {stream.description}
            </p>
            <p style={{
              color: "#00d4ffaa", fontSize: 9,
              fontFamily: "'Orbitron', monospace",
              letterSpacing: "0.1em",
            }}>
              CLICK TO WATCH LIVE
            </p>
          </div>
        </div>
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

      {/* Player — keyed by stream id so it fully remounts on tab switch */}
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
