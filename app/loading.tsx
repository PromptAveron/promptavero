export default function Loading() {
  return (
    <div
      role="status"
      aria-label="Loading page"
      aria-busy="true"
      className="container-page py-8 sm:py-12"
    >
      <div aria-hidden="true" className="h-4 w-32 animate-pulse rounded bg-muted" />
      <div aria-hidden="true" className="mt-8 h-9 w-2/3 animate-pulse rounded-lg bg-muted" />
      <div aria-hidden="true" className="mt-3 h-4 max-w-xl animate-pulse rounded bg-muted" />
      <div aria-hidden="true" className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="aspect-[3/4] animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    </div>
  )
}
