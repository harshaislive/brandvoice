'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface User {
  id: string
  email: string
  username: string
  displayName: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing session on mount
    const token = localStorage.getItem('auth_token')
    const userData = localStorage.getItem('user')
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
        setIsLoading(false)
        
        // Verify token is still valid (but don't block UI)
        fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        .then(res => {
          if (!res.ok) {
            // Token invalid, clear storage
            localStorage.removeItem('auth_token')
            localStorage.removeItem('user')
            setUser(null)
          }
        })
        .catch(() => {
          // Network error - don't clear storage immediately, user might be offline
          console.warn('Failed to verify token - network error')
        })
      } catch {
        // Invalid stored data, clear storage
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user')
        setUser(null)
        setIsLoading(false)
      }
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Login failed')
    }

    const data = await response.json()
    
    // Store token and user info
    localStorage.setItem('auth_token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    setUser(data.user)
  }

  const logout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
    setUser(null)
  }

  const value = {
    user,
    login,
    logout,
    isLoading,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}