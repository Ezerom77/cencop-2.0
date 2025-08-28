import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...')

  // Limpiar datos existentes
  await prisma.scannerLog.deleteMany()
  await prisma.taskRecord.deleteMany()
  await prisma.project.deleteMany()
  await prisma.scanner.deleteMany()
  await prisma.user.deleteMany()

  console.log('🗑️  Datos existentes eliminados')

  // Crear usuarios
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@cencop.com',
      passwordHash: await bcrypt.hash('admin123', 10),
      name: 'Administrador Sistema',
      role: 'ADMIN'
    }
  })

  const manager1 = await prisma.user.create({
    data: {
      email: 'gerente1@cencop.com',
      passwordHash: await bcrypt.hash('gerente123', 10),
      name: 'María González',
      role: 'MANAGER'
    }
  })

  const manager2 = await prisma.user.create({
    data: {
      email: 'gerente2@cencop.com',
      passwordHash: await bcrypt.hash('gerente123', 10),
      name: 'Carlos Rodríguez',
      role: 'MANAGER'
    }
  })

  const employee1 = await prisma.user.create({
    data: {
      email: 'empleado1@cencop.com',
      passwordHash: await bcrypt.hash('empleado123', 10),
      name: 'Ana Martínez',
      role: 'EMPLOYEE'
    }
  })

  const employee2 = await prisma.user.create({
    data: {
      email: 'empleado2@cencop.com',
      passwordHash: await bcrypt.hash('empleado123', 10),
      name: 'Luis Fernández',
      role: 'EMPLOYEE'
    }
  })

  const employee3 = await prisma.user.create({
    data: {
      email: 'empleado3@cencop.com',
      passwordHash: await bcrypt.hash('empleado123', 10),
      name: 'Carmen López',
      role: 'EMPLOYEE'
    }
  })

  console.log('👥 Usuarios creados')

  // Crear escáneres
  const scanner1 = await prisma.scanner.create({
    data: {
      name: 'Escáner Principal A',
      model: 'Canon DR-G2140',
      currentCounter: 15420,
      status: 'AVAILABLE',
      lastMaintenance: new Date('2024-01-15')
    }
  })

  const scanner2 = await prisma.scanner.create({
    data: {
      name: 'Escáner Principal B',
      model: 'Fujitsu fi-7160',
      currentCounter: 8750,
      status: 'IN_USE',
      lastMaintenance: new Date('2024-01-10')
    }
  })

  const scanner3 = await prisma.scanner.create({
    data: {
      name: 'Escáner Backup',
      model: 'Epson DS-730N',
      currentCounter: 3200,
      status: 'MAINTENANCE',
      lastMaintenance: new Date('2024-01-20')
    }
  })

  const scanner4 = await prisma.scanner.create({
    data: {
      name: 'Escáner Portátil',
      model: 'Brother ADS-1700W',
      currentCounter: 1850,
      status: 'AVAILABLE',
      lastMaintenance: new Date('2024-01-05')
    }
  })

  console.log('🖨️  Escáneres creados')

  // Crear proyectos
  const project1 = await prisma.project.create({
    data: {
      name: 'Digitalización Archivo Municipal',
      clientName: 'Ayuntamiento de Madrid',
      billingMethod: 'PER_DOCUMENT',
      managerId: manager1.id,
      estimatedDocuments: 50000,
      deadline: new Date('2024-06-30'),
      status: 'ACTIVE'
    }
  })

  const project2 = await prisma.project.create({
    data: {
      name: 'Expedientes Médicos Hospital Central',
      clientName: 'Hospital Central',
      billingMethod: 'PER_HOUR',
      managerId: manager2.id,
      estimatedDocuments: 25000,
      deadline: new Date('2024-05-15'),
      status: 'ACTIVE'
    }
  })

  const project3 = await prisma.project.create({
    data: {
      name: 'Documentos Históricos Biblioteca',
      clientName: 'Biblioteca Nacional',
      billingMethod: 'PER_DOCUMENT',
      managerId: manager1.id,
      estimatedDocuments: 15000,
      deadline: new Date('2024-08-31'),
      status: 'ACTIVE'
    }
  })

  const project4 = await prisma.project.create({
    data: {
      name: 'Archivo Empresarial Completo',
      clientName: 'Corporación XYZ',
      billingMethod: 'PER_HOUR',
      managerId: manager2.id,
      estimatedDocuments: 8000,
      deadline: new Date('2024-04-30'),
      status: 'COMPLETED'
    }
  })

  console.log('📁 Proyectos creados')

  // Crear registros de tareas con datos realistas
  const now = new Date()
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)

  // Tareas completadas
  const task1 = await prisma.taskRecord.create({
    data: {
      projectId: project1.id,
      employeeId: employee1.id,
      scannerId: scanner1.id,
      stage: 'RECEPTION',
      startTime: threeDaysAgo,
      endTime: new Date(threeDaysAgo.getTime() + 4 * 60 * 60 * 1000),
      documentsProcessed: 1200,
      hoursWorked: 4.0,
      status: 'COMPLETED'
    }
  })

  const task2 = await prisma.taskRecord.create({
    data: {
      projectId: project1.id,
      employeeId: employee2.id,
      scannerId: scanner2.id,
      stage: 'SCANNING',
      startTime: twoDaysAgo,
      endTime: new Date(twoDaysAgo.getTime() + 6 * 60 * 60 * 1000),
      documentsProcessed: 850,
      hoursWorked: 6.0,
      status: 'COMPLETED'
    }
  })

  const task3 = await prisma.taskRecord.create({
    data: {
      projectId: project2.id,
      employeeId: employee3.id,
      scannerId: scanner1.id,
      stage: 'INDEXING',
      startTime: yesterday,
      endTime: new Date(yesterday.getTime() + 5 * 60 * 60 * 1000),
      documentsProcessed: 650,
      hoursWorked: 5.0,
      status: 'COMPLETED'
    }
  })

  // Tareas en progreso
  const task4 = await prisma.taskRecord.create({
    data: {
      projectId: project1.id,
      employeeId: employee1.id,
      scannerId: scanner2.id,
      stage: 'QUALITY_CONTROL',
      startTime: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      documentsProcessed: 320,
      hoursWorked: 2.0,
      status: 'IN_PROGRESS'
    }
  })

  const task5 = await prisma.taskRecord.create({
    data: {
      projectId: project3.id,
      employeeId: employee2.id,
      scannerId: scanner4.id,
      stage: 'PREPARATION',
      startTime: new Date(now.getTime() - 1 * 60 * 60 * 1000),
      documentsProcessed: 150,
      hoursWorked: 1.0,
      status: 'IN_PROGRESS'
    }
  })

  console.log('📋 Registros de tareas creados')

  // Crear logs de escáner
  await prisma.scannerLog.create({
    data: {
      taskRecordId: task1.id,
      scannerId: scanner1.id,
      startCounter: 14220,
      endCounter: 15420,
      documentsScanned: 1200
    }
  })

  await prisma.scannerLog.create({
    data: {
      taskRecordId: task2.id,
      scannerId: scanner2.id,
      startCounter: 7900,
      endCounter: 8750,
      documentsScanned: 850
    }
  })

  await prisma.scannerLog.create({
    data: {
      taskRecordId: task3.id,
      scannerId: scanner1.id,
      startCounter: 15420,
      endCounter: 16070,
      documentsScanned: 650
    }
  })

  console.log('📊 Logs de escáner creados')

  console.log('✅ Seed completado exitosamente!')
  console.log('\n📋 Datos de prueba creados:')
  console.log('👤 Usuarios:')
  console.log('   - admin@cencop.com (contraseña: admin123) - ADMIN')
  console.log('   - gerente1@cencop.com (contraseña: gerente123) - MANAGER')
  console.log('   - gerente2@cencop.com (contraseña: gerente123) - MANAGER')
  console.log('   - empleado1@cencop.com (contraseña: empleado123) - EMPLOYEE')
  console.log('   - empleado2@cencop.com (contraseña: empleado123) - EMPLOYEE')
  console.log('   - empleado3@cencop.com (contraseña: empleado123) - EMPLOYEE')
  console.log('\n🖨️  4 Escáneres con diferentes estados')
  console.log('📁 4 Proyectos (3 activos, 1 completado)')
  console.log('📋 5 Registros de tareas en diferentes etapas')
  console.log('📊 3 Logs de escáner con contadores realistas')
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })