-- Crear usuario ADMIN si no existe
DO $$
BEGIN
    -- Verificar si ya existe un usuario ADMIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE role = 'ADMIN') THEN
        -- Crear usuario ADMIN
        INSERT INTO users (id, email, password_hash, name, role, created_at, updated_at)
        VALUES (
            'admin-' || generate_random_uuid(),
            'admin@cencop.com',
            '$2a$12$LQv3c1yqBWVHxkd0LQ4YCOWz3SiVkHkEO3cyEW6b2/ZQ5sLlo1W.2', -- admin123
            'Administrador',
            'ADMIN',
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Usuario ADMIN creado exitosamente';
        RAISE NOTICE 'Email: admin@cencop.com';
        RAISE NOTICE 'Password: admin123';
    ELSE
        RAISE NOTICE 'Ya existe un usuario ADMIN';
    END IF;
END $$;

-- Verificar permisos para la tabla users
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO authenticated;
GRANT SELECT ON users TO anon;