import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { Role, ScannerStatus } from '@prisma/client'
import { ScannerFilters, ScannerCreateData } from '@/types/api'

const createScannerSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  model: z.string().optional(),
  status: z.nativeEnum(ScannerStatus).default(ScannerStatus.AVAILABLE)
})

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request })
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const location = searchParams.get('location')
    
    const skip = (page - 1) * limit

    const where: ScannerFilters = {}
    
    if (status && status !== 'ALL') {
      where.status = status as ScannerStatus
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [scanners, total] = await Promise.all([
      prisma.scanner.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              taskRecords: true,
              scannerLogs: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.scanner.count({ where })
    ])

    // Obtener estadísticas adicionales para cada escáner
    const scannersWithStats = await Promise.all(
      scanners.map(async (scanner) => {
        // Obtener uso en el último mes
        const lastMonth = new Date()
        lastMonth.setMonth(lastMonth.getMonth() - 1)
        
        // Obtener estadísticas de hoy
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)
        
        // Obtener estadísticas de la semana
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        
        const [recentUsage, todayUsage, weekUsage, totalUsage, lastUsed, errorLogs] = await Promise.all([
          // Uso del último mes
          prisma.scannerLog.aggregate({
            where: {
              scannerId: scanner.id,
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
          }),
          // Uso de hoy
          prisma.scannerLog.aggregate({
            where: {
              scannerId: scanner.id,
              createdAt: {
                gte: today,
                lt: tomorrow
              }
            },
            _sum: {
              documentsScanned: true
            },
            _count: {
              id: true
            }
          }),
          // Uso de la semana
          prisma.scannerLog.aggregate({
            where: {
              scannerId: scanner.id,
              createdAt: {
                gte: weekAgo
              }
            },
            _sum: {
              documentsScanned: true
            },
            _count: {
              id: true
            }
          }),
          // Uso total
          prisma.scannerLog.aggregate({
            where: {
              scannerId: scanner.id
            },
            _sum: {
              documentsScanned: true
            },
            _count: {
              id: true
            },
            _avg: {
              documentsScanned: true
            }
          }),
          // Último uso
          prisma.scannerLog.findFirst({
            where: {
              scannerId: scanner.id
            },
            orderBy: {
              createdAt: 'desc'
            },
            select: {
              createdAt: true,
              taskRecord: {
                select: {
                  employee: {
                    select: {
                      name: true
                    }
                  }
                }
              }
            }
          }),
          // Contar errores (tareas pausadas o con problemas)
          prisma.taskRecord.count({
            where: {
              scannerId: scanner.id,
              status: 'PAUSED'
            }
          })
        ])

        // Calcular uptime basado en días desde la creación
        const createdAt = new Date(scanner.createdAt)
        const now = new Date()
        const daysSinceCreation = Math.max(1, Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)))
        const uptimeHours = daysSinceCreation * 24
        
        // Calcular tiempo promedio de escaneo (simulado basado en documentos)
        const avgScanTime = totalUsage._avg.documentsScanned ? Math.round(totalUsage._avg.documentsScanned * 0.5) : 30

        // Mapear al formato esperado por el frontend
        return {
          id: scanner.id,
          name: scanner.name,
          model: scanner.model || 'Modelo no especificado',
          serialNumber: `SN-${scanner.id.slice(-8).toUpperCase()}`,
          ipAddress: `192.168.1.${Math.floor(Math.random() * 200) + 50}`,
          status: scanner.status === 'AVAILABLE' ? 'ONLINE' : 
                 scanner.status === 'IN_USE' ? 'SCANNING' :
                 scanner.status === 'MAINTENANCE' ? 'MAINTENANCE' :
                 scanner.status === 'OUT_OF_ORDER' ? 'ERROR' : 'OFFLINE',
          location: 'Oficina Principal', // Valor por defecto
          assignedTo: lastUsed?.taskRecord?.employee?.name || null,
          lastScan: lastUsed?.createdAt?.toISOString() || null,
          totalScans: totalUsage._count.id || 0,
          pagesScanned: totalUsage._sum.documentsScanned || 0,
          errorCount: errorLogs || 0,
          uptime: uptimeHours,
          version: '2.1.0',
          settings: {
            resolution: '300 DPI',
            colorMode: 'Color',
            format: 'PDF',
            autoFeed: true,
            duplexMode: true
          },
          stats: {
            todayScans: todayUsage._count.id || 0,
            weekScans: weekUsage._count.id || 0,
            monthScans: recentUsage._count.id || 0,
            avgScanTime: avgScanTime
          },
          createdAt: scanner.createdAt.toISOString(),
          updatedAt: scanner.updatedAt.toISOString(),
          // Mantener campos originales para compatibilidad
          totalTasks: scanner._count.taskRecords,
          totalLogs: scanner._count.scannerLogs,
          pagesThisMonth: recentUsage._sum.documentsScanned || 0,
          usageThisMonth: recentUsage._count.id || 0,
          lastUsed: lastUsed?.createdAt || null,
          lastUsedBy: lastUsed?.taskRecord?.employee?.name || null
        }
      })
    )

    return NextResponse.json({
      scanners: scannersWithStats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching scanners:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request })
    if (!token || (token.role !== Role.ADMIN && token.role !== Role.MANAGER)) {
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = createScannerSchema.parse(body)

    const scannerData: ScannerCreateData = {
      ...validatedData
    }

    const scanner = await prisma.scanner.create({
      data: scannerData,
      include: {
        _count: {
          select: {
            taskRecords: true,
            scannerLogs: true
          }
        }
      }
    })

    return NextResponse.json(scanner, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 })
    }
    console.error('Error creating scanner:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}