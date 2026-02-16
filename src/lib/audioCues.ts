/**
 * Optional audio feedback for task completion, OpMode reminders, and errors.
 * Uses Web Audio API so no asset files are required. Respects user preference (sound effects on/off).
 */

import { getSettings } from './settings'

let audioContext: AudioContext | null = null

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    } catch {
      return null
    }
  }
  return audioContext
}

function playTone(frequency: number, durationMs: number, type: OscillatorType = 'sine'): void {
  if (!getSettings().soundEffects) return
  const ctx = getContext()
  if (!ctx) return
  try {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = type
    osc.frequency.value = frequency
    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + durationMs / 1000)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + durationMs / 1000)
  } catch {
    // Ignore if audio fails (e.g. autoplay policy)
  }
}

/**
 * Play a short positive cue (e.g. task completed).
 */
export function playTaskComplete(): void {
  playTone(523, 80)
}

/**
 * Play a cue for OpMode reminder.
 */
export function playOpModeReminder(): void {
  playTone(440, 120)
}

/**
 * Play an error cue (lower, slightly longer).
 */
export function playError(): void {
  playTone(220, 150, 'square')
}
