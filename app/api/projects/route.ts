import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { Role, ProjectStatus, BillingMethod, TaskStatus, Project } from '@prisma/client'
import { ProjectFilters } from '@/types/api'

type ProjectWithTaskRecords = Project & {
  taskRecords: {
    id: string;
    stage: string;
    status: TaskStatus;
    documentsProcessed: number | null;
  }[];
  _count: {
    taskRecords: number;
  };
}

const createProjectSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  clientName: z.string().min(1, 'El nombre del cliente es requerido'),
  estimatedDocuments: z.number().int().positive('Los documentos estimados deben ser positivos').optional(),
  billingMethod: z.nativeEnum(BillingMethod),
  deadline: z.string().datetime().optional()
})

const updateProjectSchema = createProjectSchema.partial()



export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request })
    if (!token) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    
    const skip = (page - 1) * limit

    const where: ProjectFilters = {}
    
    if (status && status !== 'ALL') {
      where.status = status as ProjectStatus
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { clientName: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Filtrar proyectos para empleados (solo proyectos donde tienen tareas)
    if (token.role === Role.EMPLOYEE) {
      where.taskRecords = {
        some: {
          employeeId: token.sub!
        }
      }
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take: limit,
        include: {
          taskRecords: {
            select: {
              id: true,
              stage: true,
              status: true,
              documentsProcessed: true
            }
          },
          _count: {
            select: {
              taskRecords: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.project.count({ where })
    ])

    // Calcular estadísticas para cada proyecto
    const projectsWithStats = projects.map((project: ProjectWithTaskRecords) => {
      const totalPages = project.taskRecords.reduce((sum: number, task: { documentsProcessed: number | null }) => sum + (task.documentsProcessed || 0), 0)
      const completedTasks = project.taskRecords.filter((task: { status: TaskStatus }) => task.status === TaskStatus.COMPLETED).length
      const progress = project.estimatedDocuments && project.estimatedDocuments > 0 ? (totalPages / project.estimatedDocuments) * 100 : 0
      
      return {
        ...project,
        totalPages,
        completedTasks,
        progress: Math.min(progress, 100)
      }
    })

    return NextResponse.json({
      projects: projectsWithStats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request })
    if (!token || (token.role !== Role.ADMIN && token.role !== Role.MANAGER)) {
      return NextResponse.json(
        { error: 'Permisos insuficientes' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = createProjectSchema.parse(body)

    // El método de facturación se puede configurar sin validaciones adicionales

    const project = await prisma.project.create({
      data: {
        ...validatedData,
        deadline: validatedData.deadline ? new Date(validatedData.deadline) : null,
        status: ProjectStatus.ACTIVE,
        managerId: token.sub!
      },
      include: {
        taskRecords: true,
        _count: {
          select: {
            taskRecords: true
          }
        }
      }
    })

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}