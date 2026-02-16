import { LocalNotifications } from '@capacitor/local-notifications'
import { Capacitor } from '@capacitor/core'

/**
 * Native Android notifications utility
 */

export type NotificationChannel = 'opmode' | 'checklist' | 'general'

export interface ChannelSettings {
  sound: boolean
  vibration: boolean
}

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

const CHANNEL_DESCRIPTIONS: Record<NotificationChannel, string> = {
  opmode: 'Reminders for restock, hydrate, and refuel during Op Mode',
  checklist: 'Updates and reminders for checklist completion',
  general: 'General app notifications'
}

const DEFAULT_CHANNEL_SETTINGS: Record<NotificationChannel, ChannelSettings> = {
  opmode: { sound: true, vibration: true },
  checklist: { sound: true, vibration: false },
  general: { sound: true, vibration: false }
}

const STORAGE_PREFIX = 'preflight-channel-'

function getStoredChannelSettings(channel: NotificationChannel): ChannelSettings {
  if (typeof window === 'undefined') return DEFAULT_CHANNEL_SETTINGS[channel]
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${channel}`)
    if (!raw) return DEFAULT_CHANNEL_SETTINGS[channel]
    const parsed = JSON.parse(raw) as unknown
    if (parsed && typeof parsed === 'object' && 'sound' in parsed && 'vibration' in parsed) {
      return {
        sound: Boolean((parsed as ChannelSettings).sound),
        vibration: Boolean((parsed as ChannelSettings).vibration)
      }
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_CHANNEL_SETTINGS[channel]
}

export function getChannelSettings(channel: NotificationChannel): ChannelSettings {
  return getStoredChannelSettings(channel)
}

export function setChannelSettings(channel: NotificationChannel, settings: Partial<ChannelSettings>): void {
  if (typeof window === 'undefined') return
  try {
    const current = getStoredChannelSettings(channel)
    const next: ChannelSettings = { ...current, ...settings }
    localStorage.setItem(`${STORAGE_PREFIX}${channel}`, JSON.stringify(next))
  } catch {
    /* ignore */
  }
}

async function createOneChannel(channel: NotificationChannel): Promise<void> {
  const settings = getStoredChannelSettings(channel)
  const importance = channel === 'opmode' ? 4 : 3
  await LocalNotifications.createChannel({
    id: CHANNEL_IDS[channel],
    name: CHANNEL_NAMES[channel],
    description: CHANNEL_DESCRIPTIONS[channel],
    importance,
    sound: settings.sound ? 'default' : undefined,
    vibration: settings.vibration
  })
}

/**
 * Initialize notification channels (Android) using stored per-channel settings
 */
export async function initializeNotificationChannels(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return

  try {
    await createOneChannel('opmode')
    await createOneChannel('checklist')
    await createOneChannel('general')
  } catch (error) {
    console.error('Failed to create notification channels:', error)
  }
}

/**
 * Update one channel's settings and re-create the channel so new notifications use them
 */
export async function updateChannelSettingsAndRecreate(channel: NotificationChannel, settings: ChannelSettings): Promise<void> {
  setChannelSettings(channel, settings)
  if (!Capacitor.isNativePlatform()) return
  try {
    await createOneChannel(channel)
  } catch (error) {
    console.error('Failed to update notification channel:', error)
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
    // Get all pending notifications and cancel them individually
    const pending = await LocalNotifications.getPending()
    if (pending.notifications && pending.notifications.length > 0) {
      await LocalNotifications.cancel({
        notifications: pending.notifications.map((n) => ({ id: n.id }))
      })
    }
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
