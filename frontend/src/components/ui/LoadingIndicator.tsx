import '../../styles/ui.css'

type LoadingIndicatorProps = {
  /** Accessible text announced while loading. */
  label?: string
}

export function LoadingIndicator({ label = 'Loading…' }: LoadingIndicatorProps) {
  return (
    <div className="loading-indicator">
      <div className="spinner" role="status">
        <span className="sr-only">{label}</span>
      </div>
    </div>
  )
}
