import { Capacitor } from '@capacitor/core'
import type { OpModeState } from './opModeTimers'

type CapacitorWithPlugins = typeof Capacitor & {
  Plugins?: Record<string, { writeStateAndSchedule?: (opts: { state: string }) => Promise<void>; clearStateAndCancel?: () => Promise<void> }>
}

/**
 * Sync OpMode state to native Android so WorkManager can show reminders when app is backgrounded or killed.
 */
export async function syncOpModeToNative(state: OpModeState | null): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  const plugin = (Capacitor as CapacitorWithPlugins).Plugins?.['OpModeBackground']
  if (!plugin?.writeStateAndSchedule) return
  try {
    const json = JSON.stringify(state)
    await plugin.writeStateAndSchedule({ state: json })
  } catch {
    // Ignore; OpMode still works in foreground
  }
}

/**
 * Clear native OpMode state and cancel scheduled WorkManager work.
 */
export async function clearOpModeNativeSync(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  const plugin = (Capacitor as CapacitorWithPlugins).Plugins?.['OpModeBackground']
  if (!plugin?.clearStateAndCancel) return
  try {
    await plugin.clearStateAndCancel()
  } catch {
    // Ignore
  }
}
