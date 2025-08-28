import { z } from 'zod'
import { Role, BillingMethod, Stage, TaskStatus, ProjectStatus, ScannerStatus } from '@prisma/client'

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres')
})

export const registerSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  role: z.nativeEnum(Role)
})

// User schemas
export const updateUserSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
  email: z.string().email('Email inválido').optional(),
  role: z.nativeEnum(Role).optional(),
  isActive: z.boolean().optional()
})

// Project schemas
export const createProjectSchema = z.object({
  name: z.string().min(2, 'El nombre del proyecto debe tener al menos 2 caracteres'),
  clientName: z.string().min(2, 'El nombre del cliente debe tener al menos 2 caracteres'),
  billingMethod: z.nativeEnum(BillingMethod),
  managerId: z.string().uuid('ID de manager inválido'),
  estimatedDocuments: z.number().int().positive('Debe ser un número positivo').optional(),
  deadline: z.string().datetime('Fecha inválida').optional(),
  description: z.string().optional()
})

export const updateProjectSchema = z.object({
  name: z.string().min(2, 'El nombre del proyecto debe tener al menos 2 caracteres').optional(),
  clientName: z.string().min(2, 'El nombre del cliente debe tener al menos 2 caracteres').optional(),
  billingMethod: z.nativeEnum(BillingMethod).optional(),
  managerId: z.string().uuid('ID de manager inválido').optional(),
  estimatedDocuments: z.number().int().positive('Debe ser un número positivo').optional(),
  deadline: z.string().datetime('Fecha inválida').optional(),
  description: z.string().optional(),
  status: z.nativeEnum(ProjectStatus).optional()
})

// Task schemas
export const createTaskSchema = z.object({
  projectId: z.string().uuid('ID de proyecto inválido'),
  employeeId: z.string().uuid('ID de empleado inválido'),
  scannerId: z.string().uuid('ID de escáner inválido').optional(),
  stage: z.nativeEnum(Stage),
  startTime: z.string().datetime('Fecha de inicio inválida')
})

export const updateTaskSchema = z.object({
  endTime: z.string().datetime('Fecha de fin inválida').optional(),
  documentsProcessed: z.number().int().min(0, 'Debe ser un número no negativo').optional(),
  hoursWorked: z.number().min(0, 'Debe ser un número no negativo').optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  scannerId: z.string().uuid('ID de escáner inválido').optional()
})

// Scanner schemas
export const createScannerSchema = z.object({
  name: z.string().min(2, 'El nombre del escáner debe tener al menos 2 caracteres'),
  model: z.string().min(2, 'El modelo debe tener al menos 2 caracteres'),
  location: z.string().min(2, 'La ubicación debe tener al menos 2 caracteres'),
  status: z.nativeEnum(ScannerStatus).default('AVAILABLE')
})

export const updateScannerSchema = z.object({
  name: z.string().min(2, 'El nombre del escáner debe tener al menos 2 caracteres').optional(),
  model: z.string().min(2, 'El modelo debe tener al menos 2 caracteres').optional(),
  location: z.string().min(2, 'La ubicación debe tener al menos 2 caracteres').optional(),
  status: z.nativeEnum(ScannerStatus).optional()
})

// Scanner log schemas
export const createScannerLogSchema = z.object({
  taskRecordId: z.string().uuid('ID de tarea inválido'),
  scannerId: z.string().uuid('ID de escáner inválido'),
  startCounter: z.number().int().min(0, 'El contador inicial debe ser no negativo'),
  endCounter: z.number().int().min(0, 'El contador final debe ser no negativo')
}).refine(data => data.endCounter >= data.startCounter, {
  message: 'El contador final debe ser mayor o igual al inicial',
  path: ['endCounter']
})

// Filter schemas
export const projectFiltersSchema = z.object({
  status: z.nativeEnum(ProjectStatus).optional(),
  managerId: z.string().uuid().optional(),
  clientName: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional()
})

export const taskFiltersSchema = z.object({
  projectId: z.string().uuid().optional(),
  employeeId: z.string().uuid().optional(),
  scannerId: z.string().uuid().optional(),
  stage: z.nativeEnum(Stage).optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional()
})

export const reportFiltersSchema = z.object({
  dateFrom: z.string().datetime('Fecha de inicio requerida'),
  dateTo: z.string().datetime('Fecha de fin requerida'),
  projectId: z.string().uuid().optional(),
  employeeId: z.string().uuid().optional(),
  scannerId: z.string().uuid().optional()
}).refine(data => new Date(data.dateTo) >= new Date(data.dateFrom), {
  message: 'La fecha de fin debe ser posterior a la fecha de inicio',
  path: ['dateTo']
})

// Pagination schema
export const paginationSchema = z.object({
  page: z.number().int().min(1, 'La página debe ser mayor a 0').default(1),
  limit: z.number().int().min(1, 'El límite debe ser mayor a 0').max(100, 'El límite máximo es 100').default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
})

// Search schema
export const searchSchema = z.object({
  query: z.string().min(1, 'La consulta de búsqueda es requerida'),
  type: z.enum(['projects', 'tasks', 'users', 'scanners']).optional()
})

// Export types
export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>
export type CreateTaskInput = z.infer<typeof createTaskSchema>
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>
export type CreateScannerInput = z.infer<typeof createScannerSchema>
export type UpdateScannerInput = z.infer<typeof updateScannerSchema>
export type CreateScannerLogInput = z.infer<typeof createScannerLogSchema>
export type ProjectFiltersInput = z.infer<typeof projectFiltersSchema>
export type TaskFiltersInput = z.infer<typeof taskFiltersSchema>
export type ReportFiltersInput = z.infer<typeof reportFiltersSchema>
export type PaginationInput = z.infer<typeof paginationSchema>
export type SearchInput = z.infer<typeof searchSchema>