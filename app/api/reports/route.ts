import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'
import { Role, Stage, TaskStatus } from '@prisma/client'
import { ReportFilters } from '@/types/api'

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request })
    if (!token) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const projectId = searchParams.get('projectId')
    const userId = searchParams.get('userId')
    const stage = searchParams.get('stage')
    const status = searchParams.get('status')

    // Validar fechas
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const end = endDate ? new Date(endDate) : new Date()
    
    if (start > end) {
      return NextResponse.json({ message: 'La fecha de inicio debe ser anterior a la fecha de fin' }, { status: 400 })
    }

    // Construir filtros base
    const baseFilters: ReportFilters = {
      createdAt: {
        gte: start,
        lte: end
      }
    }

    // Filtros adicionales
    if (projectId) baseFilters.projectId = projectId
    if (stage) baseFilters.stage = stage as Stage
    if (status) baseFilters.status = status as TaskStatus
    
    // Si es empleado, solo puede ver sus propias tareas
    if (token.role === Role.EMPLOYEE) {
      baseFilters.employeeId = token.sub
    } else if (userId) {
      baseFilters.employeeId = userId
    }

    // 1. Productividad diaria
    const dailyProductivity = await getDailyProductivity(start, end, baseFilters)

    // 2. Tareas por etapa
    const tasksByStage = await getTasksByStage(baseFilters)

    // 3. Tareas por estado
    const tasksByStatus = await getTasksByStatus(baseFilters)

    // 4. Productividad por usuario
    const userProductivity = await getUserProductivity(start, end, baseFilters, token.role as string)

    // 5. Progreso de proyectos
    const projectProgress = await getProjectProgress(baseFilters, token.role as string)

    // 6. Uso de escáneres
    const scannerUsage = await getScannerUsage(start, end, baseFilters)

    // 7. Tendencias mensuales
    const monthlyTrends = await getMonthlyTrends(start, end, baseFilters)

    const reportData = {
      dailyProductivity,
      tasksByStage,
      tasksByStatus,
      userProductivity,
      projectProgress,
      scannerUsage,
      monthlyTrends
    }

    return NextResponse.json(reportData)
  } catch (error) {
    console.error('Error al generar reporte:', error)
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 })
  }
}

