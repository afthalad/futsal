'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, X } from 'lucide-react'
import { formatPrice, formatTime } from '@/lib/utils'

interface Booking {
  id: string
  customerName: string
  customerPhone: string
  cancellationReason: string
  ground: {
    name: string
  }
  date: string
  startTime: string
  endTime: string
  price: number
  status: string
  reason?: string
}

interface ResponsiveTableProps {
  bookings: Booking[]
  onCancelBooking: (booking: Booking) => void
}

const isToday = (date: string) => {
  const today = new Date().toDateString()
  const bookingDate = new Date(date).toDateString()
  return today === bookingDate
}

export default function ResponsiveTable({ bookings, onCancelBooking }: ResponsiveTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const toggleRow = (bookingId: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(bookingId)) {
      newExpanded.delete(bookingId)
    } else {
      newExpanded.add(bookingId)
    }
    setExpandedRows(newExpanded)
  }

  return (
    <div className="space-y-3">
      {bookings.map((booking) => (
        <div key={booking.id} className="bg-white border border-gray-200 rounded-lg shadow-sm">
          {/* Mobile Card Header */}
          <div 
            className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => toggleRow(booking.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-gray-900 truncate">
                    {booking.customerName}
                  </h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    booking.status === 'CANCELLED' || booking.status === 'cancelled'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {booking.status === 'CANCELLED' || booking.status === 'cancelled' ? 'Cancelled' : 'Active'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {booking.ground.name}
                </p>
                {/* <p className="text-sm text-gray-500 mt-1">
                  {booking.ground.name}
                </p> */}
                <p className="text-sm font-medium text-primary-600 mt-1">
                  {formatPrice(booking.price)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  {new Date(booking.date).toLocaleDateString('en-LK')}
                </span>
                {expandedRows.has(booking.id) ? (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                )}
              </div>
            </div>
          </div>

          {/* Expanded Content */}
          {expandedRows.has(booking.id) && (
            <div className="px-4 pb-4 border-t border-gray-100">
              <div className="pt-4 space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Phone:</span>
                    <p className="font-medium text-gray-900">{booking.customerPhone}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Time:</span>
                    <p className="font-medium text-gray-900">
                      {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                    </p>
                  </div>
                </div>
                
                {booking.reason && (
                  <div>
                    <span className="text-gray-500 text-sm">Reason:</span>
                    <p className="text-sm text-gray-900 mt-1">{booking.reason}</p>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  {booking.status === 'CANCELLED' || booking.status === 'cancelled' ? (
                    <span className="text-gray-400 text-sm">Cancelled</span>
                  ) : (
                    <button
                      onClick={() => onCancelBooking(booking)}
                      className="text-red-600 hover:text-red-900 flex items-center gap-1 text-sm"
                    >
                      <X className="h-4 w-4" />
                      Cancel Booking
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
