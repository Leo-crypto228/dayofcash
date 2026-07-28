// Synthesized sound effects via Web Audio API — no asset files, no network.
// All plays are triggered by user gestures (clicks), so the context unlocks.

let ctx = null
let enabled = true

function getCtx() {
  if (typeof window === 'undefined') return null
  try {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext
      if (!AC) return null
      ctx = new AC()
    }
    if (ctx.state === 'suspended') ctx.resume()
    return ctx
  } catch {
    return null
  }
}

export function setSoundEnabled(v) { enabled = !!v }
export function isSoundEnabled() { return enabled }

// One shaped oscillator note.
function note(c, { freq, start = 0, dur = 0.15, type = 'triangle', gain = 0.18, glideTo = null }) {
  const t0 = c.currentTime + start
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t0 + dur)
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(g).connect(c.destination)
  osc.start(t0)
  osc.stop(t0 + dur + 0.02)
}

// Bright coin/chime cluster — a couple of shimmering high partials.
function coin(c, start = 0, base = 1050, gain = 0.16) {
  note(c, { freq: base, start, dur: 0.12, type: 'square', gain })
  note(c, { freq: base * 1.5, start: start + 0.045, dur: 0.14, type: 'square', gain: gain * 0.9 })
}

// WIN — rising arpeggio + coin sparkle. Dopamine.
export function playWin() {
  if (!enabled) return
  const c = getCtx(); if (!c) return
  const notes = [523.25, 659.25, 783.99, 1046.5] // C5 E5 G5 C6
  notes.forEach((f, i) => note(c, { freq: f, start: i * 0.08, dur: 0.18, type: 'triangle', gain: 0.2 }))
  coin(c, 0.34, 1300, 0.14)
}

// CASH — register "cha-ching": two bright bell hits.
export function playCash() {
  if (!enabled) return
  const c = getCtx(); if (!c) return
  note(c, { freq: 880, start: 0, dur: 0.13, type: 'square', gain: 0.16 })
  note(c, { freq: 1174.7, start: 0.02, dur: 0.16, type: 'triangle', gain: 0.18 })
  coin(c, 0.12, 1568, 0.13)
}

// LOSE — short soft descending blip (subtle, non-annoying).
export function playLose() {
  if (!enabled) return
  const c = getCtx(); if (!c) return
  note(c, { freq: 330, start: 0, dur: 0.22, type: 'sine', gain: 0.12, glideTo: 150 })
}

// CLICK/coin tick for reveals (optional, very light).
export function playTick() {
  if (!enabled) return
  const c = getCtx(); if (!c) return
  note(c, { freq: 660, start: 0, dur: 0.06, type: 'triangle', gain: 0.08 })
}
