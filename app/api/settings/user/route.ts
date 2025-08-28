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
      theme: 'system', // 'light', 'dark', 'system'
      language: 'es', // 'es', 'en'
      notifications: {
        email: true,
        browser: true,
        taskReminders: true,
        projectUpdates: true,
        systemAlerts: true
      },
      dashboard: {
        defaultView: 'overview', // 'overview', 'projects', 'tasks'
        itemsPerPage: 10,
        showCompletedTasks: false
      },
      profile: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    }

    return NextResponse.json(userSettings)
  } catch (error) {
    console.error('Error al obtener configuraciones de usuario:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}