import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { loadLastRun } from '../lib/presets'
import { generateChecklist } from '../lib/generateChecklist'
import { ROUTES } from '../constants/routes'

/**
 * Handles deep links from Android app shortcuts and other sources
 */
export default function DeepLinkHandler() {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    // Handle preflight:// deep links from Android shortcuts
    const handleDeepLink = () => {
      // Check if we're coming from a deep link (Android app shortcuts use custom URL scheme)
      // The URL might be in window.location or passed via Capacitor App plugin
      
      // For Android shortcuts, we check URL params or hash
      const searchParams = new URLSearchParams(location.search)
      const hash = location.hash.replace('#', '')
      
      // Handle resume last checklist shortcut
      if (searchParams.get('resume') === 'true' || hash.includes('resume=true')) {
        const lastRun = loadLastRun()
        if (lastRun && lastRun.crewRoles) {
          const checklist = generateChecklist(
            lastRun.shipId,
            lastRun.operationType,
            lastRun.crewRoles
          )
          navigate(ROUTES.CHECKLIST, {
            state: {
              checklist,
              shipId: lastRun.shipId,
              operationType: lastRun.operationType,
              crewRoles: lastRun.crewRoles,
              crewRoleCounts: lastRun.crewRoleCounts
            },
            replace: true
          })
          return
        }
      }
      
      // Handle other deep link paths if needed
      // The Android manifest intent-filter will handle preflight:// URLs
      // and Capacitor will convert them to regular navigation
    }

    // Only run on mount or when location changes significantly
    if (location.pathname === '/' || location.search.includes('resume')) {
      handleDeepLink()
    }
  }, [navigate, location.pathname, location.search])

  return null
}
