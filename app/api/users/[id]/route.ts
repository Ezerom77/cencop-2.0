import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { verifyJWT } from '@/lib/auth'
import { Role, TaskStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { UserUpdateData } from '@/types/api'

const updateUserSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').optional(),
  email: z.string().email('Email inválido').optional(),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').optional(),
  role: z.nativeEnum(Role).optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyJWT(request)
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    // Los empleados solo pueden ver su propio perfil
    if (user.role === Role.EMPLOYEE && user.id !== id) {
      return NextResponse.json({ error: 'No tienes permisos para ver este usuario' }, { status: 403 })
    }

    const userData = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        taskRecords: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
                clientName: true
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
          orderBy: { createdAt: 'desc' },
          take: 20
        },
        _count: {
          select: {
            taskRecords: true
          }
        }
      }
    })

    if (!userData) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Calcular estadísticas adicionales
    const stats = await prisma.taskRecord.aggregate({
      where: {
        employeeId: id
      },
      _sum: {
        documentsProcessed: true
      },
      _count: {
        id: true
      }
    })

    // Estadísticas por estado
    const statusStats = await prisma.taskRecord.groupBy({
      by: ['status'],
      where: {
        employeeId: id
      },
      _count: {
        id: true
      }
    })

    // Estadísticas por etapa
    const stageStats = await prisma.taskRecord.groupBy({
      by: ['stage'],
      where: {
        employeeId: id
      },
      _count: {
        id: true
      },
      _sum: {
        documentsProcessed: true
      }
    })

    // Estadísticas del último mes
    const lastMonth = new Date()
    lastMonth.setMonth(lastMonth.getMonth() - 1)
    
    const monthlyStats = await prisma.taskRecord.aggregate({
      where: {
        employeeId: id,
        createdAt: {
          gte: lastMonth
        }
      },
      _sum: {
        documentsProcessed: true
      },
      _count: {
        id: true
      }
    })

    // Calcular horas trabajadas
    const completedTasks = await prisma.taskRecord.findMany({
      where: {
          employeeId: id,
          status: TaskStatus.COMPLETED,
          endTime: { not: null }
      },
      select: {
        startTime: true,
        endTime: true,
        documentsProcessed: true,
        createdAt: true
      }
    })

    const totalHours = completedTasks.reduce((total, task) => {
      if (task.startTime && task.endTime) {
        const hours = (new Date(task.endTime).getTime() - new Date(task.startTime).getTime()) / (1000 * 60 * 60)
        return total + hours
      }
      return total
    }, 0)

    const hoursThisMonth = completedTasks
      .filter(task => task.createdAt >= lastMonth)
      .reduce((total, task) => {
        if (task.startTime && task.endTime) {
          const hours = (new Date(task.endTime).getTime() - new Date(task.startTime).getTime()) / (1000 * 60 * 60)
          return total + hours
        }
        return total
      }, 0)

    const avgPagesPerHour = completedTasks.length > 0 ? 
      completedTasks.reduce((total, task) => {
        if (task.startTime && task.endTime && task.documentsProcessed) {
          const hours = (new Date(task.endTime).getTime() - new Date(task.startTime).getTime()) / (1000 * 60 * 60)
          return total + (task.documentsProcessed / hours)
        }
        return total
      }, 0) / completedTasks.length : 0

    // Obtener proyectos únicos en los que ha trabajado
    const projectsWorked = await prisma.taskRecord.findMany({
      where: {
        employeeId: id
      },
      select: {
        project: {
          select: {
            id: true,
            name: true,
            clientName: true
          }
        }
      },
      distinct: ['projectId']
    })

    const userWithStats = {
      ...userData,
      statistics: {
        totalTasks: stats._count.id || 0,
        totalPages: stats._sum.documentsProcessed || 0,
        tasksThisMonth: monthlyStats._count.id || 0,
        pagesThisMonth: monthlyStats._sum.documentsProcessed || 0,
        totalHours: Math.round(totalHours * 100) / 100,
        hoursThisMonth: Math.round(hoursThisMonth * 100) / 100,
        avgPagesPerHour: Math.round(avgPagesPerHour * 100) / 100,
        projectsWorked: projectsWorked.length,
        statusBreakdown: statusStats.map(stat => ({
          status: stat.status,
          count: stat._count.id
        })),
        stageBreakdown: stageStats.map(stat => ({
          stage: stat.stage,
          tasks: stat._count.id,
          pages: stat._sum.documentsProcessed || 0
        })),
        uniqueProjects: projectsWorked.map(p => p.project)
      }
    }

    return NextResponse.json(userWithStats)
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyJWT(request)
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = updateUserSchema.parse(body)

    // Los empleados solo pueden actualizar su propio perfil y campos limitados
    if (user.role === Role.EMPLOYEE) {
      if (user.id !== id) {
        return NextResponse.json({ error: 'No tienes permisos para actualizar este usuario' }, { status: 403 })
      }
      
      // Los empleados no pueden cambiar su rol
      const allowedFields = ['name', 'email', 'password']
      const requestedFields = Object.keys(validatedData)
      const unauthorizedFields = requestedFields.filter(field => !allowedFields.includes(field))
      
      if (unauthorizedFields.length > 0) {
        return NextResponse.json({ 
          error: `No tienes permisos para actualizar: ${unauthorizedFields.join(', ')}` 
        }, { status: 403 })
      }
    }

    // Solo los administradores pueden cambiar roles
    if (validatedData.role && user.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Solo los administradores pueden cambiar roles' }, { status: 403 })
    }

    // Verificar que el usuario existe
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Si se está actualizando el email, verificar que no esté en uso
    if (validatedData.email && validatedData.email !== existingUser.email) {
      const duplicateUser = await prisma.user.findUnique({
        where: { email: validatedData.email }
      })

      if (duplicateUser) {
        return NextResponse.json({ error: 'El email ya está en uso' }, { status: 400 })
      }
    }

    const updateData: UserUpdateData = { ...validatedData }
    
    // Si se está actualizando la contraseña, encriptarla
    if (validatedData.password) {
      updateData.password = await bcrypt.hash(validatedData.password, 12)
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 })
    }
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyJWT(request)
    if (!user || user.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Solo los administradores pueden eliminar usuarios' }, { status: 403 })
    }

    const { id } = await params

    // No permitir que un administrador se elimine a sí mismo
    if (user.id === id) {
      return NextResponse.json({ error: 'No puedes eliminar tu propia cuenta' }, { status: 400 })
    }

    // Verificar que el usuario existe
    const userData = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            taskRecords: true
          }
        }
      }
    })

    if (!userData) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Verificar que no tenga tareas asociadas
    if (userData._count.taskRecords > 0) {
      return NextResponse.json({ 
        error: `No se puede eliminar el usuario. Tiene ${userData._count.taskRecords} tarea(s) asociada(s)` 
      }, { status: 400 })
    }

    // Eliminar el usuario
    await prisma.user.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Usuario eliminado exitosamente' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}