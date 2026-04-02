import { useEffect, useRef } from "react";

// ── Tone synthesiser using Web Audio API ──────────────────────────────────────
// No external library needed — generates beeps/chimes inline.

let _ctx = null;
function getAudioCtx() {
  if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
  return _ctx;
}

function playTone({ freq = 880, type = "sine", duration = 0.18, gain = 0.25, delay = 0 } = {}) {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.connect(env);
    env.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
    env.gain.setValueAtTime(0, ctx.currentTime + delay);
    env.gain.linearRampToValueAtTime(gain, ctx.currentTime + delay + 0.01);
    env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration + 0.05);
  } catch { /* audio blocked */ }
}

// Three-note ascending chime
function playMilestoneChime() {
  playTone({ freq: 523.25, duration: 0.2, delay: 0    }); // C5
  playTone({ freq: 659.25, duration: 0.2, delay: 0.18 }); // E5
  playTone({ freq: 783.99, duration: 0.3, delay: 0.36 }); // G5
}

// Two-tone alert for TLI
function playTLIAlert() {
  playTone({ freq: 440, type: "square", gain: 0.15, duration: 0.12, delay: 0    });
  playTone({ freq: 880, type: "square", gain: 0.15, duration: 0.12, delay: 0.14 });
  playTone({ freq: 440, type: "square", gain: 0.15, duration: 0.12, delay: 0.28 });
}

// ── Phase change detector ─────────────────────────────────────────────────────
/**
 * Fires audio when the mission phase changes.
 * @param {string} phase   — current phase key
 * @param {boolean} enabled — user setting
 */
export function useMilestoneAlerts(phase, enabled = true) {
  const prevPhaseRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;
    if (prevPhaseRef.current === null) {
      // Don't fire on first mount
      prevPhaseRef.current = phase;
      return;
    }
    if (phase === prevPhaseRef.current) return;

    prevPhaseRef.current = phase;

    if (phase === "TLI_BURN") {
      playTLIAlert();
    } else {
      playMilestoneChime();
    }
  }, [phase, enabled]);
}
