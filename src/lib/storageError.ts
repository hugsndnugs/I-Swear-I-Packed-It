let error: string | null = null
const listeners: Array<() => void> = []

export function getStorageError(): string | null {
  return error
}

export function setStorageError(msg: string | null): void {
  error = msg
  listeners.forEach((l) => l())
}

export function subscribeStorageError(listener: () => void): () => void {
  listeners.push(listener)
  return () => {
    const i = listeners.indexOf(listener)
    if (i !== -1) listeners.splice(i, 1)
  }
}
