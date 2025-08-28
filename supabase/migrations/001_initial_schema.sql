-- Crear extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Crear tipos enum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MANAGER', 'EMPLOYEE');
CREATE TYPE "BillingMethod" AS ENUM ('per_document', 'per_hour');
CREATE TYPE "ProjectStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'PAUSED', 'CANCELLED');
CREATE TYPE "Stage" AS ENUM ('reception', 'preparation', 'scanning', 'indexing', 'quality_control', 'reassembly', 'delivery');
CREATE TYPE "TaskStatus" AS ENUM ('in_progress', 'completed', 'paused');
CREATE TYPE "ScannerStatus" AS ENUM ('available', 'in_use', 'maintenance', 'out_of_order');

-- Crear tabla users
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'EMPLOYEE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- Crear tabla scanners
CREATE TABLE "scanners" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "model" TEXT,
    "current_counter" INTEGER NOT NULL DEFAULT 0,
    "status" "ScannerStatus" NOT NULL DEFAULT 'available',
    "last_maintenance" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scanners_pkey" PRIMARY KEY ("id")
);

-- Crear tabla projects
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "client_name" TEXT NOT NULL,
    "billing_method" "BillingMethod" NOT NULL,
    "manager_id" TEXT NOT NULL,
    "estimated_documents" INTEGER,
    "deadline" TIMESTAMP(3),
    "status" "ProjectStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- Crear tabla task_records
CREATE TABLE "task_records" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "scanner_id" TEXT,
    "stage" "Stage" NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3),
    "documents_processed" INTEGER NOT NULL DEFAULT 0,
    "hours_worked" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "status" "TaskStatus" NOT NULL DEFAULT 'in_progress',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_records_pkey" PRIMARY KEY ("id")
);

-- Crear tabla scanner_logs
CREATE TABLE "scanner_logs" (
    "id" TEXT NOT NULL,
    "task_record_id" TEXT NOT NULL,
    "scanner_id" TEXT NOT NULL,
    "start_counter" INTEGER NOT NULL,
    "end_counter" INTEGER NOT NULL,
    "documents_scanned" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scanner_logs_pkey" PRIMARY KEY ("id")
);

-- Crear índices únicos
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "scanner_logs_task_record_id_key" ON "scanner_logs"("task_record_id");

-- Agregar claves foráneas
ALTER TABLE "projects" ADD CONSTRAINT "projects_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "task_records" ADD CONSTRAINT "task_records_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "task_records" ADD CONSTRAINT "task_records_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "task_records" ADD CONSTRAINT "task_records_scanner_id_fkey" FOREIGN KEY ("scanner_id") REFERENCES "scanners"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "scanner_logs" ADD CONSTRAINT "scanner_logs_task_record_id_fkey" FOREIGN KEY ("task_record_id") REFERENCES "task_records"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "scanner_logs" ADD CONSTRAINT "scanner_logs_scanner_id_fkey" FOREIGN KEY ("scanner_id") REFERENCES "scanners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Habilitar RLS (Row Level Security)
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "projects" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "task_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "scanners" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "scanner_logs" ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS básicas
CREATE POLICY "Enable read access for authenticated users" ON "users" FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable read access for authenticated users" ON "projects" FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable read access for authenticated users" ON "task_records" FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable read access for authenticated users" ON "scanners" FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable read access for authenticated users" ON "scanner_logs" FOR SELECT USING (auth.role() = 'authenticated');

-- Crear políticas de escritura para usuarios autenticados
CREATE POLICY "Enable insert for authenticated users" ON "projects" FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for authenticated users" ON "task_records" FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for authenticated users" ON "scanners" FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for authenticated users" ON "scanner_logs" FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON "projects" FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON "task_records" FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON "scanners" FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON "users" FOR UPDATE USING (auth.role() = 'authenticated');

-- Otorgar permisos a los roles de Supabase
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;