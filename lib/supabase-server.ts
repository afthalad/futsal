import { supabaseAdmin } from './supabase'

// Types
export interface User {
  id: string
  phone: string
  name?: string
  role: 'SUPER_ADMIN' | 'GROUND_OWNER' | 'USER'
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Ground {
  id: string
  name: string
  description?: string
  location: string
  city: string
  phone: string
  email?: string
  images: string[]
  amenities: string[]
  morning_price: number
  evening_price: number
  is_active: boolean
  opening_time: string
  closing_time: string
  owner_id: string
  created_at: string
  updated_at: string
}

export interface Booking {
  id: string
  ground_id: string
  customer_name: string
  customer_phone: string
  date: string
  start_time: string
  end_time: string
  price: number
  reason?: string
  user_id?: string
  created_at: string
  updated_at: string
}

// User operations
export const createUser = async (userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<string> => {
  const { data, error } = await supabaseAdmin
    .from('users')
    .insert([{
      ...userData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select('id')
    .single()

  if (error) {
    console.error('Error creating user:', error)
    throw error
  }

  return data.id
}

export const getUserById = async (id: string): Promise<User | null> => {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // No rows returned
    console.error('Error getting user by ID:', error)
    throw error
  }

  return data
}

export const getUserByPhone = async (phone: string): Promise<User | null> => {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('phone', phone)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // No rows returned
    console.error('Error getting user by phone:', error)
    throw error
  }

  return data
}

export const updateUser = async (id: string, updates: Partial<User>): Promise<void> => {
  const { error } = await supabaseAdmin
    .from('users')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) {
    console.error('Error updating user:', error)
    throw error
  }
}

// Ground operations
export const createGround = async (groundData: Omit<Ground, 'id' | 'created_at' | 'updated_at'>): Promise<string> => {
  const { data, error } = await supabaseAdmin
    .from('grounds')
    .insert([{
      ...groundData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select('id')
    .single()

  if (error) {
    console.error('Error creating ground:', error)
    throw error
  }

  return data.id
}

export const getGroundById = async (id: string): Promise<Ground | null> => {
  const { data, error } = await supabaseAdmin
    .from('grounds')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // No rows returned
    console.error('Error getting ground by ID:', error)
    throw error
  }

  return data
}

export const getAllGrounds = async (): Promise<Ground[]> => {
  const { data, error } = await supabaseAdmin
    .from('grounds')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error getting all grounds:', error)
    throw error
  }

  return data || []
}

export const getGroundsByOwner = async (ownerId: string): Promise<Ground[]> => {
  const { data, error } = await supabaseAdmin
    .from('grounds')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error getting grounds by owner:', error)
    throw error
  }

  return data || []
}

export const updateGround = async (id: string, updates: Partial<Ground>): Promise<void> => {
  const { error } = await supabaseAdmin
    .from('grounds')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) {
    console.error('Error updating ground:', error)
    throw error
  }
}

export const deleteGround = async (id: string): Promise<void> => {
  const { error } = await supabaseAdmin
    .from('grounds')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting ground:', error)
    throw error
  }
}

// Booking operations
export const createBooking = async (bookingData: Omit<Booking, 'id' | 'created_at' | 'updated_at'>): Promise<string> => {
  const { data, error } = await supabaseAdmin
    .from('bookings')
    .insert([{
      ...bookingData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select('id')
    .single()

  if (error) {
    console.error('Error creating booking:', error)
    throw error
  }

  return data.id
}

export const getBookingById = async (id: string): Promise<Booking | null> => {
  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // No rows returned
    console.error('Error getting booking by ID:', error)
    throw error
  }

  return data
}

export const getBookingsByGround = async (groundId: string): Promise<Booking[]> => {
  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select('*')
    .eq('ground_id', groundId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error getting bookings by ground:', error)
    throw error
  }

  return data || []
}

export const getBookingsByUser = async (userId: string): Promise<Booking[]> => {
  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error getting bookings by user:', error)
    throw error
  }

  return data || []
}

export const getAllBookings = async (): Promise<Booking[]> => {
  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error getting all bookings:', error)
    throw error
  }

  return data || []
}

export const updateBooking = async (id: string, updates: Partial<Booking>): Promise<void> => {
  const { error } = await supabaseAdmin
    .from('bookings')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) {
    console.error('Error updating booking:', error)
    throw error
  }
}

export const deleteBooking = async (id: string): Promise<void> => {
  const { error } = await supabaseAdmin
    .from('bookings')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting booking:', error)
    throw error
  }
}
