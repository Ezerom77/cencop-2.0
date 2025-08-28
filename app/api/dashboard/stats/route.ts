import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request })
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const userRole = token.role as Role
    const userId = token.sub

    // Filtros basados en el rol del usuario
    const projectFilter = userRole === Role.EMPLOYEE 
      ? { taskRecords: { some: { employeeId: userId } } }
      : {}

    const taskFilter = userRole === Role.EMPLOYEE 
      ? { employeeId: userId }
      : {}

    // Estadísticas básicas
    const [totalProjects, totalUsers, totalScanners, totalTasks] = await Promise.all([
      prisma.project.count({ where: projectFilter }),
      userRole === Role.ADMIN ? prisma.user.count() : 0,
      prisma.scanner.count(),
      prisma.taskRecord.count({ where: taskFilter })
    ])

    // Tareas por estado
    const tasksByStatus = await prisma.taskRecord.groupBy({
      by: ['status'],
      where: taskFilter,
      _count: {
        id: true
      }
    })

    // Documentos procesados hoy
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const documentsToday = await prisma.taskRecord.aggregate({
      where: {
        ...taskFilter,
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      },
      _sum: {
        documentsProcessed: true
      }
    })

    // Proyectos activos
    const activeProjects = await prisma.project.count({
      where: {
        ...projectFilter,
        status: 'ACTIVE'
      }
    })

    // Escáneres disponibles
    const availableScanners = await prisma.scanner.count({
      where: {
        status: 'AVAILABLE'
      }
    })

    return NextResponse.json({
      totalProjects,
      totalUsers,
      totalScanners,
      totalTasks,
      tasksByStatus: tasksByStatus.reduce((acc, item) => {
        acc[item.status] = item._count.id
        return acc
      }, {} as Record<string, number>),
      documentsToday: documentsToday._sum.documentsProcessed || 0,
      activeProjects,
      availableScanners
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}