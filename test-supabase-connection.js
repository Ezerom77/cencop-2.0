const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testConnection() {
  try {
    console.log('Probando conexión a Supabase...');
    
    // Probar conexión básica
    await prisma.$connect();
    console.log('✅ Conexión establecida');
    
    // Probar consulta simple
    const scanners = await prisma.scanner.findMany();
    console.log(`✅ Encontrados ${scanners.length} escáneres`);
    
    if (scanners.length > 0) {
      console.log('Primer escáner:', scanners[0]);
    }
    
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    console.error('Detalles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();