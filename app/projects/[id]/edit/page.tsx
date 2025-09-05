'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { BillingMethod, ProjectStatus } from '@prisma/client'

interface ProjectFormData {
  name: string
  clientName: string
  estimatedDocuments: number | ''
  billingMethod: BillingMethod | ''
  deadline: string
  status: ProjectStatus | ''
}

interface Project {
  id: string
  name: string
  clientName: string
  estimatedDocuments: number | null
  billingMethod: BillingMethod
  deadline: Date | null
  status: ProjectStatus
}

export default function EditProjectPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string
  
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingProject, setIsLoadingProject] = useState(true)
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    clientName: '',
    estimatedDocuments: '',
    billingMethod: '',
    deadline: '',
    status: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Cargar datos del proyecto existente
  useEffect(() => {
    const loadProject = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            toast.error('Proyecto no encontrado')
            router.push('/projects')
            return
          }
          throw new Error('Error al cargar el proyecto')
        }

        const project: Project = await response.json()
        
        setFormData({
          name: project.name,
          clientName: project.clientName,
          estimatedDocuments: project.estimatedDocuments || '',
          billingMethod: project.billingMethod,
          deadline: project.deadline ? new Date(project.deadline).toISOString().split('T')[0] : '',
          status: project.status
        })
      } catch (error) {
        console.error('Error loading project:', error)
        toast.error('Error al cargar el proyecto')
        router.push('/projects')
      } finally {
        setIsLoadingProject(false)
      }
    }

    if (projectId) {
      loadProject()
    }
  }, [projectId, router])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre del proyecto es requerido'
    }

    if (!formData.clientName.trim()) {
      newErrors.clientName = 'El nombre del cliente es requerido'
    }

    if (!formData.billingMethod) {
      newErrors.billingMethod = 'El método de facturación es requerido'
    }

    if (!formData.status) {
      newErrors.status = 'El estado del proyecto es requerido'
    }

    if (formData.estimatedDocuments && formData.estimatedDocuments <= 0) {
      newErrors.estimatedDocuments = 'Los documentos estimados deben ser un número positivo'
    }

    if (formData.deadline) {
      const deadlineDate = new Date(formData.deadline)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (deadlineDate < today) {
        newErrors.deadline = 'La fecha límite no puede ser en el pasado'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Por favor corrige los errores en el formulario')
      return
    }

    setIsLoading(true)

    try {
      const submitData = {
        name: formData.name.trim(),
        clientName: formData.clientName.trim(),
        billingMethod: formData.billingMethod,
        status: formData.status,
        ...(formData.estimatedDocuments && { estimatedDocuments: Number(formData.estimatedDocuments) }),
        ...(formData.deadline && { deadline: new Date(formData.deadline).toISOString() })
      }

      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al actualizar el proyecto')
      }

      toast.success('Proyecto actualizado exitosamente')
      router.push('/projects')
    } catch (error) {
      console.error('Error updating project:', error)
      toast.error(error instanceof Error ? error.message : 'Error al actualizar el proyecto')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof ProjectFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  if (isLoadingProject) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Cargando proyecto...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        
        <h1 className="text-3xl font-bold">Editar Proyecto</h1>
        <p className="text-muted-foreground mt-2">
          Modifica la información del proyecto
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Información del Proyecto</CardTitle>
          <CardDescription>
            Actualiza los datos del proyecto. Los campos marcados con * son obligatorios.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del Proyecto *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Ej: Digitalización Archivo Municipal"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientName">Cliente *</Label>
                <Input
                  id="clientName"
                  value={formData.clientName}
                  onChange={(e) => handleInputChange('clientName', e.target.value)}
                  placeholder="Ej: Municipalidad de Santiago"
                  className={errors.clientName ? 'border-red-500' : ''}
                />
                {errors.clientName && (
                  <p className="text-sm text-red-500">{errors.clientName}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="billingMethod">Método de Facturación *</Label>
                <Select
                  value={formData.billingMethod}
                  onValueChange={(value) => handleInputChange('billingMethod', value as BillingMethod)}
                >
                  <SelectTrigger className={errors.billingMethod ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Selecciona un método" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem key={BillingMethod.PER_PAGE} value={BillingMethod.PER_PAGE}>Por Página</SelectItem>
                    <SelectItem key={BillingMethod.PER_HOUR} value={BillingMethod.PER_HOUR}>Por Hora</SelectItem>
                    <SelectItem key={BillingMethod.FIXED} value={BillingMethod.FIXED}>Precio Fijo</SelectItem>
                  </SelectContent>
                </Select>
                {errors.billingMethod && (
                  <p className="text-sm text-red-500">{errors.billingMethod}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Estado del Proyecto *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleInputChange('status', value as ProjectStatus)}
                >
                  <SelectTrigger className={errors.status ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Selecciona un estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem key={ProjectStatus.ACTIVE} value={ProjectStatus.ACTIVE}>Activo</SelectItem>
                    <SelectItem key={ProjectStatus.PAUSED} value={ProjectStatus.PAUSED}>En Pausa</SelectItem>
                    <SelectItem key={ProjectStatus.COMPLETED} value={ProjectStatus.COMPLETED}>Completado</SelectItem>
                    <SelectItem key={ProjectStatus.CANCELLED} value={ProjectStatus.CANCELLED}>Cancelado</SelectItem>
                  </SelectContent>
                </Select>
                {errors.status && (
                  <p className="text-sm text-red-500">{errors.status}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estimatedDocuments">Documentos Estimados</Label>
                <Input
                  id="estimatedDocuments"
                  type="number"
                  min="1"
                  value={formData.estimatedDocuments}
                  onChange={(e) => handleInputChange('estimatedDocuments', e.target.value ? Number(e.target.value) : '')}
                  placeholder="Ej: 1000"
                  className={errors.estimatedDocuments ? 'border-red-500' : ''}
                />
                {errors.estimatedDocuments && (
                  <p className="text-sm text-red-500">{errors.estimatedDocuments}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="deadline">Fecha Límite</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => handleInputChange('deadline', e.target.value)}
                  className={errors.deadline ? 'border-red-500' : ''}
                />
                {errors.deadline && (
                  <p className="text-sm text-red-500">{errors.deadline}</p>
                )}
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Actualizar Proyecto
                  </>
                )}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
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