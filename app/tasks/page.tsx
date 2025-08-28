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
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Calendar,
  User,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Play,
  Pause,
  CheckSquare
} from 'lucide-react'
import { toast } from 'sonner'
import Layout from '@/components/layout/Layout'
import Link from 'next/link'

interface Task {
  id: string
  title: string
  description: string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD'
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  type: 'SCANNING' | 'INDEXING' | 'QUALITY_CONTROL' | 'METADATA'
  estimatedPages: number
  processedPages: number
  assignedUserId: string
  assignedUser: {
    id: string
    name: string
    email: string
  }
  projectId: string
  project: {
    id: string
    name: string
  }
  dueDate: string
  startedAt?: string
  completedAt?: string
  createdAt: string
  updatedAt: string
}

const TasksPage = () => {
  const { data: session } = useSession()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [projectFilter, setProjectFilter] = useState<string>('all')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/tasks')
      if (response.ok) {
        const data = await response.json()
        setTasks(data.tasks || [])
      } else {
        toast.error('Error al cargar las tareas')
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
      toast.error('Error al cargar las tareas')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Tarea eliminada exitosamente')
        fetchTasks()
        setIsDeleteDialogOpen(false)
        setSelectedTask(null)
      } else {
        const error = await response.json()
        toast.error(error.message || 'Error al eliminar la tarea')
      }
    } catch (error) {
      console.error('Error deleting task:', error)
      toast.error('Error al eliminar la tarea')
    }
  }

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        toast.success('Estado de la tarea actualizado')
        fetchTasks()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Error al actualizar la tarea')
      }
    } catch (error) {
      console.error('Error updating task:', error)
      toast.error('Error al actualizar la tarea')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-gray-100 text-gray-800'
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800'
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'ON_HOLD':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-100 text-red-800'
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800'
      case 'LOW':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Pendiente'
      case 'IN_PROGRESS':
        return 'En Progreso'
      case 'COMPLETED':
        return 'Completada'
      case 'ON_HOLD':
        return 'En Pausa'
      default:
        return status
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'Alta'
      case 'MEDIUM':
        return 'Media'
      case 'LOW':
        return 'Baja'
      default:
        return priority
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'SCANNING':
        return 'Escaneo'
      case 'INDEXING':
        return 'Indexación'
      case 'QUALITY_CONTROL':
        return 'Control de Calidad'
      case 'METADATA':
        return 'Metadatos'
      default:
        return type
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4" />
      case 'IN_PROGRESS':
        return <Play className="h-4 w-4" />
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4" />
      case 'ON_HOLD':
        return <Pause className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = (task.title?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
                         (task.description?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
                         (task.assignedUser?.name?.toLowerCase() ?? '').includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter
    const matchesType = typeFilter === 'all' || task.type === typeFilter
    const matchesProject = projectFilter === 'all' || task.projectId === projectFilter
    
    return matchesSearch && matchesStatus && matchesPriority && matchesType && matchesProject
  })

  const calculateProgress = (task: Task) => {
    if (task.estimatedPages === 0) return 0
    return Math.round((task.processedPages / task.estimatedPages) * 100)
  }

  const uniqueProjects = Array.from(new Set(tasks.map(task => task.project.id)))
    .map(id => tasks.find(task => task.project.id === id)?.project)
    .filter(Boolean)

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Cargando tareas...</div>
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
            <h1 className="text-3xl font-bold text-gray-900">Tareas</h1>
            <p className="text-gray-600 mt-1">
              Gestiona y supervisa todas las tareas de digitalización
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
            <Link href="/tasks/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Tarea
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar tareas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="PENDING">Pendiente</SelectItem>
                  <SelectItem value="IN_PROGRESS">En Progreso</SelectItem>
                  <SelectItem value="COMPLETED">Completada</SelectItem>
                  <SelectItem value="ON_HOLD">En Pausa</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Prioridad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las prioridades</SelectItem>
                  <SelectItem value="HIGH">Alta</SelectItem>
                  <SelectItem value="MEDIUM">Media</SelectItem>
                  <SelectItem value="LOW">Baja</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="SCANNING">Escaneo</SelectItem>
                  <SelectItem value="INDEXING">Indexación</SelectItem>
                  <SelectItem value="QUALITY_CONTROL">Control de Calidad</SelectItem>
                  <SelectItem value="METADATA">Metadatos</SelectItem>
                </SelectContent>
              </Select>
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Proyecto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los proyectos</SelectItem>
                  {uniqueProjects.map((project) => (
                    <SelectItem key={project?.id} value={project?.id || ''}>
                      {project?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tasks Content */}
        {filteredTasks.length > 0 ? (
          viewMode === 'table' ? (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tarea</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Prioridad</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Asignado a</TableHead>
                      <TableHead>Proyecto</TableHead>
                      <TableHead>Progreso</TableHead>
                      <TableHead>Fecha límite</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{task.title}</div>
                            <div className="text-sm text-muted-foreground line-clamp-1">
                              {task.description}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(task.status)}>
                            {getStatusIcon(task.status)}
                            <span className="ml-1">{getStatusLabel(task.status)}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPriorityColor(task.priority)}>
                            {getPriorityLabel(task.priority)}
                          </Badge>
                        </TableCell>
                        <TableCell>{getTypeLabel(task.type)}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <User className="mr-2 h-4 w-4" />
                            {task.assignedUser?.name ?? 'Sin asignar'}
                          </div>
                        </TableCell>
                        <TableCell>{task.project?.name ?? 'Sin proyecto'}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Progress value={calculateProgress(task)} className="h-2" />
                            <div className="text-xs text-muted-foreground">
                              {task.processedPages} / {task.estimatedPages} páginas
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm">
                            <Calendar className="mr-1 h-3 w-3" />
                            {new Date(task.dueDate).toLocaleDateString()}
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
                                <Link href={`/tasks/${task.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Ver detalles
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/tasks/${task.id}/edit`}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Editar
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {task.status === 'PENDING' && (
                                <DropdownMenuItem
                                  onClick={() => handleStatusChange(task.id, 'IN_PROGRESS')}
                                >
                                  <Play className="mr-2 h-4 w-4" />
                                  Iniciar
                                </DropdownMenuItem>
                              )}
                              {task.status === 'IN_PROGRESS' && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => handleStatusChange(task.id, 'ON_HOLD')}
                                  >
                                    <Pause className="mr-2 h-4 w-4" />
                                    Pausar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleStatusChange(task.id, 'COMPLETED')}
                                  >
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Completar
                                  </DropdownMenuItem>
                                </>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => {
                                  setSelectedTask(task)
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
              {filteredTasks.map((task) => (
                <Card key={task.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{task.title}</CardTitle>
                        <CardDescription className="mt-1 line-clamp-2">
                          {task.description}
                        </CardDescription>
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
                            <Link href={`/tasks/${task.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver detalles
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/tasks/${task.id}/edit`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => {
                              setSelectedTask(task)
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
                      <Badge className={getStatusColor(task.status)}>
                        {getStatusIcon(task.status)}
                        <span className="ml-1">{getStatusLabel(task.status)}</span>
                      </Badge>
                      <Badge className={getPriorityColor(task.priority)}>
                        {getPriorityLabel(task.priority)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Progress */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progreso</span>
                        <span>{task.processedPages} / {task.estimatedPages} páginas</span>
                      </div>
                      <Progress value={calculateProgress(task)} className="h-2" />
                    </div>

                    {/* Info */}
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <User className="mr-2 h-3 w-3" />
                        {task.assignedUser?.name ?? 'Sin asignar'}
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <FileText className="mr-2 h-3 w-3" />
                        {task.project?.name ?? 'Sin proyecto'}
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="mr-2 h-3 w-3" />
                        Vence: {new Date(task.dueDate).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Type */}
                    <div className="pt-2 border-t">
                      <span className="text-xs font-medium text-muted-foreground">
                        {getTypeLabel(task.type)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CheckSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No se encontraron tareas</h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' || typeFilter !== 'all'
                  ? 'No hay tareas que coincidan con los filtros aplicados.'
                  : 'Aún no tienes tareas creadas. Crea tu primera tarea para comenzar.'}
              </p>
              {!searchTerm && statusFilter === 'all' && priorityFilter === 'all' && typeFilter === 'all' && (
                <Link href="/tasks/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Crear primera tarea
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>¿Eliminar tarea?</DialogTitle>
              <DialogDescription>
                Esta acción no se puede deshacer. Se eliminará permanentemente la tarea
                "{selectedTask?.title}" y todos sus datos asociados.
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
                onClick={() => selectedTask && handleDeleteTask(selectedTask.id)}
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

export default TasksPage