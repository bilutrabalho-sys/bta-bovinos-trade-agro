let _ctx: AudioContext | null = null

function ctx(): AudioContext {
  if (!_ctx) _ctx = new AudioContext()
  return _ctx
}

function resume() {
  const c = ctx()
  if (c.state === 'suspended') c.resume()
}

function osc(
  freq: number,
  type: OscillatorType,
  duration: number,
  gain = 0.18,
  freqEnd?: number,
  delay = 0,
) {
  const c = ctx()
  const o = c.createOscillator()
  const g = c.createGain()
  const t = c.currentTime + delay
  o.connect(g)
  g.connect(c.destination)
  o.type = type
  o.frequency.setValueAtTime(freq, t)
  if (freqEnd !== undefined) o.frequency.exponentialRampToValueAtTime(freqEnd, t + duration * 0.7)
  g.gain.setValueAtTime(0.001, t)
  g.gain.linearRampToValueAtTime(gain, t + 0.008)
  g.gain.exponentialRampToValueAtTime(0.001, t + duration)
  o.start(t)
  o.stop(t + duration)
}

function noise(duration: number, gain = 0.06, delay = 0) {
  const c = ctx()
  const buf = c.createBuffer(1, c.sampleRate * duration, c.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1)
  const src = c.createBufferSource()
  const filter = c.createBiquadFilter()
  const g = c.createGain()
  src.buffer = buf
  filter.type = 'bandpass'
  filter.frequency.value = 800
  filter.Q.value = 0.8
  src.connect(filter)
  filter.connect(g)
  g.connect(c.destination)
  const t = c.currentTime + delay
  g.gain.setValueAtTime(gain, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + duration)
  src.start(t)
  src.stop(t + duration)
}

export const sounds = {
  tap() {
    resume()
    osc(620, 'sine', 0.12, 0.14)
    osc(920, 'sine', 0.06, 0.06)
  },

  cta() {
    resume()
    osc(520, 'sine', 0.18, 0.18)
    osc(780, 'sine', 0.12, 0.1, undefined, 0.02)
  },

  nav() {
    resume()
    osc(440, 'sine', 0.09, 0.10)
  },

  toggle() {
    resume()
    osc(1100, 'square', 0.06, 0.08, 800)
    noise(0.05, 0.04)
  },

  success() {
    resume()
    const notes = [523, 659, 784]
    notes.forEach((f, i) => osc(f, 'sine', 0.22, 0.15, undefined, i * 0.09))
  },

  back() {
    resume()
    osc(380, 'sine', 0.09, 0.09, 300)
  },

  select() {
    resume()
    osc(750, 'sine', 0.08, 0.10)
  },

  error() {
    resume()
    osc(260, 'sawtooth', 0.12, 0.09, 200)
  },
}

export type SoundKey = keyof typeof sounds
