export default function Loading() {
  return (
    <div className="w-full space-y-5 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-6 w-48 rounded-lg bg-gray-200" />
        <div className="h-3.5 w-28 rounded bg-gray-100" />
      </div>
      {/* Table skeleton */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
        <div className="border-b bg-gray-50 px-4 py-3 flex gap-4">
          {[3, 2, 2, 1, 2].map((w, i) => (
            <div key={i} className={`h-3.5 w-${w * 8} rounded bg-gray-200`} />
          ))}
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex gap-4 border-b px-4 py-3.5">
            <div className="h-4 w-32 rounded bg-gray-100" />
            <div className="h-4 w-20 rounded bg-gray-100" />
            <div className="h-4 w-24 rounded bg-gray-100" />
            <div className="h-4 w-16 rounded bg-gray-100" />
            <div className="h-4 w-12 rounded bg-gray-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
