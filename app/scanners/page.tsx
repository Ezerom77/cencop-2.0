'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'
import { Label } from '@/components/ui/Label'
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Play,
  Pause,
  Square,
  Wifi,
  WifiOff,
  Monitor,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Scan,
  FileText,
  Settings,
  Download,
  Upload,
} from 'lucide-react'
import { toast } from 'sonner'
import Layout from '@/components/layout/Layout'
import Link from 'next/link'

interface Scanner {
  id: string
  name: string
  model: string
  serialNumber?: string
  ipAddress?: string
  location?: string
  status: 'ACTIVE' | 'MAINTENANCE'
  assignedTo?: string
  lastScan?: string
  totalScans: number
  pagesScanned?: number
  errorCount: number
  uptime: number
  version?: string
  settings?: {
    resolution?: string
    colorMode?: string
    autoFeed?: boolean
  }
  stats?: {
    dailyScans: number
    weeklyScans: number
    monthlyScans: number
  }
  // Campos adicionales de la API
  pagesThisMonth?: number
  usageThisMonth?: number
  avgPagesPerDay?: number
  lastUsed?: string
  lastUsedBy?: string
  avgScanTime?: number
}

const ScannersPage = () => {
  const { data: session } = useSession()
  const [scanners, setScanners] = useState<Scanner[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [locationFilter, setLocationFilter] = useState<string>('all')
  const [selectedScanner, setSelectedScanner] = useState<Scanner | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isStartScanDialogOpen, setIsStartScanDialogOpen] = useState(false)
  const [currentCounter, setCurrentCounter] = useState('')
  const [scannerToStart, setScannerToStart] = useState<Scanner | null>(null)
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')

  useEffect(() => {
    fetchScanners()
    // Set up real-time updates
    const interval = setInterval(fetchScanners, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchScanners = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/scanners')
      if (response.ok) {
        const data = await response.json()
        setScanners(data.scanners || [])
      } else {
        toast.error('Error al cargar los escáneres')
      }
    } catch (error) {
      console.error('Error fetching scanners:', error)
      toast.error('Error al cargar los escáneres')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteScanner = async (scannerId: string) => {
    try {
      const response = await fetch(`/api/scanners/${scannerId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Escáner eliminado exitosamente')
        fetchScanners()
        setIsDeleteDialogOpen(false)
        setSelectedScanner(null)
      } else {
        const error = await response.json()
        toast.error(error.message || 'Error al eliminar el escáner')
      }
    } catch (error) {
      console.error('Error deleting scanner:', error)
      toast.error('Error al eliminar el escáner')
    }
  }

  const handleScannerAction = async (scannerId: string, action: 'start' | 'pause' | 'stop' | 'restart') => {
    if (action === 'start') {
      // Open modal to request current counter
      const scanner = scanners.find(s => s.id === scannerId)
      if (scanner) {
        setScannerToStart(scanner)
        setIsStartScanDialogOpen(true)
        return
      }
    }

    try {
      const response = await fetch(`/api/scanners/${scannerId}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      })

      if (response.ok) {
        const actionLabels = {
          start: 'iniciado',
          pause: 'pausado',
          stop: 'detenido',
          restart: 'reiniciado'
        }
        toast.success(`Escáner ${actionLabels[action]} exitosamente`)
        fetchScanners()
      } else {
        const error = await response.json()
        toast.error(error.message || `Error al ${action} el escáner`)
      }
    } catch (error) {
      console.error(`Error ${action} scanner:`, error)
      toast.error(`Error al ${action} el escáner`)
    }
  }

  const handleStartScan = async () => {
    if (!scannerToStart || !currentCounter.trim()) {
      toast.error('Por favor ingrese el contador actual')
      return
    }

    try {
      const response = await fetch(`/api/scanners/${scannerToStart.id}/start-scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'start',
          currentCounter: parseInt(currentCounter)
        }),
      })

      if (!response.ok) {
        throw new Error('Error al iniciar el escaneo')
      }

      // Close modal and reset state
      setIsStartScanDialogOpen(false)
      setScannerToStart(null)
      setCurrentCounter('')
      
      // Refresh the scanners list
      fetchScanners()
      toast.success('Escaneo iniciado correctamente')
    } catch (error) {
      console.error('Error starting scan:', error)
      toast.error('Error al iniciar el escaneo')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800'
      case 'MAINTENANCE':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Activo'
      case 'MAINTENANCE':
        return 'En Mantenimiento'
      default:
        return status
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle className="h-4 w-4" />
      case 'MAINTENANCE':
        return <Settings className="h-4 w-4" />
      default:
        return <Monitor className="h-4 w-4" />
    }
  }

  const formatUptime = (hours: number) => {
    if (hours < 24) {
      return `${Math.round(hours)}h`
    }
    const days = Math.floor(hours / 24)
    const remainingHours = Math.round(hours % 24)
    return `${days}d ${remainingHours}h`
  }

  const filteredScanners = scanners.filter(scanner => {
    const matchesSearch = scanner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         scanner.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (scanner.location && scanner.location.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesStatus = statusFilter === 'all' || scanner.status === statusFilter
    const matchesLocation = locationFilter === 'all' || scanner.location === locationFilter
    
    return matchesSearch && matchesStatus && matchesLocation
  })

  const uniqueLocations = Array.from(new Set(scanners.map(scanner => scanner.location).filter(location => location && location.trim() !== '')))

  const getHealthScore = (scanner: Scanner) => {
    // Validar que los valores existan y sean números válidos
    const uptime = typeof scanner.uptime === 'number' && !isNaN(scanner.uptime) ? scanner.uptime : 0
    const errorCount = typeof scanner.errorCount === 'number' && !isNaN(scanner.errorCount) ? scanner.errorCount : 0
    const totalScans = typeof scanner.totalScans === 'number' && !isNaN(scanner.totalScans) ? scanner.totalScans : 0
    
    // Calcular puntuación de uptime (máximo 40 puntos)
    // Basado en días de funcionamiento, máximo 30 días para 100%
    const uptimeScore = Math.min(uptime / (24 * 30), 1) * 40
    
    // Calcular puntuación de errores (máximo 30 puntos)
    // Restar 2 puntos por cada error, mínimo 0
    const errorScore = Math.max(0, 30 - (errorCount * 2))
    
    // Calcular puntuación de uso (máximo 30 puntos)
    // Basado en número de escaneos, máximo 500 escaneos para 100%
    const usageScore = Math.min(totalScans / 500, 1) * 30
    
    const totalScore = uptimeScore + errorScore + usageScore
    
    // Asegurar que el resultado esté entre 0 y 100
    return Math.round(Math.max(0, Math.min(100, totalScore)))
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Cargando escáneres...</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Escáneres</h1>
            <p className="text-gray-600 mt-1">
              Monitorea y gestiona los dispositivos de escaneo
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex gap-2">
            <Button
              variant={viewMode === 'table' ? 'default' : 'outline'}
              onClick={() => setViewMode('table')}
            >
              Tabla
            </Button>
            <Button
              variant={viewMode === 'cards' ? 'default' : 'outline'}
              onClick={() => setViewMode('cards')}
            >
              Tarjetas
            </Button>
            <Link href="/scanners/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Escáner
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Escáneres</CardTitle>
              <Monitor className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{scanners.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Activos</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {scanners.filter(s => s.status === 'ACTIVE').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En Mantenimiento</CardTitle>
              <Settings className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {scanners.filter(s => s.status === 'MAINTENANCE').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar escáneres..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="all" value="all">Todos los estados</SelectItem>
                <SelectItem key="ACTIVE" value="ACTIVE">Activo</SelectItem>
                <SelectItem key="MAINTENANCE" value="MAINTENANCE">En Mantenimiento</SelectItem>
              </SelectContent>
            </Select>
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Ubicación" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las ubicaciones</SelectItem>
                  {uniqueLocations.map((location) => (
                    <SelectItem key={location} value={location!}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Scanners Content */}
        {filteredScanners.length > 0 ? (
          viewMode === 'table' ? (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Escáner</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Ubicación</TableHead>
                      <TableHead>Estadísticas</TableHead>
                      <TableHead>Rendimiento</TableHead>
                      <TableHead>Último escaneo</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredScanners.map((scanner) => (
                      <TableRow key={scanner.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{scanner.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {scanner.model}{scanner.serialNumber ? ` - ${scanner.serialNumber}` : ''}
                            </div>
                            {scanner.ipAddress && (
                              <div className="text-sm text-muted-foreground">
                                IP: {scanner.ipAddress}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(scanner.status)}>
                            {getStatusIcon(scanner.status)}
                            <span className="ml-1">{getStatusLabel(scanner.status)}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{scanner.location || 'Sin ubicación'}</div>
                            {scanner.assignedTo && (
                              <div className="text-sm text-muted-foreground">
                                Asignado a: {scanner.assignedTo}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm">
                              <span className="font-medium">{scanner.totalScans}</span>
                              <span className="text-muted-foreground"> escaneos totales</span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {scanner.pagesScanned || 0} páginas
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Hoy: {scanner.stats?.dailyScans ?? 0} escaneos
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span>Salud:</span>
                              <span className="font-medium">{getHealthScore(scanner)}%</span>
                            </div>
                            <Progress value={getHealthScore(scanner)} className="h-2" />
                            <div className="text-xs text-muted-foreground">
                              Uptime: {formatUptime(scanner.uptime)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {scanner.lastScan ? (
                              <div className="flex items-center">
                                <Clock className="mr-1 h-3 w-3" />
                                {new Date(scanner.lastScan).toLocaleDateString()}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Nunca</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem asChild>
                                <Link href={`/scanners/${scanner.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Ver detalles
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/scanners/${scanner.id}/edit`}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Configurar
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {scanner.status === 'ONLINE' && (
                                <DropdownMenuItem
                                  onClick={() => handleScannerAction(scanner.id, 'start')}
                                >
                                  <Play className="mr-2 h-4 w-4" />
                                  Iniciar escaneo
                                </DropdownMenuItem>
                              )}
                              {scanner.status === 'SCANNING' && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => handleScannerAction(scanner.id, 'pause')}
                                  >
                                    <Pause className="mr-2 h-4 w-4" />
                                    Pausar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleScannerAction(scanner.id, 'stop')}
                                  >
                                    <Square className="mr-2 h-4 w-4" />
                                    Detener
                                  </DropdownMenuItem>
                                </>
                              )}
                              <DropdownMenuItem
                                onClick={() => handleScannerAction(scanner.id, 'restart')}
                              >
                                <Settings className="mr-2 h-4 w-4" />
                                Reiniciar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => {
                                  setSelectedScanner(scanner)
                                  setIsDeleteDialogOpen(true)
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredScanners.map((scanner) => (
                <Card key={scanner.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{scanner.name}</CardTitle>
                        <CardDescription>{scanner.model}</CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href={`/scanners/${scanner.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver detalles
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/scanners/${scanner.id}/edit`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Configurar
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => {
                              setSelectedScanner(scanner)
                              setIsDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <Badge className={getStatusColor(scanner.status)}>
                        {getStatusIcon(scanner.status)}
                        <span className="ml-1">{getStatusLabel(scanner.status)}</span>
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Device Info */}
                    <div className="space-y-2">
                      {scanner.serialNumber && (
                        <div className="text-sm text-muted-foreground">
                          <strong>Serie:</strong> {scanner.serialNumber}
                        </div>
                      )}
                      {scanner.ipAddress && (
                        <div className="text-sm text-muted-foreground">
                          <strong>IP:</strong> {scanner.ipAddress}
                        </div>
                      )}
                      <div className="text-sm text-muted-foreground">
                        <strong>Ubicación:</strong> {scanner.location || 'Sin ubicación'}
                      </div>
                      {scanner.assignedTo && (
                        <div className="text-sm text-muted-foreground">
                          <strong>Asignado a:</strong> {scanner.assignedTo}
                        </div>
                      )}
                    </div>

                    {/* Health Score */}
                    <div className="space-y-2 pt-2 border-t">
                      <div className="flex items-center justify-between text-sm">
                        <span>Estado de salud:</span>
                        <span className="font-medium">{getHealthScore(scanner)}%</span>
                      </div>
                      <Progress value={getHealthScore(scanner)} className="h-2" />
                    </div>

                    {/* Stats */}
                    <div className="space-y-2 pt-2 border-t">
                      <div className="flex justify-between text-sm">
                        <span>Escaneos totales:</span>
                        <span className="font-medium">{scanner.totalScans}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Páginas procesadas:</span>
                        <span className="font-medium">{scanner.pagesScanned || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Escaneos hoy:</span>
                        <span className="font-medium">{scanner.stats?.dailyScans ?? 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Tiempo promedio:</span>
                        <span className="font-medium">{scanner.avgScanTime ?? 0}s</span>
                      </div>
                    </div>

                    {/* Uptime and Last Scan */}
                    <div className="pt-2 border-t">
                      <div className="flex items-center text-sm text-muted-foreground mb-1">
                        <Activity className="mr-2 h-3 w-3" />
                        Uptime: {formatUptime(scanner.uptime)}
                      </div>
                      {scanner.lastScan && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="mr-2 h-3 w-3" />
                          Último escaneo: {new Date(scanner.lastScan).toLocaleDateString()}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 border-t">
                      <div className="flex gap-2">
                        {scanner.status === 'ACTIVE' && (
                          <Button
                            size="sm"
                            onClick={() => handleScannerAction(scanner.id, 'start')}
                          >
                            <Play className="mr-1 h-3 w-3" />
                            Iniciar escaneo
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleScannerAction(scanner.id, 'restart')}
                        >
                          <Settings className="mr-1 h-3 w-3" />
                          Reiniciar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Monitor className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No se encontraron escáneres</h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchTerm || statusFilter !== 'all' || locationFilter !== 'all'
                  ? 'No hay escáneres que coincidan con los filtros aplicados.'
                  : 'Aún no tienes escáneres registrados. Agrega tu primer escáner para comenzar.'}
              </p>
              {!searchTerm && statusFilter === 'all' && locationFilter === 'all' && (
                <Link href="/scanners/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar primer escáner
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}

        {/* Start Scan Dialog */}
        <Dialog open={isStartScanDialogOpen} onOpenChange={setIsStartScanDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Iniciar Escaneo</DialogTitle>
              <DialogDescription>
                Ingrese el contador actual del escáner "{scannerToStart?.name}" para iniciar el escaneo.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="counter">Contador Actual</Label>
                <Input
                  id="counter"
                  type="number"
                  placeholder="Ej: 12345"
                  value={currentCounter}
                  onChange={(e) => setCurrentCounter(e.target.value)}
                  min="0"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsStartScanDialogOpen(false)
                  setScannerToStart(null)
                  setCurrentCounter('')
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleStartScan}>
                Iniciar Escaneo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>¿Eliminar escáner?</DialogTitle>
              <DialogDescription>
                Esta acción no se puede deshacer. Se eliminará permanentemente el escáner
                "{selectedScanner?.name}" y todos sus datos asociados.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={() => selectedScanner && handleDeleteScanner(selectedScanner.id)}
              >
                Eliminar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  )
}

export default ScannersPage