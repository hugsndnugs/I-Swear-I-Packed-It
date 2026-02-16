import { useState, useEffect } from 'react'
import { AlertCircle } from 'lucide-react'
import { getStorageError, setStorageError, subscribeStorageError } from '../lib/storageError'

export default function StorageErrorBanner() {
  const [error, setError] = useState<string | null>(() => getStorageError())

  useEffect(() => {
    setError(getStorageError())
    return subscribeStorageError(() => setError(getStorageError()))
  }, [])

  if (!error) return null

  return (
    <div className="storage-error-banner" role="alert">
      <AlertCircle size={20} className="storage-error-icon" aria-hidden />
      <p className="storage-error-text">{error}</p>
      <button
        type="button"
        className="storage-error-dismiss"
        onClick={() => setStorageError(null)}
        aria-label="Dismiss"
      >
        Dismiss
      </button>
    </div>
  )
}
