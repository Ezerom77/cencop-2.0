import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { Role, ScannerStatus } from '@prisma/client'
import { ScannerUpdateData } from '@/types/api'

const updateScannerSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').optional(),
  model: z.string().min(1, 'El modelo es requerido').optional(),
  serialNumber: z.string().min(1, 'El número de serie es requerido').optional(),
  location: z.string().min(1, 'La ubicación es requerida').optional(),
  status: z.nativeEnum(ScannerStatus).optional(),
  specifications: z.string().optional(),
  purchaseDate: z.string().datetime().optional(),
  warrantyExpiry: z.string().datetime().optional(),
  maintenanceNotes: z.string().optional()
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

    const scanner = await prisma.scanner.findUnique({
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
            project: {
              select: {
                id: true,
                name: true,
                clientName: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        scannerLogs: {
          include: {
            taskRecord: {
              include: {
                employee: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 20
        },
        _count: {
          select: {
            taskRecords: true,
            scannerLogs: true
          }
        }
      }
    })

    if (!scanner) {
      return NextResponse.json({ error: 'Escáner no encontrado' }, { status: 404 })
    }

    // Calcular estadísticas adicionales
    const stats = await prisma.scannerLog.aggregate({
      where: {
        scannerId: id
      },
      _sum: {
        documentsScanned: true
      },
      _count: {
        id: true
      }
    })

    // Estadísticas del último mes
    const lastMonth = new Date()
    lastMonth.setMonth(lastMonth.getMonth() - 1)
    
    const monthlyStats = await prisma.scannerLog.aggregate({
      where: {
        scannerId: id,
        createdAt: {
          gte: lastMonth
        }
      },
      _sum: {
        documentsScanned: true
      },
      _count: {
        id: true
      }
    })

    // Estadísticas por etapa
    const stageStats = await prisma.taskRecord.groupBy({
      by: ['stage'],
      where: {
        scannerId: id
      },
      _count: {
        id: true
      },
      _sum: {
        documentsProcessed: true
      }
    })

    // Calcular tiempo promedio por tarea
    const completedTasks = await prisma.taskRecord.findMany({
      where: {
        scannerId: id,
        status: 'COMPLETED',
        startTime: { not: undefined },
        endTime: { not: undefined }
      },
      select: {
        startTime: true,
        endTime: true,
        documentsProcessed: true
      }
    })

    const avgTimePerTask = completedTasks.length > 0 ? 
      completedTasks.reduce((total, task) => {
        if (task.startTime && task.endTime) {
          const hours = (new Date(task.endTime).getTime() - new Date(task.startTime).getTime()) / (1000 * 60 * 60)
          return total + hours
        }
        return total
      }, 0) / completedTasks.length : 0

    const avgPagesPerHour = completedTasks.length > 0 ? 
      completedTasks.reduce((total, task) => {
        if (task.startTime && task.endTime && task.documentsProcessed) {
          const hours = (new Date(task.endTime).getTime() - new Date(task.startTime).getTime()) / (1000 * 60 * 60)
          return total + (task.documentsProcessed / hours)
        }
        return total
      }, 0) / completedTasks.length : 0

    const scannerWithStats = {
      ...scanner,
      statistics: {
        totalPages: stats._sum.documentsScanned || 0,
        totalLogs: stats._count.id || 0,
        pagesThisMonth: monthlyStats._sum.documentsScanned || 0,
        usageThisMonth: monthlyStats._count.id || 0,
        avgTimePerTask: Math.round(avgTimePerTask * 100) / 100,
        avgPagesPerHour: Math.round(avgPagesPerHour * 100) / 100,
        stageBreakdown: stageStats.map(stat => ({
          stage: stat.stage,
          tasks: stat._count.id,
          pages: stat._sum.documentsProcessed || 0
        }))
      }
    }

    return NextResponse.json(scannerWithStats)
  } catch (error) {
    console.error('Error fetching scanner:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request })
    if (!token || (token.role !== Role.ADMIN && token.role !== Role.MANAGER)) {
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = updateScannerSchema.parse(body)

    // Verificar que el escáner existe
    const existingScanner = await prisma.scanner.findUnique({
      where: { id }
    })

    if (!existingScanner) {
      return NextResponse.json({ error: 'Escáner no encontrado' }, { status: 404 })
    }



    // Si se está cambiando el estado a MAINTENANCE o OUT_OF_ORDER, verificar que no tenga tareas activas
    if (validatedData.status && 
        (validatedData.status === ScannerStatus.MAINTENANCE || validatedData.status === ScannerStatus.OUT_OF_ORDER) &&
        existingScanner.status === ScannerStatus.AVAILABLE) {
      
      const activeTasks = await prisma.taskRecord.count({
        where: {
          scannerId: id,
          status: {
            in: ['IN_PROGRESS', 'PAUSED']
          }
        }
      })

      if (activeTasks > 0) {
        return NextResponse.json({ 
          error: `No se puede cambiar el estado del escáner. Tiene ${activeTasks} tarea(s) activa(s)` 
        }, { status: 400 })
      }
    }

    const updateData: ScannerUpdateData = { ...validatedData }

    const scanner = await prisma.scanner.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            taskRecords: true,
            scannerLogs: true
          }
        }
      }
    })

    return NextResponse.json(scanner)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 })
    }
    console.error('Error updating scanner:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request })
    if (!token || token.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Solo los administradores pueden eliminar escáneres' }, { status: 403 })
    }

    const { id } = await params

    // Verificar que el escáner existe
    const scanner = await prisma.scanner.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            taskRecords: true,
            scannerLogs: true
          }
        }
      }
    })

    if (!scanner) {
      return NextResponse.json({ error: 'Escáner no encontrado' }, { status: 404 })
    }

    // Verificar que no tenga tareas asociadas
    if (scanner._count.taskRecords > 0) {
      return NextResponse.json({ 
        error: `No se puede eliminar el escáner. Tiene ${scanner._count.taskRecords} tarea(s) asociada(s)` 
      }, { status: 400 })
    }

    // Eliminar logs del escáner primero (si los hay)
    if (scanner._count.scannerLogs > 0) {
      await prisma.scannerLog.deleteMany({
        where: { scannerId: id }
      })
    }

    // Eliminar el escáner
    await prisma.scanner.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Escáner eliminado exitosamente' })
  } catch (error) {
    console.error('Error deleting scanner:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}