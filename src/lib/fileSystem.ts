import { Filesystem, Directory, Encoding } from '@capacitor/filesystem'
import { Capacitor } from '@capacitor/core'

/**
 * File system utilities for Android app
 */

/**
 * Write file to Downloads directory (Android)
 */
export async function writeToDownloads(
  filename: string,
  content: string,
  encoding: 'utf8' | 'base64' = 'utf8'
): Promise<{ uri: string }> {
  if (!Capacitor.isNativePlatform()) {
    // Fallback: download via browser
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    return { uri: url }
  }

  try {
    const result = await Filesystem.writeFile({
      path: filename,
      data: content,
      directory: Directory.Documents, // Use Documents as Downloads may require special permissions
      encoding: encoding === 'utf8' ? Encoding.UTF8 : Encoding.UTF8
    })
    return { uri: result.uri }
  } catch (error) {
    console.error('Failed to write file:', error)
    throw error
  }
}

/**
 * Read file from file system
 */
export async function readFile(path: string): Promise<string> {
  if (!Capacitor.isNativePlatform()) {
    throw new Error('File reading only available on native platforms')
  }

  try {
    const result = await Filesystem.readFile({
      path,
      directory: Directory.Documents,
      encoding: Encoding.UTF8
    })
    return result.data as string
  } catch (error) {
    console.error('Failed to read file:', error)
    throw error
  }
}

/**
 * Check if file exists
 */
export async function fileExists(path: string): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    return false
  }

  try {
    await Filesystem.stat({
      path,
      directory: Directory.Documents
    })
    return true
  } catch {
    return false
  }
}

/**
 * Delete file
 */
export async function deleteFile(path: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return
  }

  try {
    await Filesystem.deleteFile({
      path,
      directory: Directory.Documents
    })
  } catch (error) {
    console.error('Failed to delete file:', error)
    throw error
  }
}

/**
 * List files in directory
 */
export async function listFiles(directory: Directory = Directory.Documents): Promise<string[]> {
  if (!Capacitor.isNativePlatform()) {
    return []
  }

  try {
    const result = await Filesystem.readdir({
      path: '',
      directory
    })
    return result.files.map((f) => f.name)
  } catch (error) {
    console.error('Failed to list files:', error)
    return []
  }
}
