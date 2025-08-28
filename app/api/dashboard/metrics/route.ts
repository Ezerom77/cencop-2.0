import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Role, TaskStatus, ProjectStatus, ScannerStatus } from '@prisma/client'
import jwt from 'jsonwebtoken'
import { UserBasicInfo, JWTPayload } from '@/types/api'

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret-key'

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    let user: UserBasicInfo & { role: Role }
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload
      user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, name: true, role: true }
      }) as UserBasicInfo & { role: Role }
      
      if (!user) {
        return NextResponse.json(
          { error: 'Usuario no encontrado' },
          { status: 401 }
        )
      }
    } catch (jwtError) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30'
    const days = parseInt(period)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Filtros basados en el rol del usuario
    const userFilter = user.role === Role.EMPLOYEE ? { employeeId: user.id } : {}

    // Métricas generales
    const [totalProjects, totalUsers, totalScanners, totalTasks] = await Promise.all([
      prisma.project.count({
        where: user.role === Role.EMPLOYEE ? {
          taskRecords: {
            some: { employeeId: user.id }
          }
        } : {}
      }),
      user.role === Role.EMPLOYEE ? 1 : prisma.user.count(),
      prisma.scanner.count(),
      prisma.taskRecord.count({ where: userFilter })
    ])

    // Métricas de tareas por estado
    const tasksByStatus = await prisma.taskRecord.groupBy({
      by: ['status'],
      where: {
        ...userFilter,
        createdAt: {
          gte: startDate
        }
      },
      _count: {
        id: true
      }
    })

    // Métricas de tareas por etapa
    const tasksByStage = await prisma.taskRecord.groupBy({
      by: ['stage'],
      where: {
        ...userFilter,
        createdAt: {
          gte: startDate
        }
      },
      _count: {
        id: true
      },
      _sum: {
        documentsProcessed: true
      }
    })

    // Páginas procesadas en el período
    const pagesStats = await prisma.taskRecord.aggregate({
      where: {
        ...userFilter,
        createdAt: {
          gte: startDate
        },
        status: TaskStatus.COMPLETED
      },
      _sum: {
        documentsProcessed: true
      }
    })

    // Proyectos activos
    const activeProjects = await prisma.project.count({
      where: {
        status: ProjectStatus.ACTIVE,
        ...(user.role === Role.EMPLOYEE ? {
          taskRecords: {
            some: { employeeId: user.id }
          }
        } : {})
      }
    })

    // Escáneres disponibles
    const availableScanners = await prisma.scanner.count({
      where: {
        status: ScannerStatus.AVAILABLE
      }
    })

    // Productividad diaria (últimos 7 días)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      return date
    }).reverse()

    const dailyProductivity = await Promise.all(
      last7Days.map(async (date) => {
        const nextDay = new Date(date)
        nextDay.setDate(nextDay.getDate() + 1)

        const [tasks, pages] = await Promise.all([
          prisma.taskRecord.count({
            where: {
              ...userFilter,
              createdAt: {
                gte: date,
                lt: nextDay
              },
              status: TaskStatus.COMPLETED
            }
          }),
          prisma.taskRecord.aggregate({
            where: {
              ...userFilter,
              createdAt: {
                gte: date,
                lt: nextDay
              },
              status: TaskStatus.COMPLETED
            },
            _sum: {
              documentsProcessed: true
            }
          })
        ])

        return {
          date: date.toISOString().split('T')[0],
          tasks,
          pages: pages._sum.documentsProcessed || 0
        }
      })
    )

    // Top usuarios por productividad (solo para admin/manager)
    let topUsers: Array<{ user: UserBasicInfo | null; tasks: number; pages: number }> = []
    if (user.role !== Role.EMPLOYEE) {
      const userProductivity = await prisma.taskRecord.groupBy({
        by: ['employeeId'],
        where: {
          createdAt: {
            gte: startDate
          },
          status: TaskStatus.COMPLETED
        },
        _count: {
          id: true
        },
        _sum: {
          documentsProcessed: true
        },
        orderBy: {
            _sum: {
              documentsProcessed: 'desc'
            }
          },
        take: 5
      })

      topUsers = await Promise.all(
        userProductivity.map(async (stat) => {
          const userData = await prisma.user.findUnique({
            where: { id: stat.employeeId },
            select: { id: true, name: true, email: true }
          }) as UserBasicInfo | null
          return {
            user: userData,
            tasks: stat._count.id,
            pages: stat._sum.documentsProcessed || 0
          }
        })
      )
    }

    // Proyectos con mayor actividad
    const topProjects = await prisma.taskRecord.groupBy({
      by: ['projectId'],
      where: {
        ...userFilter,
        createdAt: {
          gte: startDate
        }
      },
      _count: {
        id: true
      },
      _sum: {
        documentsProcessed: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 5
    })

    const topProjectsWithDetails = await Promise.all(
      topProjects.map(async (stat) => {
        const project = await prisma.project.findUnique({
          where: { id: stat.projectId },
          select: { id: true, name: true, clientName: true, status: true }
        }) as { id: string; name: string; clientName: string; status: ProjectStatus } | null
        return {
          project,
          tasks: stat._count.id,
          pages: stat._sum.documentsProcessed || 0
        }
      })
    )

    // Tiempo promedio por tarea
    const allCompletedTasks = await prisma.taskRecord.findMany({
      where: {
        ...userFilter,
        createdAt: {
          gte: startDate
        },
        status: TaskStatus.COMPLETED
      },
      select: {
        startTime: true,
        endTime: true,
        documentsProcessed: true
      }
    })

    const completedTasksWithTime = allCompletedTasks.filter(task => task.startTime && task.endTime)

    const avgTimePerTask = completedTasksWithTime.length > 0 ? 
      completedTasksWithTime.reduce((total, task) => {
        if (task.startTime && task.endTime) {
          const hours = (new Date(task.endTime).getTime() - new Date(task.startTime).getTime()) / (1000 * 60 * 60)
          return total + hours
        }
        return total
      }, 0) / completedTasksWithTime.length : 0

    const avgPagesPerHour = completedTasksWithTime.length > 0 ? 
      completedTasksWithTime.reduce((total, task) => {
        if (task.startTime && task.endTime && task.documentsProcessed) {
          const hours = (new Date(task.endTime).getTime() - new Date(task.startTime).getTime()) / (1000 * 60 * 60)
          return total + (task.documentsProcessed / hours)
        }
        return total
      }, 0) / completedTasksWithTime.length : 0

    // Alertas y notificaciones
    const alerts = []
    
    // Escáneres en mantenimiento
    const scannersInMaintenance = await prisma.scanner.count({
      where: { status: ScannerStatus.MAINTENANCE }
    })
    if (scannersInMaintenance > 0) {
      alerts.push({
        type: 'warning',
        message: `${scannersInMaintenance} escáner(es) en mantenimiento`,
        count: scannersInMaintenance
      })
    }

    // Tareas pendientes por mucho tiempo
    const oldPendingTasks = await prisma.taskRecord.count({
      where: {
        ...userFilter,
        status: TaskStatus.IN_PROGRESS,
        createdAt: {
          lt: new Date(Date.now() - 24 * 60 * 60 * 1000) // Más de 24 horas
        }
      }
    })
    if (oldPendingTasks > 0) {
      alerts.push({
        type: 'error',
        message: `${oldPendingTasks} tarea(s) pendiente(s) por más de 24 horas`,
        count: oldPendingTasks
      })
    }

    // Proyectos próximos a vencer
    const projectsNearDeadline = await prisma.project.count({
      where: {
        status: ProjectStatus.ACTIVE,
        deadline: {
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Próximos 7 días
          gte: new Date()
        },
        ...(user.role === Role.EMPLOYEE ? {
          taskRecords: {
            some: { employeeId: user.id }
          }
        } : {})
      }
    })
    if (projectsNearDeadline > 0) {
      alerts.push({
        type: 'warning',
        message: `${projectsNearDeadline} proyecto(s) próximo(s) a vencer`,
        count: projectsNearDeadline
      })
    }

    const metrics = {
      overview: {
        totalProjects,
        totalUsers,
        totalScanners,
        totalTasks,
        activeProjects,
        availableScanners,
        totalPages: pagesStats._sum.documentsProcessed || 0,
        avgTimePerTask: Math.round(avgTimePerTask * 100) / 100,
        avgPagesPerHour: Math.round(avgPagesPerHour * 100) / 100
      },
      tasksByStatus: tasksByStatus.map(stat => ({
        status: stat.status,
        count: stat._count.id
      })),
      tasksByStage: tasksByStage.map(stat => ({
        stage: stat.stage,
        tasks: stat._count.id,
        pages: stat._sum.documentsProcessed || 0
      })),
      dailyProductivity,
      topUsers,
      topProjects: topProjectsWithDetails,
      alerts,
      period: days
    }

    return NextResponse.json(metrics)
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}