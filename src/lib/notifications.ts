import { LocalNotifications } from '@capacitor/local-notifications'
import { Capacitor } from '@capacitor/core'

/**
 * Native Android notifications utility
 */

export type NotificationChannel = 'opmode' | 'checklist' | 'general'

const CHANNEL_IDS: Record<NotificationChannel, string> = {
  opmode: 'preflight-opmode',
  checklist: 'preflight-checklist',
  general: 'preflight-general'
}

const CHANNEL_NAMES: Record<NotificationChannel, string> = {
  opmode: 'Op Mode Reminders',
  checklist: 'Checklist Updates',
  general: 'General Notifications'
}

/**
 * Initialize notification channels (Android)
 */
export async function initializeNotificationChannels(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return

  try {
    // Create notification channels for Android
    await LocalNotifications.createChannel({
      id: CHANNEL_IDS.opmode,
      name: CHANNEL_NAMES.opmode,
      description: 'Reminders for restock, hydrate, and refuel during Op Mode',
      importance: 4, // High importance
      sound: 'default',
      vibration: true
    })

    await LocalNotifications.createChannel({
      id: CHANNEL_IDS.checklist,
      name: CHANNEL_NAMES.checklist,
      description: 'Updates and reminders for checklist completion',
      importance: 3, // Default importance
      sound: 'default',
      vibration: false
    })

    await LocalNotifications.createChannel({
      id: CHANNEL_IDS.general,
      name: CHANNEL_NAMES.general,
      description: 'General app notifications',
      importance: 3, // Default importance
      sound: 'default',
      vibration: false
    })
  } catch (error) {
    console.error('Failed to create notification channels:', error)
  }
}

/**
 * Request notification permissions
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    // Fallback to web notifications
    if (typeof Notification !== 'undefined') {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }
    return false
  }

  try {
    const result = await LocalNotifications.requestPermissions()
    return result.display === 'granted'
  } catch (error) {
    console.error('Failed to request notification permission:', error)
    return false
  }
}

/**
 * Check if notifications are enabled
 */
export async function checkNotificationPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    if (typeof Notification !== 'undefined') {
      return Notification.permission === 'granted'
    }
    return false
  }

  try {
    const result = await LocalNotifications.checkPermissions()
    return result.display === 'granted'
  } catch (error) {
    console.error('Failed to check notification permission:', error)
    return false
  }
}

/**
 * Show a notification
 */
export async function showNotification(
  title: string,
  body: string,
  channel: NotificationChannel = 'general',
  options?: {
    id?: number
    sound?: string
    vibration?: boolean
    actions?: Array<{ id: string; title: string }>
  }
): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    // Fallback to web notifications
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification(title, { body })
    }
    return
  }

  try {
    const hasPermission = await checkNotificationPermission()
    if (!hasPermission) {
      console.warn('Notification permission not granted')
      return
    }

    await LocalNotifications.schedule({
      notifications: [
        {
          title,
          body,
          id: options?.id ?? Date.now() % 2147483647, // Max safe int for notification ID
          channelId: CHANNEL_IDS[channel],
          sound: options?.sound,
          attachments: undefined,
          actionTypeId: options?.actions ? 'ACTION_TYPE' : undefined,
          extra: undefined
        }
      ]
    })
  } catch (error) {
    console.error('Failed to show notification:', error)
  }
}

/**
 * Cancel a notification by ID
 */
export async function cancelNotification(id: number): Promise<void> {
  if (!Capacitor.isNativePlatform()) return

  try {
    await LocalNotifications.cancel({ notifications: [{ id }] })
  } catch (error) {
    console.error('Failed to cancel notification:', error)
  }
}

/**
 * Cancel all notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return

  try {
    await LocalNotifications.cancelAll()
  } catch (error) {
    console.error('Failed to cancel all notifications:', error)
  }
}

/**
 * Get pending notifications
 */
export async function getPendingNotifications(): Promise<Array<{ id: number; title?: string; body?: string }>> {
  if (!Capacitor.isNativePlatform()) return []

  try {
    const result = await LocalNotifications.getPending()
    return result.notifications ?? []
  } catch (error) {
    console.error('Failed to get pending notifications:', error)
    return []
  }
}
