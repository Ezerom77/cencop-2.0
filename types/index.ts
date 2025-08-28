import { User, Project, TaskRecord, Scanner, ScannerLog, Role, BillingMethod, ProjectStatus, Stage, TaskStatus, ScannerStatus } from '@prisma/client'

// Re-export Prisma types
export type {
  User,
  Project,
  TaskRecord,
  Scanner,
  ScannerLog,
  Role,
  BillingMethod,
  ProjectStatus,
  Stage,
  TaskStatus,
  ScannerStatus
}

// Extended types with relations
export interface UserWithRelations extends User {
  managedProjects?: Project[]
  taskRecords?: TaskRecord[]
}

export interface ProjectWithRelations extends Project {
  manager: User
  taskRecords?: TaskRecordWithRelations[]
  _count?: {
    taskRecords: number
  }
}

export interface TaskRecordWithRelations extends TaskRecord {
  project: Project
  employee: User
  scanner?: Scanner
  scannerLog?: ScannerLog
}

export interface ScannerWithRelations extends Scanner {
  taskRecords?: TaskRecord[]
  scannerLogs?: ScannerLog[]
  _count?: {
    taskRecords: number
  }
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Auth types
export interface LoginRequest {
  email: string
  password: string
}

export interface AuthUser {
  id: string
  email: string
  name: string
  role: Role
}

// Form types
export interface CreateProjectRequest {
  name: string
  clientName: string
  billingMethod: BillingMethod
  managerId: string
  estimatedDocuments?: number
  deadline?: string
}

export interface CreateTaskRequest {
  projectId: string
  employeeId: string
  scannerId?: string
  stage: Stage
  startTime: string
}

export interface UpdateTaskRequest {
  endTime?: string
  documentsProcessed?: number
  hoursWorked?: number
  status?: TaskStatus
}

export interface CreateScannerLogRequest {
  taskRecordId: string
  scannerId: string
  startCounter: number
  endCounter: number
}

// Dashboard types
export interface DashboardMetrics {
  activeProjects: number
  totalEmployees: number
  availableScanners: number
  todayDocuments: number
  todayHours: number
  weeklyProductivity: {
    date: string
    documents: number
    hours: number
  }[]
}

// Report types
export interface ProductivityReport {
  employeeId: string
  employeeName: string
  totalDocuments: number
  totalHours: number
  averageDocumentsPerHour: number
  tasksByStage: {
    stage: Stage
    count: number
    documents: number
    hours: number
  }[]
}

export interface BillingReport {
  projectId: string
  projectName: string
  clientName: string
  billingMethod: BillingMethod
  totalDocuments: number
  totalHours: number
  estimatedCost: number
  progress: number
}

export interface ScannerReport {
  scannerId: string
  scannerName: string
  model: string
  totalDocuments: number
  utilizationHours: number
  averageDocumentsPerHour: number
  maintenanceStatus: ScannerStatus
}

// Filter types
export interface ProjectFilters {
  status?: ProjectStatus
  managerId?: string
  clientName?: string
  dateFrom?: string
  dateTo?: string
}

export interface TaskFilters {
  projectId?: string
  employeeId?: string
  scannerId?: string
  stage?: Stage
  status?: TaskStatus
  dateFrom?: string
  dateTo?: string
}

export interface ReportFilters {
  dateFrom: string
  dateTo: string
  projectId?: string
  employeeId?: string
  scannerId?: string
}