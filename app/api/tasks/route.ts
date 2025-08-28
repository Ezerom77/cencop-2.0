import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getToken } from 'next-auth/jwt'
import { Role, Stage, TaskStatus } from '@prisma/client'
import { TaskFilters, TaskCreateData } from '@/types/api'

const createTaskSchema = z.object({
  projectId: z.string().min(1, 'El ID del proyecto es requerido'),
  stage: z.nativeEnum(Stage),
  scannerId: z.string().min(1, 'El ID del escáner es requerido'),
  documentsProcessed: z.number().int().min(0, 'Los documentos procesados no pueden ser negativos').optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  notes: z.string().optional(),
  qualityScore: z.number().min(1).max(10).optional()
})

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request })
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = Number(searchParams.get('page')) || 1
    const limit = Number(searchParams.get('limit')) || 10
    const projectId = searchParams.get('projectId')
    const stage = searchParams.get('stage')
    const status = searchParams.get('status')
    const userId = searchParams.get('userId')
    const scannerId = searchParams.get('scannerId')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    
    const skip = (page - 1) * limit

    const where: TaskFilters = {}
    
    if (projectId) {
      where.projectId = projectId
    }
    
    if (stage && stage !== 'ALL') {
      where.stage = stage as Stage
    }
    
    if (status && status !== 'ALL') {
      where.status = status as TaskStatus
    }
    
    if (userId) {
      where.employeeId = userId
    }
    
    if (scannerId) {
      where.scannerId = scannerId
    }
    
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom)
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo)
      }
    }

    // Si el usuario no es admin o manager, solo puede ver sus propias tareas
    if (token.role === Role.EMPLOYEE) {
      where.employeeId = token.sub
    }

    const [tasks, total] = await Promise.all([
      prisma.taskRecord.findMany({
        where,
        skip,
        take: limit,
        include: {
          project: {
            select: {
              id: true,
              name: true,
              clientName: true,
              status: true
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
              model: true,
              status: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.taskRecord.count({ where })
    ])

    // Calcular duración para cada tarea
    const tasksWithDuration = tasks.map(task => {
      let duration = 0
      if (task.startTime && task.endTime) {
        duration = (new Date(task.endTime).getTime() - new Date(task.startTime).getTime()) / (1000 * 60 * 60)
      }
      
      return {
        ...task,
        duration: Math.round(duration * 100) / 100
      }
    })

    return NextResponse.json({
      tasks: tasksWithDuration,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request })
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createTaskSchema.parse(body)

    // Verificar que el proyecto existe
    const project = await prisma.project.findUnique({
      where: { id: validatedData.projectId }
    })

    if (!project) {
      return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })
    }

    // Verificar que el escáner existe y está disponible
    const scanner = await prisma.scanner.findUnique({
      where: { id: validatedData.scannerId }
    })

    if (!scanner) {
      return NextResponse.json({ error: 'Escáner no encontrado' }, { status: 404 })
    }

    if (scanner.status !== 'AVAILABLE') {
      return NextResponse.json({ error: 'El escáner no está disponible' }, { status: 400 })
    }

    // Validar fechas si se proporcionan
    if (validatedData.startTime && validatedData.endTime) {
      const startTime = new Date(validatedData.startTime)
      const endTime = new Date(validatedData.endTime)
      
      if (endTime <= startTime) {
        return NextResponse.json({ error: 'La fecha de fin debe ser posterior a la fecha de inicio' }, { status: 400 })
      }
    }

    const taskData: TaskCreateData = {
      stage: validatedData.stage,
      projectId: validatedData.projectId,
      scannerId: validatedData.scannerId,
      employeeId: token.sub!,
      status: validatedData.endTime ? TaskStatus.COMPLETED : TaskStatus.IN_PROGRESS,
      startTime: validatedData.startTime ? new Date(validatedData.startTime) : new Date(),
      endTime: validatedData.endTime ? new Date(validatedData.endTime) : undefined,
      documentsProcessed: validatedData.documentsProcessed
    }

    const task = await prisma.taskRecord.create({
      data: taskData,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            clientName: true
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

    // Si la tarea está completada, actualizar el contador del escáner
    if (taskData.status === TaskStatus.COMPLETED && validatedData.documentsProcessed) {
      await prisma.scannerLog.create({
        data: {
          scannerId: validatedData.scannerId,
          documentsScanned: validatedData.documentsProcessed,
          taskRecordId: task.id,
          startCounter: scanner.currentCounter,
          endCounter: scanner.currentCounter + validatedData.documentsProcessed
        }
      })

      // Actualizar el contador del escáner
      await prisma.scanner.update({
        where: { id: validatedData.scannerId },
        data: {
          currentCounter: {
            increment: validatedData.documentsProcessed
          }
        }
      })
    }

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 })
    }
    console.error('Error creating task:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}