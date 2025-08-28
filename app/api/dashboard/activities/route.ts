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
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    // Filtros basados en el rol del usuario
    const taskFilter = userRole === Role.EMPLOYEE 
      ? { employeeId: userId }
      : {}

    // Obtener actividades recientes (tareas actualizadas recientemente)
    const recentTasks = await prisma.taskRecord.findMany({
      where: taskFilter,
      take: limit,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        },
        employee: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        scanner: {
          select: {
            id: true,
            name: true,
            model: true
          }
        }
      }
    })

    // Formatear actividades
    const activities = recentTasks.map(task => {
      let activityType = 'task_updated'
      let description = `Tarea actualizada`
      
      // Determinar el tipo de actividad basado en el estado y tiempo
      const now = new Date()
      const createdAt = new Date(task.createdAt)
      const timeDiff = now.getTime() - createdAt.getTime()
      const hoursDiff = timeDiff / (1000 * 3600)
      
      if (task.status === 'COMPLETED' && hoursDiff < 24) {
        activityType = 'task_completed'
        description = `Tarea completada: ${task.documentsProcessed || 0} documentos procesados`
      } else if (task.status === 'IN_PROGRESS' && hoursDiff < 1) {
        activityType = 'task_started'
        description = `Tarea iniciada`
      } else if (task.status === 'PAUSED') {
        activityType = 'task_paused'
        description = `Tarea pausada`
      }

      return {
        id: task.id,
        type: activityType,
        description,
        timestamp: task.createdAt,
        user: task.employee,
        project: task.project,
        scanner: task.scanner,
        task: {
          id: task.id,
          stage: task.stage,
          status: task.status,
          documentsProcessed: task.documentsProcessed
        }
      }
    })

    return NextResponse.json(activities)
  } catch (error) {
    console.error('Error fetching dashboard activities:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}