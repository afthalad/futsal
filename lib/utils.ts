import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format price to display with currency
export function formatPrice(price: number | undefined): string {
  if (!price || isNaN(price)) return 'Rs.0'
  return `Rs.${price.toLocaleString()}`
}

// Format time to 12-hour format
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number)
  
  // Handle special next day slots (25:00, 26:00)
  if (hours >= 25) {
    const nextDayHours = hours - 24
    const period = nextDayHours >= 12 ? 'PM' : 'AM'
    const displayHours = nextDayHours === 0 ? 12 : nextDayHours > 12 ? nextDayHours - 12 : nextDayHours
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period} (+1)`
  }
  
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
}

// Generate time slots for all 24 hours
export function generateTimeSlots(): string[] {
  const slots: string[] = []
  
  // Generate slots for all 24 hours (00:00 to 23:00)
  for (let hour = 0; hour < 24; hour++) {
    const timeString = `${hour.toString().padStart(2, '0')}:00`
    slots.push(timeString)
  }
  
  return slots
}

// Generate time slots with special handling for 1AM and 2AM (next day)
export function generateTimeSlotsWithSpecial(): string[] {
  const slots: string[] = []
  
  // Generate slots for all 24 hours (00:00 to 23:00)
  for (let hour = 0; hour < 24; hour++) {
    const timeString = `${hour.toString().padStart(2, '0')}:00`
    slots.push(timeString)
  }
  
  // Add special next day slots for 1AM and 2AM
  slots.push('25:00') // 1AM next day
  slots.push('26:00') // 2AM next day
  
  return slots
}

// Check if a time slot is in the morning (06:00 AM - 04:00 PM)
export function isMorningSlot(time: string): boolean {
  const hour = parseInt(time.split(':')[0])
  return hour >= 6 && hour < 16
}

// Check if a time slot is in the evening (04:00 PM - 06:00 PM)
export function isEveningSlot(time: string): boolean {
  const hour = parseInt(time.split(':')[0])
  return hour >= 16 && hour < 18
}

// Check if a time slot is in the night (06:00 PM - 02:00 AM)
export function isNightSlot(time: string): boolean {
  const hour = parseInt(time.split(':')[0])
  return hour >= 18 || hour < 6 || hour >= 25 // Include special next day slots (25:00, 26:00)
}

export function formatFirebaseDate(timestamp: any): string {
  try {
    if (!timestamp) return 'N/A'
    
    // Debug log to see the structure
    // console.log('Timestamp structure:', timestamp, 'Type:', typeof timestamp)
    
    // Handle Firebase timestamp with toDate method
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      const date = timestamp.toDate()
      // console.log('Using toDate method, result:', date)
      return new Date(date).toLocaleDateString('en-LK')
    }
    
    // Handle Firebase timestamp with _seconds property
    if (timestamp._seconds && typeof timestamp._seconds === 'number') {
      const date = new Date(timestamp._seconds * 1000)
      // console.log('Using _seconds property, result:', date)
      return date.toLocaleDateString('en-LK')
    }
    
    // Handle regular Date object
    if (timestamp instanceof Date) {
      // console.log('Using Date object directly')
      return timestamp.toLocaleDateString('en-LK')
    }
    
    // Handle string timestamp
    if (typeof timestamp === 'string') {
      const date = new Date(timestamp)
      // console.log('Using string conversion, result:', date)
      return date.toLocaleDateString('en-LK')
    }
    
    // Handle number timestamp (milliseconds)
    if (typeof timestamp === 'number') {
      const date = new Date(timestamp)
      // console.log('Using number conversion, result:', date)
      return date.toLocaleDateString('en-LK')
    }
    
    // 0console.log('No matching format found for timestamp:', timestamp)
    return 'N/A'
  } catch (error) {
    // console.error('Error formatting Firebase date:', error, 'Timestamp:', timestamp)
    return 'N/A'
  }
}
