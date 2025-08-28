'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/Tabs'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import {
  Download,
  FileText,
  BarChart3,
  TrendingUp,
  Users,
  FolderOpen,
  Clock,
  CheckCircle,
  Calendar,
  Filter,
  Search,
} from 'lucide-react'
import { toast } from 'sonner'
import Layout from '@/components/layout/Layout'

interface ReportData {
  overview: {
    totalProjects: number
    completedProjects: number
    totalTasks: number
    completedTasks: number
    totalUsers: number
    activeUsers: number
    totalPagesProcessed: number
    averageProcessingTime: number
  }
  projectStats: Array<{
    id: string
    name: string
    status: string
    progress: number
    tasksCount: number
    completedTasks: number
    pagesProcessed: number
    estimatedPages: number
    startDate: string
    dueDate: string
  }>
  userPerformance: Array<{
    id: string
    name: string
    role: string
    tasksCompleted: number
    pagesProcessed: number
    averageTime: number
    efficiency: number
  }>
  monthlyProgress: Array<{
    month: string
    projects: number
    tasks: number
    pages: number
  }>
  taskDistribution: Array<{
    type: string
    count: number
    percentage: number
  }>
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

const ReportsPage = () => {
  const { data: session } = useSession()
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('last30days')
  const [projectFilter, setProjectFilter] = useState('all')
  const [userFilter, setUserFilter] = useState('all')
  const [exportFormat, setExportFormat] = useState('pdf')
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchReportData()
  }, [dateRange, projectFilter, userFilter])

  const fetchReportData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        dateRange,
        projectFilter,
        userFilter,
      })
      
      const response = await fetch(`/api/reports?${params}`)
      if (response.ok) {
        const data = await response.json()
        setReportData(data)
      } else {
        toast.error('Error al cargar los datos del reporte')
      }
    } catch (error) {
      console.error('Error fetching report data:', error)
      toast.error('Error al cargar los datos del reporte')
    } finally {
      setLoading(false)
    }
  }

  const handleExportReport = async () => {
    try {
      const params = new URLSearchParams({
        format: exportFormat,
        dateRange,
        projectFilter,
        userFilter,
        tab: activeTab,
      })
      
      const response = await fetch(`/api/reports/export?${params}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = `reporte_${activeTab}_${new Date().toISOString().split('T')[0]}.${exportFormat}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        toast.success('Reporte exportado exitosamente')
      } else {
        toast.error('Error al exportar el reporte')
      }
    } catch (error) {
      console.error('Error exporting report:', error)
      toast.error('Error al exportar el reporte')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800'
      case 'PLANNING':
        return 'bg-yellow-100 text-yellow-800'
      case 'ON_HOLD':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'Completado'
      case 'IN_PROGRESS':
        return 'En Progreso'
      case 'PLANNING':
        return 'Planificación'
      case 'ON_HOLD':
        return 'En Pausa'
      default:
        return status
    }
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-ES').format(num)
  }

  const formatPercentage = (num: number) => {
    return `${num.toFixed(1)}%`
  }

  const formatTime = (hours: number) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)} min`
    }
    return `${hours.toFixed(1)} h`
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Cargando reportes...</div>
        </div>
      </Layout>
    )
  }

  if (!reportData) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-600">Error al cargar los datos del reporte</div>
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
            <h1 className="text-3xl font-bold text-gray-900">Reportes</h1>
            <p className="text-gray-600 mt-1">
              Análisis y estadísticas del sistema de digitalización
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex gap-2">
            <Select value={exportFormat} onValueChange={setExportFormat}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="excel">Excel</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleExportReport}>
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Rango de fechas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last7days">Últimos 7 días</SelectItem>
                  <SelectItem value="last30days">Últimos 30 días</SelectItem>
                  <SelectItem value="last3months">Últimos 3 meses</SelectItem>
                  <SelectItem value="last6months">Últimos 6 meses</SelectItem>
                  <SelectItem value="lastyear">Último año</SelectItem>
                  <SelectItem value="all">Todo el tiempo</SelectItem>
                </SelectContent>
              </Select>
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Proyecto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los proyectos</SelectItem>
                  {reportData?.projectStats?.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  )) || []}
                </SelectContent>
              </Select>
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Usuario" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los usuarios</SelectItem>
                  {reportData?.userPerformance?.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  )) || []}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Reports Tabs */}
        {!reportData ? (
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                <p className="text-muted-foreground">Cargando datos del reporte...</p>
              </div>
            </CardContent>
          </Card>
        ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="projects">Proyectos</TabsTrigger>
            <TabsTrigger value="users">Usuarios</TabsTrigger>
            <TabsTrigger value="analytics">Análisis</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Proyectos</CardTitle>
                  <FolderOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(reportData?.overview?.totalProjects || 0)}</div>
                  <p className="text-xs text-muted-foreground">
                    {formatNumber(reportData?.overview?.completedProjects || 0)} completados
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Tareas</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(reportData?.overview?.totalTasks || 0)}</div>
                  <p className="text-xs text-muted-foreground">
                    {formatNumber(reportData?.overview?.completedTasks || 0)} completadas
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(reportData?.overview?.activeUsers || 0)}</div>
                  <p className="text-xs text-muted-foreground">
                    de {formatNumber(reportData?.overview?.totalUsers || 0)} total
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Páginas Procesadas</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(reportData?.overview?.totalPagesProcessed || 0)}</div>
                  <p className="text-xs text-muted-foreground">
                    Promedio: {formatTime(reportData?.overview?.averageProcessingTime || 0)} por página
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Progreso Mensual</CardTitle>
                  <CardDescription>
                    Páginas procesadas por mes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={reportData?.monthlyProgress || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="pages" stroke="#8884d8" name="Páginas" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Distribución de Tareas</CardTitle>
                  <CardDescription>
                    Por tipo de tarea
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={reportData?.taskDistribution || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ type, percentage }) => `${type} (${percentage}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {(reportData?.taskDistribution || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Estadísticas de Proyectos</CardTitle>
                <CardDescription>
                  Resumen del progreso y estado de todos los proyectos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Proyecto</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Progreso</TableHead>
                      <TableHead>Tareas</TableHead>
                      <TableHead>Páginas</TableHead>
                      <TableHead>Fecha Inicio</TableHead>
                      <TableHead>Fecha Límite</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(reportData?.projectStats || []).map((project) => (
                      <TableRow key={project.id}>
                        <TableCell className="font-medium">{project.name}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(project.status)}>
                            {getStatusLabel(project.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${project.progress}%` }}
                              ></div>
                            </div>
                            <span className="text-sm">{formatPercentage(project.progress)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {project.completedTasks} / {project.tasksCount}
                        </TableCell>
                        <TableCell>
                          {formatNumber(project.pagesProcessed)} / {formatNumber(project.estimatedPages)}
                        </TableCell>
                        <TableCell>
                          {new Date(project.startDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {new Date(project.dueDate).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Rendimiento de Usuarios</CardTitle>
                <CardDescription>
                  Estadísticas de productividad y eficiencia por usuario
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Tareas Completadas</TableHead>
                      <TableHead>Páginas Procesadas</TableHead>
                      <TableHead>Tiempo Promedio</TableHead>
                      <TableHead>Eficiencia</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(reportData?.userPerformance || []).map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{user.role}</Badge>
                        </TableCell>
                        <TableCell>{formatNumber(user.tasksCompleted)}</TableCell>
                        <TableCell>{formatNumber(user.pagesProcessed)}</TableCell>
                        <TableCell>{formatTime(user.averageTime)}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-600 h-2 rounded-full"
                                style={{ width: `${user.efficiency}%` }}
                              ></div>
                            </div>
                            <span className="text-sm">{formatPercentage(user.efficiency)}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Proyectos vs Tareas</CardTitle>
                  <CardDescription>
                    Comparación mensual de proyectos y tareas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={reportData?.monthlyProgress || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="projects" fill="#8884d8" name="Proyectos" />
                      <Bar dataKey="tasks" fill="#82ca9d" name="Tareas" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tendencia de Páginas</CardTitle>
                  <CardDescription>
                    Páginas procesadas a lo largo del tiempo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={reportData?.monthlyProgress || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="pages" 
                        stroke="#8884d8" 
                        strokeWidth={3}
                        name="Páginas Procesadas" 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Eficiencia Promedio</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatPercentage(
                      (reportData?.userPerformance || []).reduce((acc, user) => acc + user.efficiency, 0) /
                      Math.max((reportData?.userPerformance || []).length, 1)
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Basado en {(reportData?.userPerformance || []).length} usuarios
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tiempo Promedio</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatTime(reportData?.overview?.averageProcessingTime || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Por página procesada
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tasa de Finalización</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatPercentage(
                      ((reportData?.overview?.completedTasks || 0) / Math.max(reportData?.overview?.totalTasks || 1, 1)) * 100
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Tareas completadas
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
        )}
      </div>
    </Layout>
  )
}

export default ReportsPage