import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'
import { Capacitor } from '@capacitor/core'

/**
 * Haptic feedback utility for Android app
 * Provides tactile feedback for different user actions
 */

export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error'

/**
 * Trigger haptic feedback
 * @param type - Type of haptic feedback to trigger
 */
export async function triggerHaptic(type: HapticType = 'medium'): Promise<void> {
  // Only trigger on native platforms (Android/iOS)
  if (!Capacitor.isNativePlatform()) {
    return
  }

  try {
    switch (type) {
      case 'light':
        await Haptics.impact({ style: ImpactStyle.Light })
        break
      case 'medium':
        await Haptics.impact({ style: ImpactStyle.Medium })
        break
      case 'heavy':
        await Haptics.impact({ style: ImpactStyle.Heavy })
        break
      case 'success':
        await Haptics.notification({ type: NotificationType.Success })
        break
      case 'warning':
        await Haptics.notification({ type: NotificationType.Warning })
        break
      case 'error':
        await Haptics.notification({ type: NotificationType.Error })
        break
    }
  } catch (error) {
    // Silently fail if haptics are not available
    console.debug('Haptics not available:', error)
  }
}

/**
 * Trigger haptic feedback for button press
 */
export function hapticButtonPress(): void {
  triggerHaptic('light')
}

/**
 * Trigger haptic feedback for task completion
 */
export function hapticTaskComplete(): void {
  triggerHaptic('success')
}

/**
 * Trigger haptic feedback for error
 */
export function hapticError(): void {
  triggerHaptic('error')
}
