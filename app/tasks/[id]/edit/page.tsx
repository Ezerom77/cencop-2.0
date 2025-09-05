'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { Stage, TaskStatus } from '@prisma/client'

interface Task {
  id: string
  stage: Stage
  scannerId: string
  documentsProcessed: number
  startTime?: string
  endTime?: string
  notes?: string
  qualityScore?: number
  status: TaskStatus
  duration?: number
  project: {
    id: string
    name: string
    clientName: string
  }
  employee: {
    id: string
    name: string
    email: string
  }
  scanner: {
    id: string
    name: string
    model: string
  }
}

interface Scanner {
  id: string
  name: string
  model: string
  status: string
}

interface FormData {
  stage: Stage
  scannerId: string
  documentsProcessed: number
  startTime: string
  endTime: string
  notes: string
  qualityScore: number | ''
  status: TaskStatus
}

const stageLabels = {
  [Stage.PREPARATION]: 'Preparación',
  [Stage.SCANNING]: 'Escaneo',
  [Stage.QUALITY_CONTROL]: 'Control de Calidad',
  [Stage.INDEXING]: 'Indexación',
  [Stage.DELIVERY]: 'Entrega'
}

const statusLabels = {
  [TaskStatus.PENDING]: 'Pendiente',
  [TaskStatus.IN_PROGRESS]: 'En Progreso',
  [TaskStatus.COMPLETED]: 'Completada',
  [TaskStatus.CANCELLED]: 'Cancelada'
}

