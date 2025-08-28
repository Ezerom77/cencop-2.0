import { Role, BillingMethod, ProjectStatus, Stage, TaskStatus, ScannerStatus } from '@prisma/client';

// Base filter types
export interface BaseFilters {
  startDate?: string;
  endDate?: string;
  projectId?: string;
  employeeId?: string;
  stage?: Stage;
  status?: TaskStatus | ProjectStatus | ScannerStatus;
}

// Task-related types
export interface TaskFilters {
  projectId?: string;
  employeeId?: string;
  scannerId?: string;
  status?: TaskStatus;
  stage?: Stage;
  createdAt?: {
    gte?: Date;
    lte?: Date;
  };
}

export interface TaskCreateData {
  projectId: string;
  employeeId: string;
  scannerId: string;
  stage: Stage;
  startTime: Date;
  endTime?: Date;
  documentsProcessed?: number;
  hoursWorked?: number;
  status: TaskStatus;
}

export interface TaskUpdateData {
  projectId?: string;
  employeeId?: string;
  scannerId?: string;
  stage?: Stage;
  startTime?: Date;
  endTime?: Date;
  documentsProcessed?: number;
  hoursWorked?: number;
  status?: TaskStatus;
}

// Project-related types
export interface ProjectFilters {
  status?: ProjectStatus;
  managerId?: string;
  billingMethod?: BillingMethod;
  clientName?: string | { contains: string; mode: 'insensitive' };
  name?: string | { contains: string; mode: 'insensitive' };
  taskRecords?: {
    some: {
      employeeId: string;
    };
  };
  OR?: Array<{
    name?: { contains: string; mode: 'insensitive' };
    clientName?: { contains: string; mode: 'insensitive' };
  }>;
  userId?: string;
  role?: Role;
  createdAt?: {
    gte?: Date;
    lte?: Date;
  };
}

export interface ProjectCreateData {
  name: string;
  clientName: string;
  billingMethod: BillingMethod;
  managerId: string;
  estimatedDocuments?: number;
  deadline?: Date;
  status?: ProjectStatus;
}

export interface ProjectUpdateData {
  name?: string;
  clientName?: string;
  billingMethod?: BillingMethod;
  managerId?: string;
  estimatedDocuments?: number;
  deadline?: Date;
  status?: ProjectStatus;
}

// User-related types
export interface UserFilters {
  role?: Role;
  email?: string;
  name?: string;
  OR?: Array<{
    name?: { contains: string; mode: 'insensitive' };
    email?: { contains: string; mode: 'insensitive' };
  }>;
}

export interface UserCreateData {
  email: string;
  passwordHash: string;
  name: string;
  role?: Role;
}

export interface UserUpdateData {
  email?: string;
  passwordHash?: string;
  name?: string;
  role?: Role;
  password?: string;
}

// Scanner-related types
export interface ScannerFilters {
  status?: ScannerStatus;
  model?: string | { contains: string; mode: 'insensitive' };
  name?: string | { contains: string; mode: 'insensitive' };
  location?: string | { contains: string; mode: 'insensitive' };
  OR?: Array<{
    name?: { contains: string; mode: 'insensitive' };
    model?: { contains: string; mode: 'insensitive' };
    location?: { contains: string; mode: 'insensitive' };
  }>;
}

export interface ScannerCreateData {
  name: string;
  model?: string;
  currentCounter?: number;
  status?: ScannerStatus;
  lastMaintenance?: Date;
}

export interface ScannerUpdateData {
  name?: string;
  model?: string;
  currentCounter?: number;
  status?: ScannerStatus;
  lastMaintenance?: Date;
}

// Report-related types
export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  projectId?: string;
  employeeId?: string;
  stage?: Stage;
  status?: TaskStatus;
  userId?: string;
  role?: Role;
  createdAt?: {
    gte?: Date;
    lte?: Date;
  };
}

export interface DailyProductivityData {
  date: string;
  totalHours: number;
  totalDocuments: number;
  tasksCompleted: number;
}

export interface TasksByStageData {
  stage: Stage;
  count: number;
  percentage: number;
}

export interface TasksByStatusData {
  status: TaskStatus;
  count: number;
  percentage: number;
}

export interface UserProductivityData {
  userId: string;
  userName: string;
  totalHours: number;
  totalDocuments: number;
  tasksCompleted: number;
  averageHoursPerTask: number;
}

export interface ProjectProgressData {
  projectId: string;
  projectName: string;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  completionPercentage: number;
  stageStats: Record<Stage, number>;
}

export interface ScannerUsageData {
  scannerId: string;
  scannerName: string;
  totalUsageHours: number;
  documentsScanned: number;
  utilizationPercentage: number;
}

export interface MonthlyTrendsData {
  month: string;
  totalHours: number;
  totalDocuments: number;
  tasksCompleted: number;
  averageProductivity: number;
}

// Dashboard metrics types
export interface DashboardMetrics {
  totalProjects: number;
  activeProjects: number;
  totalEmployees: number;
  totalScanners: number;
  availableScanners: number;
  totalTasksToday: number;
  completedTasksToday: number;
  totalHoursToday: number;
  totalDocumentsToday: number;
}

export interface TopUser {
  id: string;
  name: string;
  totalHours: number;
  totalDocuments: number;
  tasksCompleted: number;
}

export interface StageStats {
  [key: string]: {
    count: number;
    pages: number;
    hours: number;
  };
}

// Update data types
export interface ProjectUpdateData {
  name?: string
  clientName?: string
  estimatedDocuments?: number
  billingMethod?: BillingMethod
  deadline?: Date
  status?: ProjectStatus
}

export interface TaskUpdateData {
  documentsProcessed?: number
  stage?: Stage
  status?: TaskStatus
  startTime?: Date
  endTime?: Date
  scannerId?: string
  notes?: string
  qualityScore?: number
}

export interface UserUpdateData {
  name?: string
  email?: string
  role?: Role
}

export interface ScannerUpdateData {
  name?: string
  model?: string
  status?: ScannerStatus
  location?: string
  currentCounter?: number
}

export interface UserBasicInfo {
  id: string;
  name: string;
  email: string;
}



export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

// API Response types
export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}