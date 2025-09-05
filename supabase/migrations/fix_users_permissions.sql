-- Otorgar permisos completos a los roles anon y authenticated para la tabla users
GRANT ALL PRIVILEGES ON users TO anon;
GRANT ALL PRIVILEGES ON users TO authenticated;

-- Habilitar RLS en la tabla users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Crear política para permitir lectura a usuarios autenticados
CREATE POLICY "Allow authenticated users to read users" ON users
  FOR SELECT
  TO authenticated
  USING (true);

-- Crear política para permitir lectura a usuarios anónimos (necesario para login)
CREATE POLICY "Allow anonymous users to read users for authentication" ON users
  FOR SELECT
  TO anon
  USING (true);

-- Verificar permisos actuales
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND grantee IN ('anon', 'authenticated') 
AND table_name = 'users'
ORDER BY table_name, grantee;