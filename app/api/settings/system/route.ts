import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { Role } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request })
    
    if (!token?.email) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Configuraciones del sistema (algunas pueden requerir permisos de admin)
    const systemSettings = {
      application: {
        name: 'CENCOP',
        version: '2.0.0',
        description: 'Sistema de Gestión de Digitalización',
        supportEmail: 'soporte@cencop.com'
      },
      features: {
        multipleProjects: true,
        realTimeUpdates: true,
        fileUpload: true,
        reporting: true,
        userManagement: true
      },
      limits: {
        maxFileSize: '10MB',
        maxProjectsPerUser: 50,
        maxTasksPerProject: 1000,
        sessionTimeout: 24 // horas
      },
      security: {
        passwordMinLength: 8,
        requireSpecialChars: true,
        sessionTimeout: 1440, // minutos (24 horas)
        maxLoginAttempts: 5
      },
      ui: {
        defaultTheme: 'system',
        availableLanguages: ['es', 'en'],
        defaultLanguage: 'es',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h'
      },
      integrations: {
        scannerSupport: true,
        exportFormats: ['PDF', 'Excel', 'CSV'],
        backupEnabled: true
      }
    }

    return NextResponse.json(systemSettings)
  } catch (error) {
    console.error('Error al obtener configuraciones del sistema:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}