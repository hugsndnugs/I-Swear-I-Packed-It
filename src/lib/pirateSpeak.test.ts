import { describe, it, expect } from 'vitest'
import { pirateSpeak } from './pirateSpeak'

describe('pirateSpeak', () => {
  it('returns original when disabled', () => {
    expect(pirateSpeak('Start Pre-Flight', false)).toBe('Start Pre-Flight')
    expect(pirateSpeak('Cargo run', false)).toBe('Cargo run')
  })

  it('returns pirate version when enabled for known labels', () => {
    expect(pirateSpeak('Start Pre-Flight', true)).toBe('Weigh Anchor')
    expect(pirateSpeak('Cargo run', true)).toBe('Haul')
    expect(pirateSpeak('Ship readiness', true)).toBe('Ship shape')
    expect(pirateSpeak('Pack List', true)).toBe('Sea Chest')
    expect(pirateSpeak('Home', true)).toBe('Quarterdeck')
  })

  it('returns original when enabled but no mapping', () => {
    expect(pirateSpeak('Unknown label', true)).toBe('Unknown label')
  })

  it('returns original for empty string', () => {
    expect(pirateSpeak('', true)).toBe('')
  })
})
