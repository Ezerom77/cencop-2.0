-- Seed data para el sistema de digitalización
-- Este archivo contiene datos de prueba para todas las tablas

-- Insertar usuarios de prueba
INSERT INTO "users" ("id", "email", "password_hash", "name", "role") VALUES
('usr_admin_001', 'admin@cencop.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrador Sistema', 'ADMIN'),
('usr_mgr_001', 'gerente1@cencop.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'María González', 'MANAGER'),
('usr_mgr_002', 'gerente2@cencop.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Carlos Rodríguez', 'MANAGER'),
('usr_emp_001', 'empleado1@cencop.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Ana Martínez', 'EMPLOYEE'),
('usr_emp_002', 'empleado2@cencop.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Luis Fernández', 'EMPLOYEE'),
('usr_emp_003', 'empleado3@cencop.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Carmen López', 'EMPLOYEE');

-- Insertar escáneres de prueba
INSERT INTO "scanners" ("id", "name", "model", "current_counter", "status", "last_maintenance") VALUES
('scn_001', 'Escáner Principal A', 'Canon DR-G2140', 15420, 'available', '2024-01-15 10:00:00'),
('scn_002', 'Escáner Principal B', 'Fujitsu fi-7160', 8750, 'in_use', '2024-01-10 14:30:00'),
('scn_003', 'Escáner Backup', 'Epson DS-730N', 3200, 'maintenance', '2024-01-20 09:15:00'),
('scn_004', 'Escáner Portátil', 'Brother ADS-1700W', 1850, 'available', '2024-01-05 16:45:00');

-- Insertar proyectos de prueba
INSERT INTO "projects" ("id", "name", "client_name", "billing_method", "manager_id", "estimated_documents", "deadline", "status") VALUES
('prj_001', 'Digitalización Archivo Municipal', 'Ayuntamiento de Madrid', 'per_document', 'usr_mgr_001', 50000, '2024-06-30 23:59:59', 'ACTIVE'),
('prj_002', 'Expedientes Médicos Hospital Central', 'Hospital Central', 'per_hour', 'usr_mgr_002', 25000, '2024-05-15 23:59:59', 'ACTIVE'),
('prj_003', 'Documentos Históricos Biblioteca', 'Biblioteca Nacional', 'per_document', 'usr_mgr_001', 15000, '2024-08-31 23:59:59', 'ACTIVE'),
('prj_004', 'Archivo Empresarial Completo', 'Corporación XYZ', 'per_hour', 'usr_mgr_002', 8000, '2024-04-30 23:59:59', 'COMPLETED');

-- Insertar registros de tareas
-- Tareas completadas (hace 3 días)
INSERT INTO "task_records" ("id", "project_id", "employee_id", "scanner_id", "stage", "start_time", "end_time", "documents_processed", "hours_worked", "status") VALUES
('tsk_001', 'prj_001', 'usr_emp_001', 'scn_001', 'reception', '2024-01-14 08:00:00', '2024-01-14 12:00:00', 1200, 4.00, 'completed'),
('tsk_002', 'prj_001', 'usr_emp_002', 'scn_002', 'scanning', '2024-01-15 09:00:00', '2024-01-15 15:00:00', 850, 6.00, 'completed'),
('tsk_003', 'prj_002', 'usr_emp_003', 'scn_001', 'indexing', '2024-01-16 10:00:00', '2024-01-16 15:00:00', 650, 5.00, 'completed');

-- Tareas en progreso (hoy)
INSERT INTO "task_records" ("id", "project_id", "employee_id", "scanner_id", "stage", "start_time", "end_time", "documents_processed", "hours_worked", "status") VALUES
('tsk_004', 'prj_001', 'usr_emp_001', 'scn_002', 'quality_control', NOW() - INTERVAL '2 hours', NULL, 320, 2.00, 'in_progress'),
('tsk_005', 'prj_003', 'usr_emp_002', 'scn_004', 'preparation', NOW() - INTERVAL '1 hour', NULL, 150, 1.00, 'in_progress');

-- Más tareas completadas para mostrar variedad en las etapas
INSERT INTO "task_records" ("id", "project_id", "employee_id", "scanner_id", "stage", "start_time", "end_time", "documents_processed", "hours_worked", "status") VALUES
('tsk_006', 'prj_002', 'usr_emp_003', 'scn_001', 'preparation', '2024-01-13 08:30:00', '2024-01-13 11:30:00', 400, 3.00, 'completed'),
('tsk_007', 'prj_003', 'usr_emp_001', 'scn_004', 'scanning', '2024-01-12 14:00:00', '2024-01-12 18:00:00', 750, 4.00, 'completed'),
('tsk_008', 'prj_001', 'usr_emp_002', 'scn_002', 'reassembly', '2024-01-11 09:15:00', '2024-01-11 13:15:00', 600, 4.00, 'completed'),
('tsk_009', 'prj_004', 'usr_emp_003', 'scn_001', 'delivery', '2024-01-10 15:00:00', '2024-01-10 17:00:00', 300, 2.00, 'completed'),
('tsk_010', 'prj_002', 'usr_emp_001', 'scn_003', 'quality_control', '2024-01-09 10:30:00', '2024-01-09 15:30:00', 550, 5.00, 'completed');

-- Insertar logs de escáner
INSERT INTO "scanner_logs" ("id", "task_record_id", "scanner_id", "start_counter", "end_counter", "documents_scanned") VALUES
('log_001', 'tsk_001', 'scn_001', 14220, 15420, 1200),
('log_002', 'tsk_002', 'scn_002', 7900, 8750, 850),
('log_003', 'tsk_003', 'scn_001', 15420, 16070, 650),
('log_004', 'tsk_006', 'scn_001', 13820, 14220, 400),
('log_005', 'tsk_007', 'scn_004', 1100, 1850, 750),
('log_006', 'tsk_008', 'scn_002', 7300, 7900, 600),
('log_007', 'tsk_010', 'scn_003', 2650, 3200, 550);

-- Actualizar contadores de escáneres basado en los logs
UPDATE "scanners" SET "current_counter" = 16070 WHERE "id" = 'scn_001';
UPDATE "scanners" SET "current_counter" = 8750 WHERE "id" = 'scn_002';
UPDATE "scanners" SET "current_counter" = 3200 WHERE "id" = 'scn_003';
UPDATE "scanners" SET "current_counter" = 1850 WHERE "id" = 'scn_004';