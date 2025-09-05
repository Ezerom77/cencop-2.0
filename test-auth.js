const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testAuth() {
  try {
    console.log('Probando autenticación directa...');
    
    const testCredentials = {
      email: 'admin@cencop.com',
      password: 'admin123'
    };
    
    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { email: testCredentials.email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        passwordHash: true
      }
    });
    
    if (!user) {
      console.log('❌ Usuario no encontrado');
      return;
    }
    
    console.log('✅ Usuario encontrado:', user.email);
    
    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(testCredentials.password, user.passwordHash);
    
    if (isValidPassword) {
      console.log('✅ Contraseña válida');
      console.log('Usuario autenticado:', {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      });
    } else {
      console.log('❌ Contraseña inválida');
    }
    
  } catch (error) {
    console.error('Error en la autenticación:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAuth();