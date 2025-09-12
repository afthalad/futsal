'use client'

import { useState, useEffect } from 'react'
import { Search, MapPin, Filter } from 'lucide-react'
import Navbar from '@/components/Navbar'
import GroundCard from '@/components/GroundCard'
import LoadingSkeleton from '@/components/LoadingSkeleton'
// import PerformanceMonitor from '@/components/PerformanceMonitor'
import toast from 'react-hot-toast'

interface Ground {
  id: string
  name: string
  description: string | null
  location: string
  city: string
  images: string[]
  morningPrice: number
  eveningPrice: number
  amenities: string[]
  isActive: boolean
  _count: {
    bookings: number
  }
}

export default function HomePage() {
  const [grounds, setGrounds] = useState<Ground[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
  const [cities, setCities] = useState<string[]>([])

  useEffect(() => {
    // Initial load
    fetchGrounds()
  }, [])

  useEffect(() => {
    // Debounce search to avoid too many API calls
    const timeoutId = setTimeout(() => {
      if (search || selectedCity) {
        fetchGrounds()
      }
    }, 300) // 300ms delay

    return () => clearTimeout(timeoutId)
  }, [search, selectedCity])

  const fetchGrounds = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (selectedCity) params.append('city', selectedCity)

      const response = await fetch(`/api/grounds?${params}`)
      const data = await response.json()

      if (response.ok) {
        setGrounds(data.grounds.filter((ground: Ground) => ground.isActive))
        
        // Extract unique cities
        const uniqueCities = Array.from(new Set(data.grounds.map((ground: Ground) => ground.city)))
        setCities(uniqueCities as string[])
      } else {
        toast.error('Failed to load grounds')
      }
    } catch (error) {
      console.error('Error fetching grounds:', error)
      toast.error('Failed to load grounds')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Hero Section */}
     

      {/* Grounds Section */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-2">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
            Available Grounds
            {grounds.length > 0 && (
              <span className="text-base sm:text-lg font-normal text-gray-600 ml-1 sm:ml-2">
                ({grounds.length} found)
              </span>
            )}
          </h2>
        </div>

        {loading ? (
          <LoadingSkeleton />
        ) : grounds.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <div className="text-gray-400 mb-4">
              <Filter className="h-12 w-12 sm:h-16 sm:w-16 mx-auto" />
            </div>
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No grounds found</h3>
            <p className="text-sm sm:text-base text-gray-600 px-4">
              {search || selectedCity 
                ? 'Try adjusting your search criteria'
                : 'No grounds available at the moment'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {grounds.map((ground) => (
              <GroundCard key={ground.id} ground={ground} />
            ))}
          </div>
        )}
      </div>

      {/* Features Section */}
      <div className="bg-white py-8 sm:py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              Why Choose PuttalamGrounds?
            </h2>
            <p className="text-base sm:text-lg text-gray-600 px-4">
              The easiest way to book futsal grounds in Sri Lanka
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="text-center">
              <div className="bg-primary-100 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <MapPin className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                Multiple Locations
              </h3>
              <p className="text-sm sm:text-base text-gray-600 px-2">
                Find futsal grounds across all major cities in Sri Lanka
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary-100 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Search className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                Easy Booking
              </h3>
              <p className="text-sm sm:text-base text-gray-600 px-2">
                Simple and quick booking process with instant confirmations
              </p>
            </div>
            
            <div className="text-center sm:col-span-2 lg:col-span-1">
              <div className="bg-primary-100 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Filter className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                Best Prices
              </h3>
              <p className="text-sm sm:text-base text-gray-600 px-2">
                Competitive pricing with morning and evening rates
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 text-center">
          <h3 className="text-lg sm:text-xl font-bold mb-2">PuttalamGrounds</h3>
          <p className="text-sm sm:text-base text-gray-400">
            Book futsal grounds across Sri Lanka with ease
          </p>
        </div>
      </footer>

      {/* Performance Monitor (Development Only) */}
      {/* <PerformanceMonitor /> */}
    </div>
  )
}
