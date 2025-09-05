"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/Dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Users,
  FileText,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import Layout from "@/components/layout/Layout";
import Link from "next/link";

interface Project {
  id: string;
  name: string;
  clientName: string;
  status: "ACTIVE" | "COMPLETED" | "PAUSED" | "CANCELLED";
  billingMethod: "PER_DOCUMENT" | "PER_HOUR";
  estimatedDocuments: number | null;
  deadline: string | null;
  managerId: string;
  totalPages: number;
  completedTasks: number;
  progress: number;
  _count: {
    taskRecords: number;
  };
  createdAt: string;
  updatedAt: string;
}

const ProjectsPage = () => {
  const { data: session } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/projects");
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
      } else {
        toast.error("Error al cargar los proyectos");
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast.error("Error al cargar los proyectos");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Proyecto eliminado exitosamente");
        fetchProjects();
        setIsDeleteDialogOpen(false);
        setSelectedProject(null);
      } else {
        const error = await response.json();
        toast.error(error.message || "Error al eliminar el proyecto");
      }
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error("Error al eliminar el proyecto");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-blue-100 text-blue-800";
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "PAUSED":
        return "bg-yellow-100 text-yellow-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "bg-red-100 text-red-800";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800";
      case "LOW":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "Activo";
      case "COMPLETED":
        return "Completado";
      case "PAUSED":
        return "En Pausa";
      case "CANCELLED":
        return "Cancelado";
      default:
        return status;
    }
  };

  const getBillingMethodLabel = (method: string) => {
    switch (method) {
      case "PER_DOCUMENT":
        return "Por Documento";
      case "PER_HOUR":
        return "Por Hora";
      default:
        return method;
    }
  };

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const calculateProgress = (project: Project) => {
    return Math.round(project.progress || 0);
  };

  const calculateTaskProgress = (project: Project) => {
    if (project._count.taskRecords === 0) return 0;
    return Math.round((project.completedTasks / project._count.taskRecords) * 100);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Cargando proyectos...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Proyectos</h1>
            <p className="text-gray-600 mt-1">
              Gestiona y supervisa todos los proyectos de digitalización
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Link href="/projects/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Proyecto
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar proyectos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="ACTIVE">Activo</SelectItem>
                  <SelectItem value="COMPLETED">Completado</SelectItem>
                  <SelectItem value="PAUSED">En Pausa</SelectItem>
                  <SelectItem value="CANCELLED">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Projects Grid */}
        {filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <Card
                key={project.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-muted-foreground mb-1">
                        {project.clientName}
                      </div>
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      <CardDescription className="mt-1 line-clamp-2">
                        {getBillingMethodLabel(project.billingMethod)}
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
                          <Link href={`/projects/${project.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver detalles
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/projects/${project.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => {
                            setSelectedProject(project);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <Badge className={getStatusColor(project.status)}>
                      {getStatusLabel(project.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Páginas procesadas</span>
                      <span>
                        {project.totalPages} / {project.estimatedDocuments || 0}
                      </span>
                    </div>
                    <Progress
                      value={calculateProgress(project)}
                      className="h-2"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Tareas completadas</span>
                      <span>
                        {project.completedTasks} / {project._count.taskRecords}
                      </span>
                    </div>
                    <Progress
                      value={calculateTaskProgress(project)}
                      className="h-2"
                    />
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <FileText className="mr-1 h-3 w-3" />
                      {project._count.taskRecords} tareas
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Users className="mr-1 h-3 w-3" />
                      {project.totalPages} páginas
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                    <div className="flex items-center">
                      <Calendar className="mr-1 h-3 w-3" />
                      Creado: {new Date(project.createdAt).toLocaleDateString()}
                    </div>
                    {project.deadline && (
                      <div className="flex items-center">
                        <Clock className="mr-1 h-3 w-3" />
                        Límite: {new Date(project.deadline).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No se encontraron proyectos
              </h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchTerm ||
                statusFilter !== "all"
                  ? "No hay proyectos que coincidan con los filtros aplicados."
                  : "Aún no tienes proyectos creados. Crea tu primer proyecto para comenzar."}
              </p>
              {!searchTerm &&
                statusFilter === "all" && (
                  <Link href="/projects/new">
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Crear primer proyecto
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
              <DialogTitle>¿Eliminar proyecto?</DialogTitle>
              <DialogDescription>
                Esta acción no se puede deshacer. Se eliminará permanentemente
                el proyecto "{selectedProject?.name}" y todos sus datos
                asociados.
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
                onClick={() =>
                  selectedProject && handleDeleteProject(selectedProject.id)
                }
              >
                Eliminar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default ProjectsPage;
