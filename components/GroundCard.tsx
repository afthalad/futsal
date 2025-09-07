'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Clock, Star } from 'lucide-react'
import { formatPrice } from '@/lib/utils'

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

interface GroundCardProps {
  ground: Ground
}

export default function GroundCard({ ground }: GroundCardProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)
  const mainImage = ground.images?.[0] || '/placeholder-ground.jpg'
  const isDisabled = !ground.isActive

  const handleImageError = () => {
    setImageError(true)
    setImageLoading(false)
  }

  const handleImageLoad = () => {
    setImageLoading(false)
  }

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 ${isDisabled ? 'opacity-60' : ''}`}>
      <div className="relative h-40 sm:h-48 w-full overflow-hidden bg-gray-200">
        {imageLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary-600"></div>
          </div>
        )}
        {!imageError ? (
          <Image
            src={mainImage}
            alt={ground.name}
            fill
            className="object-cover transition-transform duration-300 hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            priority={false}
            onError={handleImageError}
            onLoad={handleImageLoad}
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
            <div className="text-center">
              <div className="text-2xl sm:text-4xl mb-1 sm:mb-2">🏟️</div>
              <p className="text-gray-500 text-xs sm:text-sm">No image available</p>
            </div>
          </div>
        )}
       
        {isDisabled && (
          <div className="absolute top-2 left-2 bg-red-500 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium">
            Disabled
          </div>
        )}
      </div>
      
      <div className="p-3 sm:p-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 line-clamp-1">
          {ground.name}
        </h3>
        
        <div className="flex items-center text-gray-600 text-xs sm:text-sm mb-2">
          <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
          <span className="line-clamp-1">{ground.location}, {ground.city}</span>
        </div>
        
        {ground.description && (
          <p className="text-gray-600 text-xs sm:text-sm mb-3 line-clamp-2">
            {ground.description}
          </p>
        )}
        
        <div className="mb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 text-xs sm:text-sm">
            <div className="flex items-center text-green-600">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
              <span className="truncate">Morning: {ground.morningPrice}</span>
            </div>
            <div className="flex items-center text-blue-600">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
              <span className="truncate">Evening: {ground.eveningPrice}</span>
            </div>
          </div>
        </div>
        
        {ground.amenities && ground.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {ground.amenities.slice(0, 2).map((amenity, index) => (
              <span
                key={index}
                className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
              >
                {amenity}
              </span>
            ))}
            {ground.amenities && ground.amenities.length > 2 && (
              <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                +{ground.amenities.length - 2} more
              </span>
            )}
          </div>
        )}
        
        <Link
          href={`/grounds/${ground.id}`}
          className={`w-full text-center block py-2 sm:py-3 px-4 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
            isDisabled 
              ? 'bg-gray-400 text-white cursor-not-allowed' 
              : 'bg-primary-600 text-white hover:bg-primary-700'
          }`}
        >
          {isDisabled ? 'Ground Disabled' : 'View Details & Book'}
        </Link>
      </div>
    </div>
  )
}
