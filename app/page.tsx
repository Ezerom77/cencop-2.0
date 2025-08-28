'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return // Still loading

    if (session) {
      // User is authenticated, redirect to dashboard
      router.push('/dashboard')
    } else {
      // User is not authenticated, redirect to login
      router.push('/login')
    }
  }, [session, status, router])

  // Show loading spinner while determining authentication status
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto bg-blue-600 rounded-2xl flex items-center justify-center">
          <span className="text-2xl font-bold text-white">C</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">CENCOP</h1>
        <p className="text-gray-600">Sistema de Gestión de Digitalización</p>
        <div className="flex items-center justify-center space-x-2">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          <span className="text-sm text-gray-500">Cargando...</span>
        </div>
      </div>
    </div>
  )
}