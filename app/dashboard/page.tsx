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
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import {
  FolderOpen,
  CheckSquare,
  Users,
  FileText,
  Clock,
  TrendingUp,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import Layout from "@/components/layout/Layout";

interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalTasks: number;
  pendingTasks: number;
  completedTasks: number;
  totalUsers: number;
  activeUsers: number;
  totalPages: number;
  pagesThisMonth: number;
}

interface ProjectProgress {
  id: string;
  name: string;
  progress: number;
  status: string;
  dueDate: string;
}

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  timestamp: string;
}

const DashboardPage = () => {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [projects, setProjects] = useState<ProjectProgress[]>([]);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch dashboard statistics
      const statsResponse = await fetch("/api/dashboard/stats");
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Fetch project progress
      const projectsResponse = await fetch("/api/dashboard/projects");
      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json();
        setProjects(projectsData);
      }

      // Fetch recent activities
      const activitiesResponse = await fetch("/api/dashboard/activities");
      if (activitiesResponse.ok) {
        const activitiesData = await activitiesResponse.json();
        setActivities(activitiesData);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Error al cargar los datos del dashboard");
    } finally {
      setLoading(false);
    }
  };

  const chartData = [
    { name: "Ene", pages: 1200 },
    { name: "Feb", pages: 1900 },
    { name: "Mar", pages: 1500 },
    { name: "Abr", pages: 2200 },
    { name: "May", pages: 1800 },
    { name: "Jun", pages: 2500 },
  ];

  const pieData = [
    {
      name: "Completadas",
      value: stats?.completedTasks || 0,
      color: "#10b981",
    },
    {
      name: "En Progreso",
      value:
        (stats?.totalTasks || 0) -
        (stats?.completedTasks || 0) -
        (stats?.pendingTasks || 0),
      color: "#f59e0b",
    },
    { name: "Pendientes", value: stats?.pendingTasks || 0, color: "#ef4444" },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Buenos días";
    if (hour < 18) return "Buenas tardes";
    return "Buenas noches";
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
      case "completado":
        return "bg-green-100 text-green-800";
      case "in_progress":
      case "en_progreso":
        return "bg-blue-100 text-blue-800";
      case "pending":
      case "pendiente":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Cargando dashboard...</div>
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
            <h1 className="text-3xl font-bold text-gray-900">
              {getGreeting()}, {session?.user?.name}
            </h1>
            <p className="text-gray-600 mt-1">
              Aquí tienes un resumen de la actividad del sistema
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Button onClick={fetchDashboardData}>Actualizar datos</Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Proyectos Activos
              </CardTitle>
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.activeProjects || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                de {stats?.totalProjects || 0} proyectos totales
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Tareas Pendientes
              </CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.pendingTasks || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                de {stats?.totalTasks || 0} tareas totales
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Usuarios Activos
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.activeUsers || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                de {stats?.totalUsers || 0} usuarios registrados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Páginas Este Mes
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.pagesThisMonth || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                +12% vs mes anterior
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Progress */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pages Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Páginas Procesadas</CardTitle>
              <CardDescription>Últimos 6 meses</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="pages" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Tasks Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Distribución de Tareas</CardTitle>
              <CardDescription>Estado actual de las tareas</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center space-x-4 mt-4">
                {pieData.map((entry, index) => (
                  <div key={index} className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-sm">
                      {entry.name}: {entry.value}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Projects Progress and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Project Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Progreso de Proyectos</CardTitle>
              <CardDescription>
                Estado actual de los proyectos activos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {projects.length > 0 ? (
                projects.slice(0, 5).map((project) => (
                  <div key={project.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{project.name}</span>
                      <Badge className={getStatusColor(project.status)}>
                        {project.status}
                      </Badge>
                    </div>
                    <Progress value={project.progress} className="h-2" />
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>{project.progress}% completado</span>
                      <span className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {project.dueDate && !isNaN(new Date(project.dueDate).getTime()) 
                          ? new Date(project.dueDate).toLocaleDateString()
                          : 'Fecha no definida'
                        }
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-600">
                  No hay proyectos activos
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Actividad Reciente</CardTitle>
              <CardDescription>Últimas acciones en el sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.length > 0 ? (
                  activities.slice(0, 5).map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start space-x-3"
                    >
                      <div className="flex-shrink-0">
                        {activity.type === "task" && (
                          <CheckSquare className="h-4 w-4 text-blue-500" />
                        )}
                        {activity.type === "project" && (
                          <FolderOpen className="h-4 w-4 text-green-500" />
                        )}
                        {activity.type === "user" && (
                          <Users className="h-4 w-4 text-purple-500" />
                        )}
                        {activity.type === "alert" && (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.description}
                        </p>
                        <p className="text-sm text-gray-700">
                          por {activity.user.name} •{" "}
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600">
                    No hay actividad reciente
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default DashboardPage;
