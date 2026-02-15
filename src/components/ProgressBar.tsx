import './ProgressBar.css'

interface ProgressBarProps {
  value: number
  max: number
  'aria-label'?: string
}

export default function ProgressBar({ value, max, 'aria-label': ariaLabel }: ProgressBarProps) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div
      className="progress-bar"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={ariaLabel ?? `Checklist progress: ${value} of ${max} tasks`}
    >
      <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
      <span className="progress-bar-text">{value} / {max}</span>
    </div>
  )
}
