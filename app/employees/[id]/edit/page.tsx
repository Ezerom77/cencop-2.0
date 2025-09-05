'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { Role } from '@prisma/client'

interface User {
  id: string
  name: string
  email: string
  role: Role
  createdAt: string
  updatedAt: string
}

interface FormData {
  name: string
  email: string
  role: Role
  password?: string
}

const roleLabels = {
  [Role.ADMIN]: 'Administrador',
  [Role.MANAGER]: 'Manager',
  [Role.EMPLOYEE]: 'Empleado'
}

export default function EditEmployeePage() {
  const router = useRouter()
  const params = useParams()
  const employeeId = params.id as string

  const [employee, setEmployee] = useState<User | null>(null)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    role: Role.EMPLOYEE
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchEmployee()
  }, [employeeId])

  const fetchEmployee = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/users/${employeeId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Empleado no encontrado')
          router.push('/employees')
          return
        }
        throw new Error('Error al cargar empleado')
      }

      const data = await response.json()
      setEmployee(data)
      setFormData({
        name: data.name,
        email: data.email,
        role: data.role
      })
    } catch (error) {
      console.error('Error fetching employee:', error)
      toast.error('Error al cargar los datos del empleado')
    } finally {
      setIsLoading(false)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido'
    }

    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      setIsSaving(true)
      
      const updateData: Partial<FormData> = {
        name: formData.name,
        email: formData.email,
        role: formData.role
      }

      // Solo incluir password si se proporcionó
      if (formData.password && formData.password.trim()) {
        updateData.password = formData.password
      }

      const response = await fetch(`/api/users/${employeeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al actualizar empleado')
      }

      toast.success('Empleado actualizado exitosamente')
      router.push('/employees')
    } catch (error) {
      console.error('Error updating employee:', error)
      toast.error(error instanceof Error ? error.message : 'Error al actualizar empleado')
    } finally {
      setIsSaving(false)
    }
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  if (!employee) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Empleado no encontrado</h1>
          <Button onClick={() => router.push('/employees')} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a empleados
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Button 
          onClick={() => router.push('/employees')} 
          variant="outline" 
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a empleados
        </Button>
        
        <h1 className="text-3xl font-bold text-gray-900">Editar Empleado</h1>
        <p className="text-gray-600 mt-2">Modifica la información del empleado</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Información del Empleado</CardTitle>
          <CardDescription>
            Actualiza los datos del empleado. Los campos marcados con * son obligatorios.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Nombre completo del empleado"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="email@empresa.com"
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Rol *</Label>
              <Select
                value={formData.role}
                onValueChange={(value: Role) => handleInputChange('role', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(Role).map((role) => (
                    <SelectItem key={role} value={role}>
                      {roleLabels[role]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.role && (
                <p className="text-sm text-red-500">{errors.role}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Nueva Contraseña (opcional)</Label>
              <Input
                id="password"
                type="password"
                value={formData.password || ''}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="Dejar vacío para mantener la actual"
                className={errors.password ? 'border-red-500' : ''}
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password}</p>
              )}
              <p className="text-sm text-gray-500">
                Solo completa este campo si deseas cambiar la contraseña
              </p>
            </div>

            <div className="flex gap-4 pt-6">
              <Button
                type="submit"
                disabled={isSaving}
                className="flex-1"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar Cambios
                  </>
                )}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/employees')}
                disabled={isSaving}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}