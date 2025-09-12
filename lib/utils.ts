import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format price to display with currency
export function formatPrice(price: number): string {
  return `Rs.${price.toLocaleString()}`
}

// Format time to 12-hour format
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
}

// Generate time slots between opening and closing time
export function generateTimeSlots(openingTime: string, closingTime: string, slotDurationMinutes: number = 60): string[] {
  const slots: string[] = []
  const [openHour, openMinute] = openingTime.split(':').map(Number)
  const [closeHour, closeMinute] = closingTime.split(':').map(Number)
  
  const openTimeInMinutes = openHour * 60 + openMinute
  const closeTimeInMinutes = closeHour * 60 + closeMinute
  
  for (let timeInMinutes = openTimeInMinutes; timeInMinutes < closeTimeInMinutes; timeInMinutes += slotDurationMinutes) {
    const hours = Math.floor(timeInMinutes / 60)
    const minutes = timeInMinutes % 60
    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
    slots.push(timeString)
  }
  
  return slots
}

// Check if a time slot is in the morning (before 17:00 / 5:00 PM)
export function isMorningSlot(time: string): boolean {
  const hour = parseInt(time.split(':')[0])
  return hour >= 0 && hour < 17
}

export function isEveningSlot(time: string): boolean {
  const hour = parseInt(time.split(':')[0])
  return hour >= 17 && hour < 24
}

export function formatFirebaseDate(timestamp: any): string {
  try {
    if (!timestamp) return 'N/A'
    
    // Debug log to see the structure
    console.log('Timestamp structure:', timestamp, 'Type:', typeof timestamp)
    
    // Handle Firebase timestamp with toDate method
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      const date = timestamp.toDate()
      console.log('Using toDate method, result:', date)
      return new Date(date).toLocaleDateString('en-LK')
    }
    
    // Handle Firebase timestamp with _seconds property
    if (timestamp._seconds && typeof timestamp._seconds === 'number') {
      const date = new Date(timestamp._seconds * 1000)
      console.log('Using _seconds property, result:', date)
      return date.toLocaleDateString('en-LK')
    }
    
    // Handle regular Date object
    if (timestamp instanceof Date) {
      console.log('Using Date object directly')
      return timestamp.toLocaleDateString('en-LK')
    }
    
    // Handle string timestamp
    if (typeof timestamp === 'string') {
      const date = new Date(timestamp)
      console.log('Using string conversion, result:', date)
      return date.toLocaleDateString('en-LK')
    }
    
    // Handle number timestamp (milliseconds)
    if (typeof timestamp === 'number') {
      const date = new Date(timestamp)
      console.log('Using number conversion, result:', date)
      return date.toLocaleDateString('en-LK')
    }
    
    console.log('No matching format found for timestamp:', timestamp)
    return 'N/A'
  } catch (error) {
    console.error('Error formatting Firebase date:', error, 'Timestamp:', timestamp)
    return 'N/A'
  }
}