export default function EditTaskPage() {
  const router = useRouter()
  const params = useParams()
  const taskId = params.id as string

  const [task, setTask] = useState<Task | null>(null)
  const [scanners, setScanners] = useState<Scanner[]>([])
  const [formData, setFormData] = useState<FormData>({
    stage: Stage.PREPARATION,
    scannerId: '',
    documentsProcessed: 0,
    startTime: '',
    endTime: '',
    notes: '',
    qualityScore: '',
    status: TaskStatus.PENDING
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchTask()
    fetchScanners()
  }, [taskId])

  const fetchTask = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/tasks/${taskId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Tarea no encontrada')
          router.push('/tasks')
          return
        }
        throw new Error('Error al cargar tarea')
      }

      const data = await response.json()
      setTask(data)
      setFormData({
        stage: data.stage || Stage.PREPARATION,
        scannerId: data.scannerId || '',
        documentsProcessed: data.documentsProcessed || 0,
        startTime: data.startTime ? new Date(data.startTime).toISOString().slice(0, 16) : '',
        endTime: data.endTime ? new Date(data.endTime).toISOString().slice(0, 16) : '',
        notes: data.notes || '',
        qualityScore: data.qualityScore || '',
        status: data.status || TaskStatus.PENDING
      })
    } catch (error) {
      console.error('Error fetching task:', error)
      toast.error('Error al cargar los datos de la tarea')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchScanners = async () => {
    try {
      const response = await fetch('/api/scanners')
      if (response.ok) {
        const data = await response.json()
        setScanners(data.scanners || [])
      }
    } catch (error) {
      console.error('Error fetching scanners:', error)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.scannerId) {
      newErrors.scannerId = 'El escáner es requerido'
    }

    if (formData.documentsProcessed < 0) {
      newErrors.documentsProcessed = 'Los documentos procesados no pueden ser negativos'
    }

    if (formData.startTime && formData.endTime) {
      const startDate = new Date(formData.startTime)
      const endDate = new Date(formData.endTime)
      if (endDate <= startDate) {
        newErrors.endTime = 'La fecha de fin debe ser posterior a la fecha de inicio'
      }
    }

    if (formData.qualityScore !== '' && (formData.qualityScore < 1 || formData.qualityScore > 10)) {
      newErrors.qualityScore = 'La puntuación de calidad debe estar entre 1 y 10'
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
      
      const updateData: any = {
        stage: formData.stage,
        scannerId: formData.scannerId,
        documentsProcessed: formData.documentsProcessed,
        status: formData.status
      }

      if (formData.startTime) {
        updateData.startTime = new Date(formData.startTime).toISOString()
      }

      if (formData.endTime) {
        updateData.endTime = new Date(formData.endTime).toISOString()
      }

      if (formData.notes.trim()) {
        updateData.notes = formData.notes
      }

      if (formData.qualityScore !== '') {
        updateData.qualityScore = Number(formData.qualityScore)
      }

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al actualizar tarea')
      }

      toast.success('Tarea actualizada exitosamente')
      router.push('/tasks')
    } catch (error) {
      console.error('Error updating task:', error)
      toast.error(error instanceof Error ? error.message : 'Error al actualizar tarea')
    } finally {
      setIsSaving(false)
    }
  }

  const handleInputChange = (field: keyof FormData, value: string | number) => {
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

  if (!task) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Tarea no encontrada</h1>
          <Button onClick={() => router.push('/tasks')} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a tareas
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Button 
          onClick={() => router.push('/tasks')} 
          variant="outline" 
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a tareas
        </Button>
        
        <h1 className="text-3xl font-bold text-gray-900">Editar Tarea</h1>
        <p className="text-gray-600 mt-2">
          Proyecto: {task.project.name} - Cliente: {task.project.clientName}
        </p>
        <p className="text-gray-600">
          Empleado: {task.employee.name}
        </p>
      </div>

      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle>Información de la Tarea</CardTitle>
          <CardDescription>
            Actualiza los datos de la tarea. Los campos marcados con * son obligatorios.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="stage">Etapa</Label>
                <Select
                  value={formData.stage}
                  onValueChange={(value: Stage) => handleInputChange('stage', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una etapa" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(Stage).map((stage) => (
                      <SelectItem key={stage} value={stage}>
                        {stageLabels[stage]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: TaskStatus) => handleInputChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(TaskStatus).map((status) => (
                      <SelectItem key={status} value={status}>
                        {statusLabels[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scannerId">Escáner *</Label>
                <Select
                  value={formData.scannerId}
                  onValueChange={(value: string) => handleInputChange('scannerId', value)}
                >
                  <SelectTrigger className={errors.scannerId ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Selecciona un escáner" />
                  </SelectTrigger>
                  <SelectContent>
                    {scanners.map((scanner) => (
                      <SelectItem key={scanner.id} value={scanner.id}>
                        {scanner.name} - {scanner.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.scannerId && (
                  <p className="text-sm text-red-500">{errors.scannerId}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="documentsProcessed">Documentos Procesados</Label>
                <Input
                  id="documentsProcessed"
                  type="number"
                  min="0"
                  value={formData.documentsProcessed}
                  onChange={(e) => handleInputChange('documentsProcessed', parseInt(e.target.value) || 0)}
                  className={errors.documentsProcessed ? 'border-red-500' : ''}
                />
                {errors.documentsProcessed && (
                  <p className="text-sm text-red-500">{errors.documentsProcessed}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="startTime">Fecha y Hora de Inicio</Label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => handleInputChange('startTime', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime">Fecha y Hora de Fin</Label>
                <Input
                  id="endTime"
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => handleInputChange('endTime', e.target.value)}
                  className={errors.endTime ? 'border-red-500' : ''}
                />
                {errors.endTime && (
                  <p className="text-sm text-red-500">{errors.endTime}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="qualityScore">Puntuación de Calidad (1-10)</Label>
                <Input
                  id="qualityScore"
                  type="number"
                  min="1"
                  max="10"
                  step="0.1"
                  value={formData.qualityScore}
                  onChange={(e) => handleInputChange('qualityScore', e.target.value ? parseFloat(e.target.value) : '')}
                  placeholder="Opcional"
                  className={errors.qualityScore ? 'border-red-500' : ''}
                />
                {errors.qualityScore && (
                  <p className="text-sm text-red-500">{errors.qualityScore}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Notas adicionales sobre la tarea"
                rows={4}
              />
            </div>

            {task.duration && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Información Adicional</h3>
                <p className="text-sm text-gray-600">
                  Duración actual: {task.duration} horas
                </p>
              </div>
            )}

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
                onClick={() => router.push('/tasks')}
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