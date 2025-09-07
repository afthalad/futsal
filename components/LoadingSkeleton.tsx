export default function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
          {/* Image skeleton */}
          <div className="h-40 sm:h-48 bg-gray-200"></div>
          
          {/* Content skeleton */}
          <div className="p-3 sm:p-4">
            <div className="h-4 sm:h-5 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 sm:h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
            <div className="h-3 sm:h-4 bg-gray-200 rounded mb-3 w-1/2"></div>
            
            {/* Price skeleton */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-3">
              <div className="h-3 sm:h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-3 sm:h-4 bg-gray-200 rounded w-16"></div>
            </div>
            
            {/* Button skeleton */}
            <div className="h-8 sm:h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  )
}
