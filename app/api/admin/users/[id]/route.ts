import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

import { getUserFromToken } from '@/lib/auth'
import { deleteUser, getUserById } from '@/lib/firestore-server'
import { deleteUserInMemory, getUserByIdInMemory } from '@/lib/memory-storage'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getUserFromToken(token)
    
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if user exists
    let targetUser
    try {
      targetUser = await getUserById(params.id)
    } catch (error) {
      targetUser = getUserByIdInMemory(params.id)
    }

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Prevent deleting super admins
    if (targetUser.role === 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Cannot delete super admin users' }, { status: 403 })
    }

    // Delete user
    try {
      await deleteUser(params.id)
    } catch (error) {
      console.error('Error deleting user from Firestore, using memory storage:', error)
      deleteUserInMemory(params.id)
    }

    return NextResponse.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('Delete User Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
