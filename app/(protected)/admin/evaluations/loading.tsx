export default function Loading() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-6 w-40 rounded-lg bg-gray-200" />
        <div className="h-9 w-28 rounded-lg bg-gray-200" />
      </div>
      {/* Filter row */}
      <div className="flex gap-3">
        {[40, 32, 56, 24].map((w, i) => (
          <div key={i} className={`h-9 w-${w} rounded-lg bg-gray-100`} />
        ))}
      </div>
      {/* Table */}
      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <div className="border-b bg-gray-50 px-4 py-3 flex gap-4">
          {[4, 3, 3, 3, 2, 2, 1].map((w, i) => (
            <div key={i} className={`h-3.5 w-${w * 6} rounded bg-gray-200`} />
          ))}
        </div>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex gap-4 border-b px-4 py-3.5">
            <div className="h-4 w-28 rounded bg-gray-100" />
            <div className="h-4 w-32 rounded bg-gray-100" />
            <div className="h-4 w-20 rounded bg-gray-100" />
            <div className="h-4 w-24 rounded bg-gray-100" />
            <div className="h-4 w-16 rounded bg-gray-200" />
            <div className="h-4 w-10 rounded bg-gray-100" />
            <div className="h-6 w-20 rounded-lg bg-gray-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
