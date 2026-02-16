import { useEffect, useRef, useCallback } from 'react'

const KONAMI_SEQUENCE = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65] // ↑↑↓↓←→←→BA

export function useKonami(onSuccess: () => void): void {
  const indexRef = useRef(0)
  const onSuccessRef = useRef(onSuccess)
  onSuccessRef.current = onSuccess

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const expected = KONAMI_SEQUENCE[indexRef.current]
    if (e.keyCode === expected) {
      indexRef.current += 1
      if (indexRef.current === KONAMI_SEQUENCE.length) {
        indexRef.current = 0
        onSuccessRef.current()
      }
    } else {
      indexRef.current = 0
    }
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}
