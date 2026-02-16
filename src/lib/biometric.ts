import { Capacitor } from '@capacitor/core'

/**
 * Biometric authentication utilities
 */

export interface BiometricResult {
  success: boolean
  error?: string
}

let NativeBiometric: any = null

// Lazy load the biometric plugin
async function loadBiometricPlugin() {
  if (!Capacitor.isNativePlatform()) return null
  if (NativeBiometric) return NativeBiometric
  
  try {
    const module = await import('capacitor-native-biometric')
    NativeBiometric = module.NativeBiometric
    return NativeBiometric
  } catch {
    return null
  }
}

/**
 * Check if biometric authentication is available
 */
export async function checkBiometricAvailability(): Promise<{
  isAvailable: boolean
  biometryType?: 'fingerprint' | 'face' | 'iris' | 'none'
}> {
  if (!Capacitor.isNativePlatform()) {
    return { isAvailable: false }
  }

  try {
    const plugin = await loadBiometricPlugin()
    if (!plugin) return { isAvailable: false }
    
    const result = await plugin.checkBiometry()
    return {
      isAvailable: result.isAvailable ?? false,
      biometryType: result.biometryType as 'fingerprint' | 'face' | 'iris' | 'none' | undefined
    }
  } catch (error) {
    console.error('Failed to check biometric availability:', error)
    return { isAvailable: false }
  }
}

/**
 * Authenticate using biometrics
 */
export async function authenticateBiometric(
  reason: string = 'Authenticate to access the app'
): Promise<BiometricResult> {
  if (!Capacitor.isNativePlatform()) {
    return { success: false, error: 'Biometric authentication only available on native platforms' }
  }

  try {
    const plugin = await loadBiometricPlugin()
    if (!plugin) {
      return { success: false, error: 'Biometric plugin not available' }
    }

    const available = await checkBiometricAvailability()
    if (!available.isAvailable) {
      return { success: false, error: 'Biometric authentication not available on this device' }
    }

    await plugin.verifyIdentity({
      reason,
      title: 'Biometric Authentication',
      subtitle: 'Please authenticate to continue',
      description: reason
    })

    return { success: true }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Authentication failed'
    return { success: false, error: errorMessage }
  }
}

/**
 * Check if biometrics are enabled in settings
 */
export function getBiometricEnabled(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return localStorage.getItem('preflight-settings-biometric') === 'true'
  } catch {
    return false
  }
}

/**
 * Set biometric enabled preference
 */
export function setBiometricEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem('preflight-settings-biometric', enabled ? 'true' : 'false')
  } catch {
    // Ignore errors
  }
}
