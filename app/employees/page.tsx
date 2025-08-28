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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  Mail,
  Phone,
  Calendar,
  MapPin,
  Briefcase,
  Clock,
  CheckCircle,
  UserCheck,
  UserX,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import Layout from "@/components/layout/Layout";
import Link from "next/link";

interface Employee {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "EMPLOYEE";
  department: string;
  position: string;
  phone?: string;
  address?: string;
  isActive: boolean;
  hireDate: string;
  lastLogin?: string;
  avatar?: string;
  stats: {
    totalTasks: number;
    completedTasks: number;
    totalPages: number;
    hoursWorked: number;
  };
  createdAt: string;
  updatedAt: string;
}

const EmployeesPage = () => {
  const { data: session } = useSession();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/users");
      if (response.ok) {
        const data = await response.json();
        setEmployees(data.users || []);
      } else {
        toast.error("Error al cargar los empleados");
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
      toast.error("Error al cargar los empleados");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    try {
      const response = await fetch(`/api/users/${employeeId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Empleado eliminado exitosamente");
        fetchEmployees();
        setIsDeleteDialogOpen(false);
        setSelectedEmployee(null);
      } else {
        const error = await response.json();
        toast.error(error.message || "Error al eliminar el empleado");
      }
    } catch (error) {
      console.error("Error deleting employee:", error);
      toast.error("Error al eliminar el empleado");
    }
  };

  const handleToggleStatus = async (employeeId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/users/${employeeId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (response.ok) {
        toast.success(
          `Empleado ${!isActive ? "activado" : "desactivado"} exitosamente`
        );
        fetchEmployees();
      } else {
        const error = await response.json();
        toast.error(
          error.message || "Error al actualizar el estado del empleado"
        );
      }
    } catch (error) {
      console.error("Error updating employee status:", error);
      toast.error("Error al actualizar el estado del empleado");
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-100 text-red-800";
      case "MANAGER":
        return "bg-blue-100 text-blue-800";
      case "EMPLOYEE":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "Administrador";
      case "MANAGER":
        return "Gerente";
      case "EMPLOYEE":
        return "Empleado";
      default:
        return role;
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive
      ? "bg-green-100 text-green-800"
      : "bg-gray-100 text-gray-800";
  };

  const getStatusLabel = (isActive: boolean) => {
    return isActive ? "Activo" : "Inactivo";
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || employee.role === roleFilter;
    const matchesDepartment =
      departmentFilter === "all" || employee.department === departmentFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && employee.isActive) ||
      (statusFilter === "inactive" && !employee.isActive);

    return matchesSearch && matchesRole && matchesDepartment && matchesStatus;
  });

  const uniqueDepartments = Array.from(
    new Set(
      employees
        .map((emp) => emp.department)
        .filter((department) => department && department.trim() !== "")
    )
  );

  const calculateEfficiency = (employee: Employee) => {
    if (!employee.stats || employee.stats.totalTasks === 0) return 0;
    return Math.round(
      (employee.stats.completedTasks / employee.stats.totalTasks) * 100
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Cargando empleados...</div>
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
            <h1 className="text-3xl font-bold text-gray-900">Empleados</h1>
            <p className="text-gray-600 mt-1">
              Gestiona el equipo de trabajo y sus permisos
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex gap-2">
            <Button
              variant={viewMode === "table" ? "default" : "outline"}
              onClick={() => setViewMode("table")}
            >
              Tabla
            </Button>
            <Button
              variant={viewMode === "cards" ? "default" : "outline"}
              onClick={() => setViewMode("cards")}
            >
              Tarjetas
            </Button>
            <Link href="/employees/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Empleado
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Empleados
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{employees.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Empleados Activos
              </CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {employees.filter((emp) => emp.isActive).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Administradores
              </CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {employees.filter((emp) => emp.role === "ADMIN").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Departamentos
              </CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {uniqueDepartments.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar empleados..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los roles</SelectItem>
                  <SelectItem value="ADMIN">Administrador</SelectItem>
                  <SelectItem value="MANAGER">Gerente</SelectItem>
                  <SelectItem value="EMPLOYEE">Empleado</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={departmentFilter}
                onValueChange={setDepartmentFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Departamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los departamentos</SelectItem>
                  {uniqueDepartments.map((department) => (
                    <SelectItem key={department} value={department}>
                      {department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="active">Activos</SelectItem>
                  <SelectItem value="inactive">Inactivos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Employees Content */}
        {filteredEmployees.length > 0 ? (
          viewMode === "table" ? (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empleado</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Departamento</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Estadísticas</TableHead>
                      <TableHead>Último acceso</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmployees.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar>
                              <AvatarImage src={employee.avatar} />
                              <AvatarFallback>
                                {getInitials(employee.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{employee.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {employee.email}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {employee.position}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getRoleColor(employee.role)}>
                            {getRoleLabel(employee.role)}
                          </Badge>
                        </TableCell>
                        <TableCell>{employee.department}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(employee.isActive)}>
                            {employee.isActive ? (
                              <UserCheck className="mr-1 h-3 w-3" />
                            ) : (
                              <UserX className="mr-1 h-3 w-3" />
                            )}
                            {getStatusLabel(employee.isActive)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm">
                              <span className="font-medium">
                                {employee.stats?.completedTasks || 0}
                              </span>
                              <span className="text-muted-foreground">
                                {" "}
                                / {employee.stats?.totalTasks || 0} tareas
                              </span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {employee.stats?.totalPages || 0} páginas
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Eficiencia: {calculateEfficiency(employee)}%
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {employee.lastLogin ? (
                              <div className="flex items-center">
                                <Clock className="mr-1 h-3 w-3" />
                                {new Date(
                                  employee.lastLogin
                                ).toLocaleDateString()}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">
                                Nunca
                              </span>
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
                                <Link href={`/employees/${employee.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Ver perfil
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/employees/${employee.id}/edit`}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Editar
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() =>
                                  handleToggleStatus(
                                    employee.id,
                                    employee.isActive
                                  )
                                }
                              >
                                {employee.isActive ? (
                                  <>
                                    <UserX className="mr-2 h-4 w-4" />
                                    Desactivar
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="mr-2 h-4 w-4" />
                                    Activar
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => {
                                  setSelectedEmployee(employee);
                                  setIsDeleteDialogOpen(true);
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
              {filteredEmployees.map((employee) => (
                <Card
                  key={employee.id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={employee.avatar} />
                          <AvatarFallback>
                            {getInitials(employee.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">
                            {employee.name}
                          </CardTitle>
                          <CardDescription>{employee.position}</CardDescription>
                        </div>
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
                            <Link href={`/employees/${employee.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver perfil
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/employees/${employee.id}/edit`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => {
                              setSelectedEmployee(employee);
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
                      <Badge className={getRoleColor(employee.role)}>
                        {getRoleLabel(employee.role)}
                      </Badge>
                      <Badge className={getStatusColor(employee.isActive)}>
                        {employee.isActive ? (
                          <UserCheck className="mr-1 h-3 w-3" />
                        ) : (
                          <UserX className="mr-1 h-3 w-3" />
                        )}
                        {getStatusLabel(employee.isActive)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Contact Info */}
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Mail className="mr-2 h-3 w-3" />
                        {employee.email}
                      </div>
                      {employee.phone && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Phone className="mr-2 h-3 w-3" />
                          {employee.phone}
                        </div>
                      )}
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="mr-2 h-3 w-3" />
                        {employee.department}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="space-y-2 pt-2 border-t">
                      <div className="flex justify-between text-sm">
                        <span>Tareas completadas:</span>
                        <span className="font-medium">
                          {employee.stats?.completedTasks || 0} /{" "}
                          {employee.stats?.totalTasks || 0}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Páginas procesadas:</span>
                        <span className="font-medium">
                          {employee.stats?.totalPages || 0}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Eficiencia:</span>
                        <span className="font-medium">
                          {calculateEfficiency(employee)}%
                        </span>
                      </div>
                    </div>

                    {/* Hire Date */}
                    <div className="pt-2 border-t">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="mr-2 h-3 w-3" />
                        Contratado:{" "}
                        {new Date(employee.hireDate).toLocaleDateString()}
                      </div>
                      {employee.lastLogin && (
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                          <Clock className="mr-2 h-3 w-3" />
                          Último acceso:{" "}
                          {new Date(employee.lastLogin).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No se encontraron empleados
              </h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchTerm ||
                roleFilter !== "all" ||
                departmentFilter !== "all" ||
                statusFilter !== "all"
                  ? "No hay empleados que coincidan con los filtros aplicados."
                  : "Aún no tienes empleados registrados. Agrega tu primer empleado para comenzar."}
              </p>
              {!searchTerm &&
                roleFilter === "all" &&
                departmentFilter === "all" &&
                statusFilter === "all" && (
                  <Link href="/employees/new">
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Agregar primer empleado
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
              <DialogTitle>¿Eliminar empleado?</DialogTitle>
              <DialogDescription>
                Esta acción no se puede deshacer. Se eliminará permanentemente
                el empleado "{selectedEmployee?.name}" y todos sus datos
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
                  selectedEmployee && handleDeleteEmployee(selectedEmployee.id)
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

export default EmployeesPage;
