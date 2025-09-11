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
