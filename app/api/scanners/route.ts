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
        
        const recentUsage = await prisma.scannerLog.aggregate({
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
        })

        // Obtener el último uso
        const lastUsed = await prisma.scannerLog.findFirst({
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
        })

        // Calcular promedio de páginas por día en el último mes
        const daysInMonth = 30
        const avgPagesPerDay = recentUsage._sum.documentsScanned ?
        Math.round((recentUsage._sum.documentsScanned / daysInMonth) * 100) / 100 : 0

        return {
          ...scanner,
          totalTasks: scanner._count.taskRecords,
          totalLogs: scanner._count.scannerLogs,
          pagesThisMonth: recentUsage._sum.documentsScanned || 0,
          usageThisMonth: recentUsage._count.id || 0,
          avgPagesPerDay,
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