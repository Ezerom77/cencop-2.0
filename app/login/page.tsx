'use client'

import React, { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Alert, AlertDescription } from '@/components/ui/Alert'
import { Eye, EyeOff, User, UserCheck, Users } from 'lucide-react'
import { toast } from 'sonner'

const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Credenciales inválidas. Por favor, verifica tu email y contraseña.')
        toast.error('Error de autenticación')
      } else {
        // Verificar la sesión y redirigir
        const session = await getSession()
        if (session) {
          toast.success('¡Bienvenido!')
          router.push('/dashboard')
        }
      }
    } catch (error) {
      console.error('Error durante el login:', error)
      setError('Ocurrió un error durante el inicio de sesión. Por favor, inténtalo de nuevo.')
      toast.error('Error del servidor')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemoLogin = async (role: 'admin' | 'manager' | 'employee') => {
    setIsLoading(true)
    setError('')

    const demoCredentials = {
      admin: { email: 'admin@cencop.com', password: 'secret' },
      manager: { email: 'gerente1@cencop.com', password: 'secret' },
      employee: { email: 'empleado1@cencop.com', password: 'secret' }
    }

    const credentials = demoCredentials[role]

    try {
      const result = await signIn('credentials', {
        email: credentials.email,
        password: credentials.password,
        redirect: false,
      })

      if (result?.error) {
        setError('Error al acceder con credenciales de demostración.')
        toast.error('Error de demostración')
      } else {
        const session = await getSession()
        if (session) {
          toast.success(`¡Bienvenido como ${role}!`)
          router.push('/dashboard')
        }
      }
    } catch (error) {
      console.error('Error durante el login de demostración:', error)
      setError('Error al acceder con credenciales de demostración.')
      toast.error('Error del servidor')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo y título */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4">
            <span className="text-white font-bold text-2xl">C</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">CENCOP</h1>
          <p className="text-gray-600 mt-2">Sistema de Gestión de Digitalización</p>
        </div>

        {/* Formulario de login */}
        <Card>
          <CardHeader>
            <CardTitle>Iniciar Sesión</CardTitle>
            <CardDescription>
              Ingresa tus credenciales para acceder al sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Tu contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Acceso de demostración */}
        <Card>
          <CardHeader>
            <CardTitle>Acceso de Demostración</CardTitle>
            <CardDescription>
              Prueba el sistema con diferentes roles de usuario
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleDemoLogin('admin')}
              disabled={isLoading}
            >
              <UserCheck className="mr-2 h-4 w-4" />
              Demo Administrador
            </Button>
            
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleDemoLogin('manager')}
              disabled={isLoading}
            >
              <Users className="mr-2 h-4 w-4" />
              Demo Gerente
            </Button>
            
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleDemoLogin('employee')}
              disabled={isLoading}
            >
              <User className="mr-2 h-4 w-4" />
              Demo Empleado
            </Button>
          </CardContent>
        </Card>

        {/* Información de contacto */}
        <div className="text-center text-sm text-gray-600">
          <p>¿Problemas para acceder?</p>
          <p>Contacta al administrador del sistema</p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage