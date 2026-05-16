export default function Loading() {
  return (
    <div className="w-full space-y-6 animate-pulse">
      {/* Welcome banner skeleton */}
      <div className="h-32 rounded-2xl bg-gray-200" />
      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-gray-100 bg-white p-5">
            <div className="mb-2 h-8 w-16 rounded-lg bg-gray-200" />
            <div className="h-3.5 w-3/4 rounded bg-gray-100" />
          </div>
        ))}
      </div>
      {/* Menu cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex gap-4 rounded-xl border border-gray-100 bg-white p-5">
            <div className="h-10 w-10 shrink-0 rounded-lg bg-gray-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-2/3 rounded bg-gray-200" />
              <div className="h-3 w-full rounded bg-gray-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
