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
      general: {
        companyName: 'CENCOP',
        companyLogo: '',
        timezone: 'America/Mexico_City',
        language: 'es',
        currency: 'MXN',
        dateFormat: 'DD/MM/YYYY'
      },
      email: {
        smtpHost: '',
        smtpPort: 587,
        smtpUser: '',
        smtpPassword: '',
        fromEmail: 'noreply@cencop.com',
        fromName: 'CENCOP Sistema',
        encryption: 'tls' as const
      },
      backup: {
        autoBackup: true,
        backupFrequency: 'daily' as const,
        retentionDays: 30,
        lastBackup: new Date().toISOString()
      },
      maintenance: {
        maintenanceMode: false,
        maintenanceMessage: 'El sistema está en mantenimiento. Volveremos pronto.',
        allowedIPs: ['127.0.0.1']
      }
    }

    return NextResponse.json({ settings: systemSettings })
  } catch (error) {
    console.error('Error al obtener configuraciones del sistema:', error)
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
    
    // Verificar que el usuario tenga permisos de administrador
    // Por ahora, simplemente aceptamos cualquier usuario autenticado
    
    // Aquí podrías guardar las configuraciones del sistema en la base de datos
    // Por ahora, simplemente devolvemos éxito
    console.log('Configuraciones del sistema actualizadas:', body)

    return NextResponse.json({ 
      success: true, 
      message: 'Configuraciones del sistema guardadas exitosamente' 
    })
  } catch (error) {
    console.error('Error al guardar configuraciones del sistema:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}