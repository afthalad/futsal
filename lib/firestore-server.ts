import { adminDb } from './firebase-admin'

// Types
export interface User {
  id: string
  phone: string
  name?: string
  role: 'SUPER_ADMIN' | 'GROUND_OWNER' | 'USER'
  isActive: boolean
  createdAt: any
  updatedAt: any
}

export interface Ground {
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
  reviewedAt?: any
  createdAt: any
  updatedAt: any
}

export interface Booking {
  id: string
  groundId: string
  ownerId: string
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
  createdAt: any
  updatedAt: any
}


// User operations
export const createUser = async (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const docRef = await adminDb.collection('users').add({
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    return docRef.id
  } catch (error) {
    console.error('Error creating user in Firestore:', error)
    // Fallback to memory storage
    const { createUserInMemory } = await import('./memory-storage')
    return createUserInMemory(userData)
  }
}

export const getUserById = async (id: string): Promise<User | null> => {
  try {
    const docRef = adminDb.collection('users').doc(id)
    const docSnap = await docRef.get()
    
    if (docSnap.exists) {
      return { id: docSnap.id, ...docSnap.data() } as User
    }
    return null
  } catch (error) {
    console.error('Error getting user by ID from Firestore:', error)
    // Fallback to memory storage
    const { getUserByIdInMemory } = await import('./memory-storage')
    return getUserByIdInMemory(id)
  }
}

export const getUserByPhone = async (phone: string): Promise<User | null> => {
  try {
    const q = adminDb.collection('users').where('phone', '==', phone).limit(1)
    const querySnapshot = await q.get()
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0]
      return { id: doc.id, ...doc.data() } as User
    }
    return null
  } catch (error) {
    console.error('Error getting user by phone from Firestore:', error)
    // Fallback to memory storage
    const { getUserByPhoneInMemory } = await import('./memory-storage')
    return getUserByPhoneInMemory(phone)
  }
}

export const updateUser = async (id: string, updates: Partial<User>): Promise<void> => {
  const docRef = adminDb.collection('users').doc(id)
  await docRef.update({
    ...updates,
    updatedAt: new Date()
  })
}

// Ground operations
export const createGround = async (groundData: Omit<Ground, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const docRef = await adminDb.collection('grounds').add({
      ...groundData,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    return docRef.id
  } catch (error) {
    console.error('Error creating ground in Firestore:', error)
    // Fallback to memory storage
    const { createGroundInMemory } = await import('./memory-storage')
    return createGroundInMemory(groundData)
  }
}

export const getGroundById = async (id: string): Promise<Ground | null> => {
  const docRef = adminDb.collection('grounds').doc(id)
  const docSnap = await docRef.get()
  
  if (docSnap.exists) {
    return { id: docSnap.id, ...docSnap.data() } as Ground
  }
  return null
}

// Simple in-memory cache for grounds
let groundsCache: Ground[] | null = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export const getAllGrounds = async (): Promise<Ground[]> => {
  try {
    // Check cache first
    const now = Date.now()
    if (groundsCache && (now - cacheTimestamp) < CACHE_DURATION) {
      return groundsCache
    }

    // Get all grounds (both active and inactive)
    const q = adminDb.collection('grounds')
    const querySnapshot = await q.get()
    
    const grounds = querySnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        // Set default status for existing grounds that don't have it
        status: data.status || 'PENDING'
      }
    }) as Ground[]

    // Update cache
    groundsCache = grounds
    cacheTimestamp = now

    return grounds
  } catch (error) {
    console.error('Error getting all grounds from Firestore:', error)
    // Fallback to memory storage
    const { getAllGroundsInMemory } = await import('./memory-storage')
    return getAllGroundsInMemory()
  }
}

export const getAllGroundsWithOwnerInfo = async (): Promise<Ground[]> => {
  try {
    // Get all grounds
    const grounds = await getAllGrounds()
    
    // Get all ground owner IDs
    const ownerIds = Array.from(new Set(grounds.map(ground => ground.ownerId)))
    
    // Fetch owner information for all owners
    const ownerPromises = ownerIds.map(async (ownerId) => {
      const user = await getUserById(ownerId)
      return { ownerId, user }
    })
    
    const ownerResults = await Promise.all(ownerPromises)
    const ownerMap = new Map(ownerResults.map(({ ownerId, user }) => [ownerId, user]))
    
    // Filter out grounds from disabled owners and add owner info
    const filteredGrounds = grounds
      .filter(ground => {
        const owner = ownerMap.get(ground.ownerId)
        return owner && owner.isActive // Only include grounds from active owners
      })
      .map(ground => ({
        ...ground,
        owner: ownerMap.get(ground.ownerId)
      }))
    
    return filteredGrounds
  } catch (error) {
    console.error('Error getting grounds with owner info:', error)
    // Fallback to regular getAllGrounds
    return getAllGrounds()
  }
}

export const getGroundsByOwner = async (ownerId: string): Promise<Ground[]> => {
  try {
    const q = adminDb.collection('grounds').where('ownerId', '==', ownerId)
    const querySnapshot = await q.get()
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        // Set default status for existing grounds that don't have it
        status: data.status || 'PENDING'
      }
    }) as Ground[]
  } catch (error) {
    console.error('Error getting grounds by owner from Firestore:', error)
    // Fallback to memory storage
    const { getGroundsByOwnerInMemory } = await import('./memory-storage')
    return getGroundsByOwnerInMemory(ownerId)
  }
}

