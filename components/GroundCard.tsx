'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Clock, Star } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface Ground {
  id: string
  name: string
  description: string | null
  location: string
  city: string
  images: string[]
  morningPrice: number
  eveningPrice: number
  nightPrice: number
  openingTime?: string
  closingTime?: string
  noClosingTime?: boolean
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
    <Card className={`overflow-hidden hover:shadow-lg transition-all duration-300 ${isDisabled ? 'opacity-60' : ''}`}>
      <div className="relative h-32 sm:h-40 md:h-48 w-full overflow-hidden bg-gray-200">
        {imageLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 sm:h-6 sm:w-6 md:h-8 md:w-8 border-b-2 border-primary-600"></div>
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
              <div className="text-lg sm:text-2xl md:text-4xl mb-1 sm:mb-2">🏟️</div>
              <p className="text-gray-500 text-xs sm:text-sm">No image available</p>
            </div>
          </div>
        )}
       
        {isDisabled && (
          <Badge variant="destructive" className="absolute top-1 left-1 sm:top-2 sm:left-2 text-xs">
            Disabled
          </Badge>
        )}
      </div>
      
      <CardContent className="p-2 sm:p-3 md:p-4">
        <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 mb-1 sm:mb-2 line-clamp-1">
          {ground.name}
        </h3>
        
        <div className="flex items-center text-gray-600 text-xs sm:text-sm mb-1 sm:mb-2">
          <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
          <span className="line-clamp-1">{ground.location}, {ground.city}</span>
        </div>
        
        
        
        <div className="mb-2 sm:mb-3">
          <div className="flex flex-col gap-1 sm:gap-2 text-xs sm:text-sm">
            <div className="flex items-center text-green-600">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
              <span className="truncate">Morning: {ground.morningPrice}</span>
            </div>
            <div className="flex items-center text-yellow-600">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
              <span className="truncate">Evening: {ground.eveningPrice}</span>
            </div>
            <div className="flex items-center text-blue-600">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
              <span className="truncate">Night: {ground.nightPrice}</span>
            </div>
            {ground.noClosingTime ? (
              <div className="flex items-center text-green-600">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                <span className="truncate font-medium">Open 24/7</span>
              </div>
            ) : (
              <div className="flex items-center text-gray-600">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                <span className="truncate">
                  {ground.openingTime || 'Not set'} - {ground.closingTime || 'Not set'}
                </span>
              </div>
            )}
          </div>
        </div>
        

      </CardContent>
      
      <CardFooter className="p-2 sm:p-3 md:px-4 pt-0">
        <Button className="w-full bg-primary-600 text-white hover:bg-primary-700">
          <Link 
            href={`/grounds/${ground.id}`}
            prefetch={true}
            className="w-full block"
          >
            View Details & Book
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
