import { useState } from 'react'
import { Zap, FileCheck, CheckCircle2 } from 'lucide-react'
import './FirstTimeTutorial.css'

const TUTORIAL_STORAGE_KEY = 'preflight_tutorial_done'

export function getTutorialDone(): boolean {
  try {
    return globalThis.localStorage?.getItem(TUTORIAL_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

export function setTutorialDone(): void {
  try {
    globalThis.localStorage?.setItem(TUTORIAL_STORAGE_KEY, 'true')
  } catch {
    /* ignore */
  }
}

interface FirstTimeTutorialProps {
  onDismiss: () => void
}

const STEPS = [
  { icon: Zap, title: 'Pick a ship', text: 'Choose your ship and operation type on the Generate screen.' },
  { icon: FileCheck, title: 'Generate checklist', text: 'Tap Generate to get your pre-flight checklist.' },
  { icon: CheckCircle2, title: 'Check off tasks', text: 'Swipe or tap tasks to complete them. Save presets for next time.' }
]

export default function FirstTimeTutorial({ onDismiss }: FirstTimeTutorialProps) {
  const [step, setStep] = useState(0)
  const current = STEPS[step]
  const Icon = current.icon
  const isLast = step === STEPS.length - 1

  const handleNext = () => {
    if (isLast) {
      setTutorialDone()
      onDismiss()
    } else {
      setStep((s) => s + 1)
    }
  }

  return (
    <div className="first-time-tutorial-overlay" role="dialog" aria-modal="true" aria-labelledby="tutorial-title">
      <div className="first-time-tutorial-card card">
        <h2 id="tutorial-title" className="first-time-tutorial-title">Quick start</h2>
        <div className="first-time-tutorial-step">
          <Icon size={32} className="first-time-tutorial-icon" aria-hidden />
          <h3 className="first-time-tutorial-step-title">{current.title}</h3>
          <p className="first-time-tutorial-step-text">{current.text}</p>
        </div>
        <div className="first-time-tutorial-dots" aria-hidden>
          {STEPS.map((s, i) => (
            <span
              key={s.title}
              className={`first-time-tutorial-dot ${i === step ? 'first-time-tutorial-dot--active' : ''}`}
            />
          ))}
        </div>
        <button
          type="button"
          className="first-time-tutorial-btn btn-primary"
          onClick={handleNext}
        >
          {isLast ? 'Got it' : 'Next'}
        </button>
      </div>
    </div>
  )
}
