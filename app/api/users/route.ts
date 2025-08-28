import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { Role } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { UserFilters } from '@/types/api'

const createUserSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  role: z.nativeEnum(Role)
})

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request })
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    
    if (token.role !== Role.ADMIN && token.role !== Role.MANAGER) {
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const role = searchParams.get('role')
    const search = searchParams.get('search')
    // Removed isActive and department filters as they don't exist in schema
    
    const skip = (page - 1) * limit

    const where: UserFilters = {}
    
    if (role && role !== 'ALL') {
      where.role = role as Role
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    // Removed isActive and department filters as they don't exist in schema

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              taskRecords: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ])

    // Obtener estadísticas adicionales para cada usuario
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const stats = await prisma.taskRecord.aggregate({
          where: {
            employeeId: user.id,
            status: 'COMPLETED'
          },
          _sum: {
            documentsProcessed: true
          },
          _count: {
            id: true
          }
        })

        // Calcular horas trabajadas en el último mes
        const lastMonth = new Date()
        lastMonth.setMonth(lastMonth.getMonth() - 1)
        
        const recentTasks = await prisma.taskRecord.findMany({
          where: {
            employeeId: user.id,
            createdAt: {
              gte: lastMonth
            }
          },
          select: {
            startTime: true,
            endTime: true
          }
        })

        const hoursThisMonth = recentTasks.reduce((total, task) => {
          if (task.startTime && task.endTime) {
            const hours = (new Date(task.endTime).getTime() - new Date(task.startTime).getTime()) / (1000 * 60 * 60)
            return total + hours
          }
          return total
        }, 0)

        return {
          ...user,
          totalTasks: stats._count.id || 0,
          totalDocuments: stats._sum.documentsProcessed || 0,
          hoursThisMonth: Math.round(hoursThisMonth * 100) / 100
        }
      })
    )

    return NextResponse.json({
      users: usersWithStats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request })
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    
    if (token.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Solo los administradores pueden crear usuarios' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = createUserSchema.parse(body)

    // Verificar que el email no esté en uso
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })

    if (existingUser) {
      return NextResponse.json({ error: 'El email ya está en uso' }, { status: 400 })
    }

    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(validatedData.password, 12)

    const newUser = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        passwordHash: hashedPassword,
        role: validatedData.role
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json(newUser, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 })
    }
    console.error('Error creating user:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}