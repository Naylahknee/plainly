export default function LoadingSkeleton({ rows = 4, label = 'Loading' }) {
  return (
    <div className="loading-skeleton" role="status" aria-label={label}>
      {Array.from({ length: rows }, (_, index) => (
        <div className="loading-skeleton__row" key={index}>
          <span className="loading-skeleton__line loading-skeleton__line--title" />
          <span className="loading-skeleton__line loading-skeleton__line--body" />
          <span className="loading-skeleton__line loading-skeleton__line--meta" />
        </div>
      ))}
    </div>
  )
}
