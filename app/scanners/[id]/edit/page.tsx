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
import { ScannerStatus } from '@prisma/client'

interface Scanner {
  id: string
  name: string
  model: string
  serialNumber?: string
  location?: string
  status: ScannerStatus
  specifications?: string
  purchaseDate?: string
  warrantyExpiry?: string
  maintenanceNotes?: string
  currentCounter: number
  createdAt: string
  updatedAt: string
}

interface FormData {
  name: string
  model: string
  serialNumber: string
  location: string
  status: ScannerStatus
  specifications: string
  purchaseDate: string
  warrantyExpiry: string
  maintenanceNotes: string
}

const statusLabels = {
  [ScannerStatus.ACTIVE]: 'Activo',
  [ScannerStatus.MAINTENANCE]: 'En Mantenimiento'
}

export default function EditScannerPage() {
  const router = useRouter()
  const params = useParams()
  const scannerId = params.id as string

  const [scanner, setScanner] = useState<Scanner | null>(null)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    model: '',
    serialNumber: '',
    location: '',
    status: ScannerStatus.ACTIVE,
    specifications: '',
    purchaseDate: '',
    warrantyExpiry: '',
    maintenanceNotes: ''
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchScanner()
  }, [scannerId])

  const fetchScanner = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/scanners/${scannerId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Escáner no encontrado')
          router.push('/scanners')
          return
        }
        throw new Error('Error al cargar escáner')
      }

      const data = await response.json()
      setScanner(data)
      setFormData({
        name: data.name || '',
        model: data.model || '',
        serialNumber: data.serialNumber || '',
        location: data.location || '',
        status: data.status || ScannerStatus.ACTIVE,
        specifications: data.specifications || '',
        purchaseDate: data.purchaseDate ? data.purchaseDate.split('T')[0] : '',
        warrantyExpiry: data.warrantyExpiry ? data.warrantyExpiry.split('T')[0] : '',
        maintenanceNotes: data.maintenanceNotes || ''
      })
    } catch (error) {
      console.error('Error fetching scanner:', error)
      toast.error('Error al cargar los datos del escáner')
    } finally {
      setIsLoading(false)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido'
    }

    if (!formData.model.trim()) {
      newErrors.model = 'El modelo es requerido'
    }

    if (!formData.serialNumber.trim()) {
      newErrors.serialNumber = 'El número de serie es requerido'
    }

    if (!formData.location.trim()) {
      newErrors.location = 'La ubicación es requerida'
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
        model: formData.model,
        serialNumber: formData.serialNumber,
        location: formData.location,
        status: formData.status,
        specifications: formData.specifications || undefined,
        maintenanceNotes: formData.maintenanceNotes || undefined
      }

      // Agregar fechas si están presentes
      if (formData.purchaseDate) {
        updateData.purchaseDate = new Date(formData.purchaseDate).toISOString()
      }
      if (formData.warrantyExpiry) {
        updateData.warrantyExpiry = new Date(formData.warrantyExpiry).toISOString()
      }

      const response = await fetch(`/api/scanners/${scannerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al actualizar escáner')
      }

      toast.success('Escáner actualizado exitosamente')
      router.push('/scanners')
    } catch (error) {
      console.error('Error updating scanner:', error)
      toast.error(error instanceof Error ? error.message : 'Error al actualizar escáner')
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

  if (!scanner) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Escáner no encontrado</h1>
          <Button onClick={() => router.push('/scanners')} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a escáneres
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Button 
          onClick={() => router.push('/scanners')} 
          variant="outline" 
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a escáneres
        </Button>
        
        <h1 className="text-3xl font-bold text-gray-900">Editar Escáner</h1>
        <p className="text-gray-600 mt-2">Modifica la información del escáner</p>
      </div>

      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle>Información del Escáner</CardTitle>
          <CardDescription>
            Actualiza los datos del escáner. Los campos marcados con * son obligatorios.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Nombre del escáner"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Modelo *</Label>
                <Input
                  id="model"
                  type="text"
                  value={formData.model}
                  onChange={(e) => handleInputChange('model', e.target.value)}
                  placeholder="Modelo del escáner"
                  className={errors.model ? 'border-red-500' : ''}
                />
                {errors.model && (
                  <p className="text-sm text-red-500">{errors.model}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="serialNumber">Número de Serie *</Label>
                <Input
                  id="serialNumber"
                  type="text"
                  value={formData.serialNumber}
                  onChange={(e) => handleInputChange('serialNumber', e.target.value)}
                  placeholder="Número de serie"
                  className={errors.serialNumber ? 'border-red-500' : ''}
                />
                {errors.serialNumber && (
                  <p className="text-sm text-red-500">{errors.serialNumber}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Ubicación *</Label>
                <Input
                  id="location"
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="Ubicación del escáner"
                  className={errors.location ? 'border-red-500' : ''}
                />
                {errors.location && (
                  <p className="text-sm text-red-500">{errors.location}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: ScannerStatus) => handleInputChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(ScannerStatus).map((status) => (
                      <SelectItem key={status} value={status}>
                        {statusLabels[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="purchaseDate">Fecha de Compra</Label>
                <Input
                  id="purchaseDate"
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => handleInputChange('purchaseDate', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="warrantyExpiry">Vencimiento de Garantía</Label>
                <Input
                  id="warrantyExpiry"
                  type="date"
                  value={formData.warrantyExpiry}
                  onChange={(e) => handleInputChange('warrantyExpiry', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="specifications">Especificaciones</Label>
              <Textarea
                id="specifications"
                value={formData.specifications}
                onChange={(e) => handleInputChange('specifications', e.target.value)}
                placeholder="Especificaciones técnicas del escáner"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maintenanceNotes">Notas de Mantenimiento</Label>
              <Textarea
                id="maintenanceNotes"
                value={formData.maintenanceNotes}
                onChange={(e) => handleInputChange('maintenanceNotes', e.target.value)}
                placeholder="Notas sobre mantenimiento y reparaciones"
                rows={3}
              />
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
                onClick={() => router.push('/scanners')}
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