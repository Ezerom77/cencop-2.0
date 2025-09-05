import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { Role } from '@prisma/client'

const startScanSchema = z.object({
  action: z.literal('start'),
  currentCounter: z.number().min(0, 'El contador debe ser un número positivo')
})

export async function POST(
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
    const validatedData = startScanSchema.parse(body)

    // Verificar que el escáner existe y está activo
    const scanner = await prisma.scanner.findUnique({
      where: { id }
    })

    if (!scanner) {
      return NextResponse.json({ error: 'Escáner no encontrado' }, { status: 404 })
    }

    if (scanner.status !== 'ACTIVE') {
      return NextResponse.json({ 
        error: 'El escáner debe estar en estado Activo para iniciar un escaneo' 
      }, { status: 400 })
    }

    // Actualizar el contador actual del escáner
    const updatedScanner = await prisma.scanner.update({
      where: { id },
      data: {
        currentCounter: validatedData.currentCounter
      }
    })

    // Crear un log de inicio de escaneo
    await prisma.scannerLog.create({
      data: {
        scannerId: id,
        startCounter: validatedData.currentCounter,
        endCounter: validatedData.currentCounter, // Se actualizará cuando termine el escaneo
        documentsScanned: 0, // Se actualizará cuando termine el escaneo
        taskRecordId: null // Se puede asociar a una tarea específica si es necesario
      }
    })

    return NextResponse.json({
      message: 'Escaneo iniciado exitosamente',
      scanner: {
        id: updatedScanner.id,
        name: updatedScanner.name,
        currentCounter: updatedScanner.currentCounter,
        status: updatedScanner.status
      }
    })
  } catch (error) {
    console.error('Error starting scan:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Datos inválidos', 
        details: error.errors 
      }, { status: 400 })
    }

    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}