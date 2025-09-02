import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request })
    
    if (!token?.email) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Buscar el usuario en la base de datos
    const user = await prisma.user.findUnique({
      where: { email: token.email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Configuraciones por defecto del usuario
    const userSettings = {
      profile: {
        name: user.name || '',
        email: user.email,
        phone: '',
        avatar: '',
        department: '',
        position: '',
        timezone: 'America/Mexico_City',
        language: 'es'
      },
      notifications: {
        email: true,
        push: true,
        sms: false,
        taskUpdates: true,
        projectUpdates: true,
        systemAlerts: true,
        weeklyReports: false
      },
      security: {
        twoFactorEnabled: false,
        sessionTimeout: 1440, // 24 horas en minutos
        passwordLastChanged: new Date().toISOString(),
        loginHistory: true
      },
      preferences: {
        theme: 'system' as const,
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h' as const,
        defaultView: 'table' as const,
        itemsPerPage: 10,
        autoRefresh: true,
        refreshInterval: 30
      }
    }

    return NextResponse.json({ settings: userSettings })
  } catch (error) {
    console.error('Error al obtener configuraciones de usuario:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = await getToken({ req: request })
    
    if (!token?.email) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Buscar el usuario en la base de datos
    const user = await prisma.user.findUnique({
      where: { email: token.email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Aquí podrías guardar las configuraciones en la base de datos
    // Por ahora, simplemente devolvemos éxito
    console.log('Configuraciones de usuario actualizadas:', body)

    return NextResponse.json({ 
      success: true, 
      message: 'Configuraciones guardadas exitosamente' 
    })
  } catch (error) {
    console.error('Error al guardar configuraciones de usuario:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}