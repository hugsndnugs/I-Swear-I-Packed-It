import './CircularProgress.css'

interface CircularProgressProps {
  value: number
  max: number
  size?: number
  strokeWidth?: number
  'aria-label'?: string
  showText?: boolean
}

export default function CircularProgress({
  value,
  max,
  size = 64,
  strokeWidth = 6,
  'aria-label': ariaLabel,
  showText = true
}: CircularProgressProps) {
  const percentage = max > 0 ? Math.min(Math.max((value / max) * 100, 0), 100) : 0
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference
  const isComplete = max > 0 && value >= max

  return (
    <div className="circular-progress" style={{ width: size, height: size }}>
      <svg
        className="circular-progress-svg"
        width={size}
        height={size}
        aria-hidden="true"
      >
        {/* Background circle */}
        <circle
          className="circular-progress-bg"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          className={`circular-progress-fill ${isComplete ? 'circular-progress-fill--complete' : ''}`}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      {showText && (
        <div className="circular-progress-text" aria-hidden="true">
          <span className="circular-progress-value">{Math.round(percentage)}</span>
          <span className="circular-progress-percent">%</span>
        </div>
      )}
      <span className="sr-only" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max} aria-label={ariaLabel ?? `Progress: ${value} of ${max}`}>
        {value} of {max}
      </span>
    </div>
  )
}
