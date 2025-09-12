import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    minimumFractionDigits: 0,
  }).format(price)
}

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${displayHour}:${minutes} ${ampm}`
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-LK', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export function generateTimeSlots(startTime: string, endTime: string, duration: number = 60): string[] {
  const slots: string[] = []
  const start = new Date(`2000-01-01T${startTime}:00`)
  const end = new Date(`2000-01-01T${endTime}:00`)
  
  let current = new Date(start)
  
  while (current < end) {
    const timeString = current.toTimeString().slice(0, 5)
    slots.push(timeString)
    current.setMinutes(current.getMinutes() + duration)
  }
  
  return slots
}

export function isMorningSlot(time: string): boolean {
  const hour = parseInt(time.split(':')[0])
  return hour >= 0 && hour < 12
}

export function isEveningSlot(time: string): boolean {
  const hour = parseInt(time.split(':')[0])
  return hour >= 12 && hour < 24
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