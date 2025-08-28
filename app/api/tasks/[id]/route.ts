import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getToken } from 'next-auth/jwt'
import { Role, Stage, TaskStatus } from '@prisma/client'
import { TaskUpdateData } from '@/types/api'

const updateTaskSchema = z.object({
  stage: z.nativeEnum(Stage).optional(),
  scannerId: z.string().min(1, 'El ID del escáner es requerido').optional(),
  documentsProcessed: z.number().int().min(0, 'Los documentos procesados no pueden ser negativos').optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  notes: z.string().optional(),
  qualityScore: z.number().min(1).max(10).optional(),
  status: z.nativeEnum(TaskStatus).optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request })
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    
    const task = await prisma.taskRecord.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            clientName: true,
            status: true,
            estimatedDocuments: true
          }
        },
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
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
      }
    })

    if (!task) {
      return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 })
    }

    // Verificar permisos: empleados solo pueden ver sus propias tareas
    if (token.role === Role.EMPLOYEE && task.employeeId !== token.sub) {
      return NextResponse.json({ error: 'No tienes permisos para ver esta tarea' }, { status: 403 })
    }

    // Calcular duración si hay fechas de inicio y fin
    let duration = 0
    if (task.startTime && task.endTime) {
      duration = (new Date(task.endTime).getTime() - new Date(task.startTime).getTime()) / (1000 * 60 * 60)
    }

    const taskWithStats = {
      ...task,
      duration: Math.round(duration * 100) / 100
    }

    return NextResponse.json(taskWithStats)
  } catch (error) {
    console.error('Error fetching task:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request })
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = updateTaskSchema.parse(body)

    // Verificar que la tarea existe
    const existingTask = await prisma.taskRecord.findUnique({
      where: { id },
      include: {
        scanner: true
      }
    })

    if (!existingTask) {
      return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 })
    }

    // Verificar permisos: empleados solo pueden editar sus propias tareas
    if (token.role === Role.EMPLOYEE && existingTask.employeeId !== token.sub) {
      return NextResponse.json({ error: 'No tienes permisos para editar esta tarea' }, { status: 403 })
    }

    // Verificar que el escáner está disponible si se está cambiando
    if (validatedData.scannerId && validatedData.scannerId !== existingTask.scannerId) {
      const scanner = await prisma.scanner.findUnique({
        where: { id: validatedData.scannerId }
      })

      if (!scanner) {
        return NextResponse.json({ error: 'Escáner no encontrado' }, { status: 404 })
      }

      if (scanner.status !== 'AVAILABLE') {
        return NextResponse.json({ error: 'El escáner no está disponible' }, { status: 400 })
      }
    }

    // Validar fechas si se proporcionan
    const startTime = validatedData.startTime ? new Date(validatedData.startTime) : existingTask.startTime
    const endTime = validatedData.endTime ? new Date(validatedData.endTime) : existingTask.endTime
    
    if (startTime && endTime && endTime <= startTime) {
      return NextResponse.json({ error: 'La fecha de fin debe ser posterior a la fecha de inicio' }, { status: 400 })
    }

    const updateData: TaskUpdateData = {}
    
    if (validatedData.documentsProcessed !== undefined) {
      updateData.documentsProcessed = validatedData.documentsProcessed
    }
    
    if (validatedData.stage) {
      updateData.stage = validatedData.stage
    }
    
    if (validatedData.status) {
      updateData.status = validatedData.status
    }
    
    if (validatedData.scannerId) {
      updateData.scannerId = validatedData.scannerId
    }
    
    if (validatedData.notes) {
      updateData.notes = validatedData.notes
    }
    
    if (validatedData.qualityScore !== undefined) {
      updateData.qualityScore = validatedData.qualityScore
    }
    
    if (validatedData.startTime) {
      updateData.startTime = new Date(validatedData.startTime)
    }
    
    if (validatedData.endTime) {
      updateData.endTime = new Date(validatedData.endTime)
      // Si se establece fecha de fin y no hay estado, marcar como completada
      if (!validatedData.status) {
        updateData.status = TaskStatus.COMPLETED
      }
    }

    // Si se está completando la tarea y hay páginas procesadas, actualizar contadores
    const wasCompleted = existingTask.status === TaskStatus.COMPLETED
    const isBeingCompleted = updateData.status === TaskStatus.COMPLETED || 
                           (updateData.endTime && existingTask.status !== TaskStatus.COMPLETED)
    
    const oldPages = existingTask.documentsProcessed || 0
    const newPages = validatedData.documentsProcessed ?? oldPages
    const pagesDifference = newPages - oldPages

    await prisma.$transaction(async (tx) => {
      // Actualizar la tarea
      const updatedTask = await tx.taskRecord.update({
        where: { id },
        data: updateData,
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

      // Actualizar logs del escáner si es necesario
      if (isBeingCompleted && !wasCompleted && newPages > 0) {
        // Crear nuevo log
        const scanner = await tx.scanner.findUnique({
          where: { id: validatedData.scannerId || existingTask.scannerId! }
        })
        
        await tx.scannerLog.create({
          data: {
            scannerId: validatedData.scannerId || existingTask.scannerId!,
            taskRecordId: id,
            startCounter: scanner!.currentCounter,
            endCounter: scanner!.currentCounter + newPages,
            documentsScanned: newPages
          }
        })

        // Actualizar contador del escáner
        await tx.scanner.update({
          where: { id: validatedData.scannerId || existingTask.scannerId! },
          data: {
            currentCounter: {
              increment: newPages
            }
          }
        })
      } else if (wasCompleted && pagesDifference !== 0) {
        // Actualizar log existente
        const existingLog = await tx.scannerLog.findFirst({
          where: { taskRecordId: id }
        })

        if (existingLog) {
          await tx.scannerLog.update({
            where: { id: existingLog.id },
            data: {
              documentsScanned: newPages
            }
          })

          // Actualizar contador del escáner
        await tx.scanner.update({
          where: { id: validatedData.scannerId || existingTask.scannerId! },
          data: {
            currentCounter: {
              increment: pagesDifference
            }
          }
        })
        }
      }

      return updatedTask
    })

    const task = await prisma.taskRecord.findUnique({
      where: { id },
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

    return NextResponse.json(task)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 })
    }
    console.error('Error updating task:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request })
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    // Verificar que la tarea existe
    const existingTask = await prisma.taskRecord.findUnique({
      where: { id },
      include: {
        scanner: true
      }
    })

    if (!existingTask) {
      return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 })
    }

    // Solo admins y managers pueden eliminar tareas, o el empleado propietario
    if (token.role === Role.EMPLOYEE && existingTask.employeeId !== token.sub) {
      return NextResponse.json({ error: 'No tienes permisos para eliminar esta tarea' }, { status: 403 })
    }

    await prisma.$transaction(async (tx) => {
      // Si la tarea estaba completada, revertir contadores
      if (existingTask.status === TaskStatus.COMPLETED && existingTask.documentsProcessed) {
        // Eliminar log del escáner
        await tx.scannerLog.deleteMany({
          where: { taskRecordId: id }
        })

        // Revertir contador del escáner
        await tx.scanner.update({
          where: { id: existingTask.scannerId! },
          data: {
            currentCounter: {
              decrement: existingTask.documentsProcessed
            }
          }
        })
      }

      // Eliminar la tarea
      await tx.taskRecord.delete({
        where: { id }
      })
    })

    return NextResponse.json({ message: 'Tarea eliminada exitosamente' })
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}