// Función para obtener productividad diaria
async function getDailyProductivity(start: Date, end: Date, filters: ReportFilters) {
  const tasks = await prisma.taskRecord.findMany({
    where: {
      ...filters,
      status: 'COMPLETED'
    },
    select: {
      createdAt: true,
      documentsProcessed: true,
      startTime: true,
      endTime: true
    }
  })

  // Agrupar por día
  const dailyData: { [key: string]: { tasks: number; pages: number; hours: number } } = {}
  
  // Inicializar todos los días en el rango
  const currentDate = new Date(start)
  while (currentDate <= end) {
    const dateKey = currentDate.toISOString().split('T')[0]
    dailyData[dateKey] = { tasks: 0, pages: 0, hours: 0 }
    currentDate.setDate(currentDate.getDate() + 1)
  }

  // Procesar tareas
  tasks.forEach(task => {
    const dateKey = task.createdAt.toISOString().split('T')[0]
    if (dailyData[dateKey]) {
      dailyData[dateKey].tasks += 1
      dailyData[dateKey].pages += task.documentsProcessed || 0
      
      if (task.startTime && task.endTime) {
        const hours = (task.endTime.getTime() - task.startTime.getTime()) / (1000 * 60 * 60)
        dailyData[dateKey].hours += hours
      }
    }
  })

  return Object.entries(dailyData)
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

// Función para obtener tareas por etapa
async function getTasksByStage(filters: ReportFilters) {
  const stages = ['RECEPTION', 'PREPARATION', 'SCANNING', 'INDEXING', 'QUALITY_CONTROL', 'REASSEMBLY', 'DELIVERY']
  
  const stageCounts = await Promise.all(
    stages.map(async (stage) => {
      const count = await prisma.taskRecord.count({
        where: { ...filters, stage: stage as Stage }
      })
      return { stage, count }
    })
  )

  const totalTasks = stageCounts.reduce((sum, item) => sum + item.count, 0)
  
  return stageCounts.map(item => ({
    ...item,
    percentage: totalTasks > 0 ? (item.count / totalTasks) * 100 : 0
  }))
}

// Función para obtener tareas por estado
async function getTasksByStatus(filters: ReportFilters) {
  const statuses = ['IN_PROGRESS', 'COMPLETED', 'PAUSED']
  
  const statusCounts = await Promise.all(
    statuses.map(async (status) => {
      const count = await prisma.taskRecord.count({
        where: { ...filters, status: status as TaskStatus }
      })
      return { status, count }
    })
  )

  const totalTasks = statusCounts.reduce((sum, item) => sum + item.count, 0)
  
  return statusCounts.map(item => ({
    ...item,
    percentage: totalTasks > 0 ? (item.count / totalTasks) * 100 : 0
  }))
}

// Función para obtener productividad por usuario
async function getUserProductivity(start: Date, end: Date, filters: ReportFilters, userRole: string) {
  // Si es empleado, solo mostrar sus propios datos
  const userFilter = userRole === Role.EMPLOYEE ? { id: filters.employeeId } : {}
  
  const users = await prisma.user.findMany({
    where: {
      ...userFilter,
      role: userRole === Role.EMPLOYEE ? Role.EMPLOYEE : undefined
    },
    select: {
      id: true,
      name: true,
      taskRecords: {
        where: {
          createdAt: {
            gte: start,
            lte: end
          },
          status: TaskStatus.COMPLETED
        },
        select: {
          documentsProcessed: true,
          startTime: true,
          endTime: true
        }
      }
    }
  })

  return users.map(user => {
    const totalTasks = user.taskRecords.length
    const totalPages = user.taskRecords.reduce((sum, task) => sum + (task.documentsProcessed || 0), 0)
    
    let totalHours = 0
    user.taskRecords.forEach(task => {
      if (task.startTime && task.endTime) {
        totalHours += (task.endTime.getTime() - task.startTime.getTime()) / (1000 * 60 * 60)
      }
    })
    
    const avgPagesPerHour = totalHours > 0 ? totalPages / totalHours : 0

    return {
      userId: user.id,
      userName: user.name,
      totalTasks,
      totalPages,
      totalHours,
      avgPagesPerHour
    }
  }).filter(user => user.totalTasks > 0)
}

// Función para obtener progreso de proyectos
async function getProjectProgress(filters: ReportFilters, userRole: string) {
  const projectFilter: { id?: string } = {}
  
  // Si hay filtro de proyecto específico
  if (filters.projectId) {
    projectFilter.id = filters.projectId
  }

  const projects = await prisma.project.findMany({
    where: projectFilter,
    select: {
      id: true,
      name: true,
      clientName: true,
      taskRecords: {
        where: userRole === Role.EMPLOYEE ? { employeeId: filters.userId } : {},
        select: {
          status: true,
          documentsProcessed: true,
          startTime: true,
          endTime: true
        }
      }
    }
  })

  return projects.map(project => {
    const totalTasks = project.taskRecords.length
    const completedTasks = project.taskRecords.filter(task => task.status === TaskStatus.COMPLETED).length
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
    const totalPages = project.taskRecords.reduce((sum, task) => sum + (task.documentsProcessed || 0), 0)
    
    let actualHours = 0
    project.taskRecords.forEach(task => {
      if (task.startTime && task.endTime) {
        actualHours += (task.endTime.getTime() - task.startTime.getTime()) / (1000 * 60 * 60)
      }
    })

    return {
      projectId: project.id,
      projectName: project.name,
      clientName: project.clientName,
      totalTasks,
      completedTasks,
      progress,
      totalPages,
      estimatedHours: 0,
      actualHours
    }
  }).filter(project => project.totalTasks > 0)
}

// Función para obtener uso de escáneres
async function getScannerUsage(start: Date, end: Date, filters: ReportFilters) {
  const scanners = await prisma.scanner.findMany({
    select: {
      id: true,
      name: true,
      taskRecords: {
        where: {
          createdAt: {
            gte: start,
            lte: end
          },
          status: TaskStatus.COMPLETED
        },
        select: {
          documentsProcessed: true,
          startTime: true,
          endTime: true
        }
      }
    }
  })

  const totalHoursInPeriod = (end.getTime() - start.getTime()) / (1000 * 60 * 60)

  return scanners.map(scanner => {
    const totalTasks = scanner.taskRecords.length
    const totalPages = scanner.taskRecords.reduce((sum, task) => sum + (task.documentsProcessed || 0), 0)
    
    let totalHours = 0
    scanner.taskRecords.forEach(task => {
      if (task.startTime && task.endTime) {
        totalHours += (task.endTime.getTime() - task.startTime.getTime()) / (1000 * 60 * 60)
      }
    })
    
    const utilizationRate = totalHoursInPeriod > 0 ? (totalHours / totalHoursInPeriod) * 100 : 0

    return {
      scannerId: scanner.id,
      scannerName: scanner.name,
      totalTasks,
      totalPages,
      totalHours,
      utilizationRate
    }
  }).filter(scanner => scanner.totalTasks > 0)
}

// Función para obtener tendencias mensuales
async function getMonthlyTrends(start: Date, end: Date, filters: ReportFilters) {
  // Obtener datos de los últimos 12 meses
  const monthsBack = 12
  const trends = []
  
  for (let i = monthsBack - 1; i >= 0; i--) {
    const monthStart = new Date()
    monthStart.setMonth(monthStart.getMonth() - i)
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)
    
    const monthEnd = new Date(monthStart)
    monthEnd.setMonth(monthEnd.getMonth() + 1)
    monthEnd.setDate(0)
    monthEnd.setHours(23, 59, 59, 999)
    
    const monthName = monthStart.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })
    
    // Proyectos creados en el mes
    const projects = await prisma.project.count({
      where: {
        createdAt: {
          gte: monthStart,
          lte: monthEnd
        }
      }
    })
    
    // Tareas completadas en el mes
    const tasks = await prisma.taskRecord.count({
      where: {
        createdAt: {
          gte: monthStart,
          lte: monthEnd
        },
        status: 'COMPLETED'
      }
    })
    
    // Páginas procesadas en el mes
    const pagesResult = await prisma.taskRecord.aggregate({
      where: {
        createdAt: {
          gte: monthStart,
          lte: monthEnd
        },
        status: 'COMPLETED'
      },
      _sum: {
        documentsProcessed: true
      }
    })
    
    // Horas trabajadas en el mes
    const completedTasks = await prisma.taskRecord.findMany({
      where: {
        createdAt: {
          gte: monthStart,
          lte: monthEnd
        },
        status: 'COMPLETED'
      },
      select: {
        startTime: true,
        endTime: true
      }
    })
    
    let hours = 0
    completedTasks.forEach(task => {
      if (task.startTime && task.endTime) {
        hours += (task.endTime.getTime() - task.startTime.getTime()) / (1000 * 60 * 60)
      }
    })
    
    trends.push({
      month: monthName,
      projects,
      tasks,
      pages: pagesResult._sum.documentsProcessed || 0,
      hours
    })
  }
  
  return trends
}