-- Otorgar permisos a los roles anon y authenticated para la tabla users
GRANT SELECT ON users TO anon;
GRANT SELECT ON users TO authenticated;

-- Verificar permisos actuales
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND grantee IN ('anon', 'authenticated') 
AND table_name = 'users'
ORDER BY table_name, grantee;