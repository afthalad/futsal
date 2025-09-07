import jwt from 'jsonwebtoken'
import { getUserById } from './firestore-server'
import { getUserByIdInMemory } from './memory-storage'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret'

export interface JWTPayload {
  userId: string
  phone: string
  role: string
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch {
    return null
  }
}

export async function getUserFromToken(token: string) {
  const payload = verifyToken(token)
  if (!payload) return null

  // Try to get user from in-memory store first
  const user = getUserByIdInMemory(payload.userId)
  
  if (user && user.isActive) {
    return {
      id: user.id,
      phone: user.phone,
      name: user.name,
      role: user.role,
      isActive: user.isActive
    }
  }

  // Try Firestore
  try {
    const firestoreUser = await getUserById(payload.userId)
    
    if (!firestoreUser || !firestoreUser.isActive) return null

    return {
      id: firestoreUser.id,
      phone: firestoreUser.phone,
      name: firestoreUser.name,
      role: firestoreUser.role,
      isActive: firestoreUser.isActive
    }
  } catch (error) {
    console.error('Error getting user from Firestore:', error)
    return null
  }
}
