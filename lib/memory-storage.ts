// In-memory storage for development when Firestore is not available

interface User {
  id: string
  phone: string
  name?: string
  role: 'SUPER_ADMIN' | 'GROUND_OWNER' | 'USER'
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

interface Ground {
  id: string
  name: string
  description?: string
  location: string
  city: string
  phone: string
  secondaryPhone?: string
  images: string[]
  amenities: string[]
  morningPrice: number
  eveningPrice: number
  isActive: boolean
  openingTime: string
  closingTime: string
  ownerId: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  rejectionReason?: string
  reviewedBy?: string
  reviewedAt?: Date
  createdAt: Date
  updatedAt: Date
}

interface Booking {
  id: string
  groundId: string
  customerName: string
  customerPhone: string
  date: string
  startTime: string
  endTime: string
  price: number
  reason?: string
  userId?: string
  status?: string
  cancellationReason?: string
  cancelledAt?: any
  cancelledBy?: string
  createdAt: Date
  updatedAt: Date
}

// Initialize global storage
if (!(global as any).memoryStorage) {
  (global as any).memoryStorage = {
    users: new Map<string, User>(),
    grounds: new Map<string, Ground>(),
    bookings: new Map<string, Booking>()
  }
}

const storage = (global as any).memoryStorage

// User operations
export const createUserInMemory = (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): string => {
  const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const user: User = {
    id: userId,
    ...userData,
    createdAt: new Date(),
    updatedAt: new Date()
  }
  storage.users.set(userData.phone, user)
  return userId
}

export const getUserByPhoneInMemory = (phone: string): User | null => {
  return storage.users.get(phone) || null
}

export const getUserByIdInMemory = (id: string): User | null => {
  for (const user of storage.users.values()) {
    if (user.id === id) return user
  }
  return null
}

// Ground operations
export const createGroundInMemory = (groundData: Omit<Ground, 'id' | 'createdAt' | 'updatedAt'>): string => {
  const groundId = `ground_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const ground: Ground = {
    id: groundId,
    ...groundData,
    status: groundData.status || 'PENDING',
    createdAt: new Date(),
    updatedAt: new Date()
  }
  storage.grounds.set(groundId, ground)
  return groundId
}

export const getAllGroundsInMemory = (): Ground[] => {
  return Array.from(storage.grounds.values() as IterableIterator<Ground>)
}

export const getGroundByIdInMemory = (id: string): Ground | null => {
  return storage.grounds.get(id) || null
}

export const getGroundsByOwnerInMemory = (ownerId: string): Ground[] => {
  return Array.from(storage.grounds.values() as IterableIterator<Ground>).filter(ground => ground.ownerId === ownerId)
}

export const updateGroundInMemory = (id: string, updates: Partial<Ground>): void => {
  const ground = storage.grounds.get(id)
  if (ground) {
    const updatedGround = { ...ground, ...updates, updatedAt: new Date() }
    storage.grounds.set(id, updatedGround)
  }
}

export const deleteGroundInMemory = (id: string): void => {
  storage.grounds.delete(id)
}

export const deleteUserInMemory = (id: string): void => {
  // Find user by ID and remove from storage
  for (const [phone, user] of storage.users.entries()) {
    if (user.id === id) {
      storage.users.delete(phone)
      break
    }
  }
}

export const getBookingByIdInMemory = (id: string): Booking | null => {
  return storage.bookings.get(id) || null
}

export const updateBookingInMemory = (id: string, updates: Partial<Booking>): void => {
  const booking = storage.bookings.get(id)
  if (booking) {
    const updatedBooking = { ...booking, ...updates, updatedAt: new Date() }
    storage.bookings.set(id, updatedBooking)
  }
}

// Booking operations
export const createBookingInMemory = (bookingData: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>): string => {
  const bookingId = `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const booking: Booking = {
    id: bookingId,
    ...bookingData,
    status: 'BOOKED', // Set default status for new bookings
    createdAt: new Date(),
    updatedAt: new Date()
  }
  storage.bookings.set(bookingId, booking)
  return bookingId
}

export const getAllBookingsInMemory = (): Booking[] => {
  return Array.from(storage.bookings.values() as IterableIterator<Booking>).sort((a, b) => 
    b.createdAt.getTime() - a.createdAt.getTime()
  )
}

export const getBookingsByGroundInMemory = (groundId: string): Booking[] => {
  return Array.from(storage.bookings.values() as IterableIterator<Booking>)
    .filter(booking => booking.groundId === groundId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

export const getBookingsByUserInMemory = (userId: string): Booking[] => {
  return Array.from(storage.bookings.values() as IterableIterator<Booking>              )
    .filter(booking => booking.userId === userId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

// Initialize with super admin
export const initializeMemoryStorage = () => {
  const superAdminPhone = '0773078103'
  const existingAdmin = getUserByPhoneInMemory(superAdminPhone)
  
  if (!existingAdmin) {
    createUserInMemory({
      phone: superAdminPhone,
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
      isActive: true
    })
    // console.log('✅ Super Admin initialized in memory storage')
  }
}

// Auto-initialize on import
initializeMemoryStorage()