export const updateGround = async (id: string, data: Partial<Ground>): Promise<void> => {
  try {
    await adminDb.collection('grounds').doc(id).update({
      ...data,
      updatedAt: new Date()
    })
    
    // Update cache
    if (groundsCache) {
      const index = groundsCache.findIndex(g => g.id === id)
      if (index !== -1) {
        groundsCache[index] = { ...groundsCache[index], ...data }
      }
    }
  } catch (error) {
    console.error('Error updating ground in Firestore:', error)
    // Fallback to memory storage
    const { updateGroundInMemory } = await import('./memory-storage')
    updateGroundInMemory(id, data)
  }
}

export const deleteGround = async (id: string): Promise<void> => {
  try {
    await adminDb.collection('grounds').doc(id).delete()
    
    // Update cache
    if (groundsCache) {
      groundsCache = groundsCache.filter(g => g.id !== id)
    }
  } catch (error) {
    console.error('Error deleting ground from Firestore:', error)
    // Fallback to memory storage
    const { deleteGroundInMemory } = await import('./memory-storage')
    deleteGroundInMemory(id)
  }
}

export const deleteUser = async (id: string): Promise<void> => {
  try {
    await adminDb.collection('users').doc(id).delete()
  } catch (error) {
    console.error('Error deleting user from Firestore:', error)
    // Fallback to memory storage
    const { deleteUserInMemory } = await import('./memory-storage')
    deleteUserInMemory(id)
  }
}


// Booking operations
export const createBooking = async (bookingData: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const docRef = await adminDb.collection('bookings').add({
      ...bookingData,
      status: 'BOOKED', // Set default status for new bookings
      createdAt: new Date(),
      updatedAt: new Date()
    })
    return docRef.id
  } catch (error) {
    console.error('Error creating booking in Firestore:', error)
    // Fallback to memory storage
    const { createBookingInMemory } = await import('./memory-storage')
    return createBookingInMemory(bookingData)
  }
}

export const getBookingById = async (id: string): Promise<Booking | null> => {
  try {
    const docRef = adminDb.collection('bookings').doc(id)
    const docSnap = await docRef.get()
    
    if (docSnap.exists) {
      return { id: docSnap.id, ...docSnap.data() } as Booking
    }
    return null
  } catch (error) {
    console.error('Error getting booking from Firestore:', error)
    // Fallback to memory storage
    const { getBookingByIdInMemory } = await import('./memory-storage')
    return getBookingByIdInMemory(id) as Booking | null
  }
}

export const getBookingsByGround = async (groundId: string): Promise<Booking[]> => {
  const q = adminDb.collection('bookings').where('groundId', '==', groundId)
  const querySnapshot = await q.get()
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Booking[]
}

export const getBookingsByUser = async (userId: string): Promise<Booking[]> => {
  const q = adminDb.collection('bookings').where('userId', '==', userId)
  const querySnapshot = await q.get()
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Booking[]
}

export const getAllBookings = async (): Promise<Booking[]> => {
  const querySnapshot = await adminDb.collection('bookings').get()
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Booking[]
}

export const updateBooking = async (id: string, updates: Partial<Booking>): Promise<void> => {
  try {
    const docRef = adminDb.collection('bookings').doc(id)
    await docRef.update({
      ...updates,
      updatedAt: new Date()
    })
  } catch (error) {
    console.error('Error updating booking in Firestore:', error)
    // Fallback to memory storage
    const { updateBookingInMemory } = await import('./memory-storage')
    updateBookingInMemory(id, updates)
  }
}

// Commission management functions
export const updateCommissionAmount = async (ownerId: string, bookingAmount: number, operation: 'add' | 'subtract'): Promise<void> => {
  try {
    const commissionRef = adminDb.collection('commission').doc(ownerId)
    const commissionDoc = await commissionRef.get()
    
    const commissionAmount = bookingAmount * 0.015 // 1.5% commission
    
    if (commissionDoc.exists) {
      const currentData = commissionDoc.data()
      const currentAmount = currentData?.amount || 0
      const newAmount = operation === 'add' 
        ? currentAmount + commissionAmount 
        : Math.max(0, currentAmount - commissionAmount) // Don't go below 0
      
      await commissionRef.update({
        amount: newAmount,
        lastUpdated: new Date(),
        status: newAmount > 0 ? 'PENDING' : 'PAID'
      })
    } else {
      // Create new commission record
      await commissionRef.set({
        ownerId,
        amount: operation === 'add' ? commissionAmount : 0,
        lastUpdated: new Date(),
        status: operation === 'add' ? 'PENDING' : 'PAID'
      })
    }
  } catch (error) {
    console.error('Error updating commission amount:', error)
    throw error
  }
}

export const getCommissionByOwner = async (ownerId: string): Promise<any> => {
  try {
    const commissionRef = adminDb.collection('commission').doc(ownerId)
    const commissionDoc = await commissionRef.get()
    
    if (commissionDoc.exists) {
      return { id: commissionDoc.id, ...commissionDoc.data() }
    }
    return null
  } catch (error) {
    console.error('Error getting commission:', error)
    return null
  }
}

export const markCommissionAsPaid = async (ownerId: string): Promise<void> => {
  try {
    const commissionRef = adminDb.collection('commission').doc(ownerId)
    await commissionRef.update({
      amount: 0,
      status: 'PAID',
      paidAt: new Date(),
      lastUpdated: new Date()
    })
  } catch (error) {
    console.error('Error marking commission as paid:', error)
    throw error
  }
}

export const deleteBooking = async (id: string): Promise<void> => {
  const docRef = adminDb.collection('bookings').doc(id)
  await docRef.delete()
}
export { adminDb }

