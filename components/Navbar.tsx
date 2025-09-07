'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Menu, X, User, LogOut } from 'lucide-react'
import toast from 'react-hot-toast'

interface User {
  id: string
  phone: string
  name: string
  role: string
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setLoading(false)
        return
      }

      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else {
        localStorage.removeItem('token')
      }
    } catch (error) {
      console.error('Auth check failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setUser(null)
    toast.success('Logged out successfully')
    router.push('/')
  }

  if (loading) {
    return (
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-lg sm:text-xl font-bold text-primary-600">
                PuttalamGrounds
              </Link>
            </div>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
        <div className="flex justify-between h-14 sm:h-16">
          <div className="flex items-center">
            <Link href="/" className="text-base sm:text-lg lg:text-xl font-bold text-primary-600 truncate">
              PuttalamGrounds
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-2 xl:space-x-4">
            <Link href="/" className="text-gray-700 hover:text-primary-600 px-2 xl:px-3 py-2 rounded-md text-sm font-medium transition-colors">
              Home
            </Link>
            
            {!user ? (
              <>
                <Link href="/auth/login" className="btn-outline text-xs xl:text-sm px-3 xl:px-4 py-2">
                  Ground Owner? Join Us
                </Link>
              </>
            ) : (
              <>
                {user.role === 'GROUND_OWNER' && (
                  <Link href="/admin/dashboard" className="text-gray-700 hover:text-primary-600 px-2 xl:px-3 py-2 rounded-md text-sm font-medium transition-colors">
                    Dashboard
                  </Link>
                )}
                {user.role === 'SUPER_ADMIN' && (
                  <Link href="/admin/super" className="text-gray-700 hover:text-primary-600 px-2 xl:px-3 py-2 rounded-md text-sm font-medium transition-colors">
                    Super Admin
                  </Link>
                )}
                <div className="flex items-center space-x-1 xl:space-x-2">
                  <User className="h-4 w-4 xl:h-5 xl:w-5 text-gray-500" />
                  <span className="text-xs xl:text-sm text-gray-700 truncate max-w-20 xl:max-w-none">{user.name || user.phone}</span>
                  <button
                    onClick={handleLogout}
                    className="text-gray-500 hover:text-gray-700 p-1 transition-colors"
                  >
                    <LogOut className="h-4 w-4 xl:h-5 xl:w-5" />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Tablet Navigation */}
          <div className="hidden md:flex lg:hidden items-center space-x-2">
            {!user ? (
              <Link href="/auth/login" className="btn-outline text-xs px-3 py-2">
                Join Us
              </Link>
            ) : (
              <>
                {user.role === 'GROUND_OWNER' && (
                  <Link href="/admin/dashboard" className="text-gray-700 hover:text-primary-600 px-2 py-2 rounded-md text-sm font-medium">
                    Dashboard
                  </Link>
                )}
                {user.role === 'SUPER_ADMIN' && (
                  <Link href="/admin/super" className="text-gray-700 hover:text-primary-600 px-2 py-2 rounded-md text-sm font-medium">
                    Admin
                  </Link>
                )}
                <div className="flex items-center space-x-1">
                  <User className="h-4 w-4 text-gray-500" />
                  <button
                    onClick={handleLogout}
                    className="text-gray-500 hover:text-gray-700 p-1"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-700 hover:text-primary-600 focus:outline-none focus:text-primary-600 p-2"
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden border-t border-gray-200">
            <div className="px-3 pt-2 pb-3 space-y-1 bg-gray-50">
              <Link
                href="/"
                className="text-gray-700 hover:text-primary-600 block px-3 py-3 rounded-md text-base font-medium transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Home
              </Link>
              
              {!user ? (
                <Link
                  href="/auth/login"
                  className="btn-outline block text-center mx-3 py-3 text-sm"
                  onClick={() => setIsOpen(false)}
                >
                  Ground Owner? Join Us
                </Link>
              ) : (
                <>
                  {user.role === 'GROUND_OWNER' && (
                    <Link
                      href="/admin/dashboard"
                      className="text-gray-700 hover:text-primary-600 block px-3 py-3 rounded-md text-base font-medium transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      Dashboard
                    </Link>
                  )}
                  {user.role === 'SUPER_ADMIN' && (
                    <Link
                      href="/admin/super"
                      className="text-gray-700 hover:text-primary-600 block px-3 py-3 rounded-md text-base font-medium transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      Super Admin
                    </Link>
                  )}
                  <div className="flex items-center justify-between px-3 py-3 border-t border-gray-200 mt-2">
                    <div className="flex items-center space-x-2">
                      <User className="h-5 w-5 text-gray-500" />
                      <span className="text-sm text-gray-700 truncate">{user.name || user.phone}</span>
                    </div>
                    <button
                      onClick={() => {
                        handleLogout()
                        setIsOpen(false)
                      }}
                      className="text-gray-500 hover:text-gray-700 p-2 transition-colors"
                    >
                      <LogOut className="h-5 w-5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
