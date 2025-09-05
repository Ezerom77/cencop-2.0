const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createAdminUser() {
  try {
    console.log('🔍 Verificando usuarios existentes...');
    
    // Verificar si ya existe un usuario ADMIN
    const { data: adminUsers, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'ADMIN');
    
    if (checkError) {
      console.error('❌ Error al verificar usuarios ADMIN:', checkError);
      return;
    }
    
    if (adminUsers && adminUsers.length > 0) {
      console.log('✅ Ya existe un usuario ADMIN:');
      adminUsers.forEach(user => {
        console.log(`   - ${user.name} (${user.email})`);
      });
      return;
    }
    
    console.log('⚠️  No se encontraron usuarios ADMIN. Creando uno...');
    
    // Crear usuario ADMIN
    const adminEmail = 'admin@cencop.com';
    const adminPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        email: adminEmail,
        password_hash: hashedPassword,
        name: 'Administrador',
        role: 'ADMIN'
      })
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Error al crear usuario ADMIN:', createError);
      return;
    }
    
    console.log('✅ Usuario ADMIN creado exitosamente:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   Nombre: ${newUser.name}`);
    console.log(`   Rol: ${newUser.role}`);
    console.log('');
    console.log('🔐 Puedes usar estas credenciales para iniciar sesión.');
    
  } catch (error) {
    console.error('💥 Error general:', error);
  }
}

createAdminUser();