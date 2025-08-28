import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { Role, ProjectStatus, BillingMethod, TaskStatus, Project } from '@prisma/client'
import { ProjectUpdateData, StageStats } from '@/types/api'

type ProjectWithTaskRecords = Project & {
  taskRecords: {
    id: string;
    stage: string;
    status: TaskStatus;
    documentsProcessed: number | null;
    startTime: Date | null;
    endTime: Date | null;
    employeeId: string;
    employee: {
      id: string;
      name: string;
      email: string;
    };
    scanner: {
      id: string;
      name: string;
      model: string | null;
    };
  }[];
  _count: {
    taskRecords: number;
  };
}

const updateProjectSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').optional(),
  clientName: z.string().min(1, 'El nombre del cliente es requerido').optional(),
  estimatedDocuments: z.number().int().positive('Los documentos estimados deben ser positivos').optional(),
  billingMethod: z.nativeEnum(BillingMethod).optional(),
  deadline: z.string().datetime().optional(),
  status: z.nativeEnum(ProjectStatus).optional()
}).partial()



export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request })
    if (!token) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { id } = await params
    
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        taskRecords: {
          include: {
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
          },
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            taskRecords: true
          }
        }
      }
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Proyecto no encontrado' },
        { status: 404 }
      )
    }

    // Verificar permisos para empleados
    if (token.role === Role.EMPLOYEE) {
      const hasAccess = project.taskRecords.some(task => task.employeeId === token.sub)
      if (!hasAccess) {
        return NextResponse.json(
          { error: 'No tienes acceso a este proyecto' },
          { status: 403 }
        )
      }
    }

    // Calcular estadísticas del proyecto
    const totalPages = project.taskRecords.reduce((sum: number, task: { documentsProcessed: number | null }) => sum + (task.documentsProcessed || 0), 0)
    const completedTasks = project.taskRecords.filter((task: { status: TaskStatus }) => task.status === TaskStatus.COMPLETED).length
    const progress = project.estimatedDocuments && project.estimatedDocuments > 0 ? (totalPages / project.estimatedDocuments) * 100 : 0
    
    // Calcular tiempo total trabajado
    const totalHours = project.taskRecords.reduce((sum: number, task: { startTime: Date | null; endTime: Date | null }) => {
      if (task.startTime && task.endTime) {
        const hours = (new Date(task.endTime).getTime() - new Date(task.startTime).getTime()) / (1000 * 60 * 60)
        return sum + hours
      }
      return sum
    }, 0)

    // Estadísticas por etapa
    const stageStats = project.taskRecords.reduce((stats: StageStats, task: { stage: string; documentsProcessed: number | null; startTime: Date | null; endTime: Date | null }) => {
      if (!stats[task.stage]) {
        stats[task.stage] = { count: 0, pages: 0, hours: 0 }
      }
      stats[task.stage].count++
      stats[task.stage].pages += task.documentsProcessed || 0
      
      if (task.startTime && task.endTime) {
        const hours = (new Date(task.endTime).getTime() - new Date(task.startTime).getTime()) / (1000 * 60 * 60)
        stats[task.stage].hours += hours
      }
      
      return stats
    }, {})

    const projectWithStats = {
      ...project,
      totalPages,
      completedTasks,
      progress: Math.min(progress, 100),
      totalHours: Math.round(totalHours * 100) / 100,
      stageStats
    }

    return NextResponse.json(projectWithStats)
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request })
    if (!token || (token.role !== Role.ADMIN && token.role !== Role.MANAGER)) {
      return NextResponse.json(
        { error: 'Permisos insuficientes' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = updateProjectSchema.parse(body)

    // Verificar que el proyecto existe
    const existingProject = await prisma.project.findUnique({
      where: { id }
    })

    if (!existingProject) {
      return NextResponse.json(
        { error: 'Proyecto no encontrado' },
        { status: 404 }
      )
    }

    // El método de facturación se puede actualizar sin validaciones adicionales

    const updateData: ProjectUpdateData = {
      ...(validatedData.name && { name: validatedData.name }),
      ...(validatedData.clientName && { clientName: validatedData.clientName }),
      ...(validatedData.estimatedDocuments && { estimatedDocuments: validatedData.estimatedDocuments }),
      ...(validatedData.billingMethod && { billingMethod: validatedData.billingMethod }),
      ...(validatedData.status && { status: validatedData.status }),
      ...(validatedData.deadline && { deadline: new Date(validatedData.deadline) })
    }

    const project = await prisma.project.update({
      where: { id },
      data: updateData,
      include: {
        taskRecords: {
          include: {
            employee: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        _count: {
          select: {
            taskRecords: true
          }
        }
      }
    })

    return NextResponse.json(project)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error updating project:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request })
    if (!token || token.role !== Role.ADMIN) {
      return NextResponse.json(
        { error: 'Solo los administradores pueden eliminar proyectos' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Verificar que el proyecto existe
    const existingProject = await prisma.project.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            taskRecords: true
          }
        }
      }
    })

    if (!existingProject) {
      return NextResponse.json(
        { error: 'Proyecto no encontrado' },
        { status: 404 }
      )
    }

    // Verificar si el proyecto tiene tareas asociadas
    if (existingProject._count.taskRecords > 0) {
      return NextResponse.json(
        { 
          error: 'No se puede eliminar un proyecto con tareas asociadas. Elimine primero todas las tareas.' 
        },
        { status: 400 }
      )
    }

    await prisma.project.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Proyecto eliminado exitosamente' })
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}