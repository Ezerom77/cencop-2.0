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
    const limit = parseInt(searchParams.get('limit') || '5')

    // Filtros basados en el rol del usuario
    const projectFilter = userRole === Role.EMPLOYEE 
      ? { taskRecords: { some: { employeeId: userId } } }
      : {}

    // Obtener proyectos recientes con estadísticas
    const projects = await prisma.project.findMany({
      where: projectFilter,
      take: limit,
      orderBy: {
        updatedAt: 'desc'
      },
      include: {
        taskRecords: {
          select: {
            id: true,
            status: true,
            documentsProcessed: true
          }
        },
        _count: {
          select: {
            taskRecords: true
          }
        }
      }
    })

    // Calcular estadísticas para cada proyecto
    const projectsWithStats = projects.map(project => {
      const totalTasks = project.taskRecords.length
      const completedTasks = project.taskRecords.filter(task => task.status === 'COMPLETED').length
      const totalDocuments = project.taskRecords.reduce((sum, task) => sum + (task.documentsProcessed || 0), 0)
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

      return {
        id: project.id,
        name: project.name,
        clientName: project.clientName,
        status: project.status,
        billingMethod: project.billingMethod,
        deadline: project.deadline,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        totalTasks,
        completedTasks,
        totalDocuments,
        progress
      }
    })

    return NextResponse.json(projectsWithStats)
  } catch (error) {
    console.error('Error fetching dashboard projects:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}