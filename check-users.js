const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function checkDemoUsers() {
  try {
    console.log('Verificando usuarios demo...');
    
    const demoEmails = [
      'admin@cencop.com',
      'gerente1@cencop.com', 
      'empleado1@cencop.com'
    ];
    
    for (const email of demoEmails) {
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          passwordHash: true
        }
      });
      
      if (user) {
        console.log(`✓ Usuario encontrado: ${user.email} (${user.role})`);
        
        // Verificar contraseñas
        const passwords = {
          'admin@cencop.com': 'admin123',
          'gerente1@cencop.com': 'gerente123',
          'empleado1@cencop.com': 'empleado123'
        };
        
        const expectedPassword = passwords[email];
        const isValidPassword = await bcrypt.compare(expectedPassword, user.passwordHash);
        
        if (isValidPassword) {
          console.log(`  ✓ Contraseña correcta para ${email}`);
        } else {
          console.log(`  ✗ Contraseña incorrecta para ${email}`);
        }
      } else {
        console.log(`✗ Usuario no encontrado: ${email}`);
      }
    }
    
    // Mostrar todos los usuarios
    console.log('\nTodos los usuarios en la base de datos:');
    const allUsers = await prisma.user.findMany({
      select: {
        email: true,
        name: true,
        role: true
      }
    });
    
    allUsers.forEach(user => {
      console.log(`- ${user.email} (${user.name}) - ${user.role}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDemoUsers();