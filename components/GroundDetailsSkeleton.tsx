'use client'

export default function GroundDetailsSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mobile Layout Skeleton */}
        <div className="block lg:hidden">
          <div className="bg-white rounded-lg shadow-sm border">
            {/* Header Skeleton */}
            <div className="p-4 sm:p-6">
              <div className="border-b border-gray-200 pb-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                  <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse mb-3"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                </div>
              </div>

              {/* Pricing Skeleton */}
              <div className="mt-4">
                <div className="grid grid-cols-3 gap-1 sm:gap-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="text-center p-2 bg-gray-100 rounded animate-pulse">
                      <div className="h-4 bg-gray-200 rounded mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded mt-1"></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Image Skeleton */}
              <div className="mt-4">
                <div className="h-48 bg-gray-200 rounded-lg animate-pulse"></div>
              </div>

              {/* Time Slots Skeleton */}
              <div className="mt-6">
                <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse mb-4"></div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="h-20 bg-gray-200 rounded animate-pulse"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Layout Skeleton */}
        <div className="hidden lg:block">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="border-b border-gray-200 pb-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="h-8 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                    <div className="h-10 w-10 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="h-5 bg-gray-200 rounded w-1/2 animate-pulse mb-3"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                  </div>
                </div>

                {/* Pricing Skeleton */}
                <div className="mt-6">
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="text-center p-2 bg-gray-100 rounded animate-pulse">
                        <div className="h-4 bg-gray-200 rounded mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded"></div>
                        <div className="h-3 bg-gray-200 rounded mt-1"></div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Image Skeleton */}
                <div className="mt-6">
                  <div className="h-64 bg-gray-200 rounded-lg animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="h-6 bg-gray-200 rounded w-1/2 animate-pulse mb-4"></div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2">
                  {Array.from({ length: 24 }).map((_, i) => (
                    <div key={i} className="h-20 bg-gray-200 rounded animate-pulse"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
