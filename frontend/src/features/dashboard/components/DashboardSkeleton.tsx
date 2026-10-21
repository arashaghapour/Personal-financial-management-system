/**
 * Loading placeholder for the dashboard. The visually hidden text is announced
 * by assistive technology while the requests are in flight.
 */
export function DashboardSkeleton() {
  return (
    <div
      className="dashboard-skeleton"
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">Loading dashboard</span>

      <div className="dashboard-skeleton-grid" aria-hidden="true">
        {Array.from({ length: 4 }, (_, index) => (
          <div className="dashboard-skeleton-card" key={index}>
            <span className="dashboard-skeleton-line dashboard-skeleton-line--short" />
            <span className="dashboard-skeleton-line dashboard-skeleton-line--value" />
          </div>
        ))}
      </div>

      <div className="dashboard-skeleton-panels" aria-hidden="true">
        {Array.from({ length: 3 }, (_, index) => (
          <div className="dashboard-skeleton-panel" key={index}>
            <span className="dashboard-skeleton-line dashboard-skeleton-line--short" />
            <span className="dashboard-skeleton-line" />
            <span className="dashboard-skeleton-line" />
          </div>
        ))}
      </div>
    </div>
  );
}
