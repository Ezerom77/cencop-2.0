-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MANAGER', 'EMPLOYEE');

-- CreateEnum
CREATE TYPE "BillingMethod" AS ENUM ('per_document', 'per_hour');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'PAUSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "Stage" AS ENUM ('reception', 'preparation', 'scanning', 'indexing', 'quality_control', 'reassembly', 'delivery');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('in_progress', 'completed', 'paused');

-- CreateEnum
CREATE TYPE "ScannerStatus" AS ENUM ('available', 'in_use', 'maintenance', 'out_of_order');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'EMPLOYEE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "scanners" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "model" TEXT,
    "current_counter" INTEGER NOT NULL DEFAULT 0,
    "status" "ScannerStatus" NOT NULL DEFAULT 'available',
    "last_maintenance" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scanners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "scanner_logs_task_record_id_key" ON "scanner_logs"("task_record_id");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_records" ADD CONSTRAINT "task_records_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_records" ADD CONSTRAINT "task_records_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_records" ADD CONSTRAINT "task_records_scanner_id_fkey" FOREIGN KEY ("scanner_id") REFERENCES "scanners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scanner_logs" ADD CONSTRAINT "scanner_logs_task_record_id_fkey" FOREIGN KEY ("task_record_id") REFERENCES "task_records"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scanner_logs" ADD CONSTRAINT "scanner_logs_scanner_id_fkey" FOREIGN KEY ("scanner_id") REFERENCES "scanners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Insert initial data
-- Insert admin user
INSERT INTO "users" ("id", "email", "password_hash", "name", "role") VALUES 
('admin-001', 'admin@digitalizacion.com', '$2b$10$example_hash_admin', 'Administrador Sistema', 'ADMIN'),
('manager-001', 'gerente@digitalizacion.com', '$2b$10$example_hash_manager', 'Gerente Principal', 'MANAGER'),
('employee-001', 'empleado1@digitalizacion.com', '$2b$10$example_hash_employee1', 'Juan Pérez', 'EMPLOYEE'),
('employee-002', 'empleado2@digitalizacion.com', '$2b$10$example_hash_employee2', 'María García', 'EMPLOYEE');

-- Insert scanners
INSERT INTO "scanners" ("id", "name", "model", "current_counter", "status") VALUES 
('scanner-001', 'Escáner-001', 'Canon DR-G2140', 0, 'available'),
('scanner-002', 'Escáner-002', 'Fujitsu fi-7160', 0, 'available'),
('scanner-003', 'Escáner-003', 'Kodak i4650', 0, 'maintenance');

-- Insert sample project
INSERT INTO "projects" ("id", "name", "client_name", "billing_method", "manager_id", "estimated_documents", "deadline") VALUES 
('project-001', 'Proyecto Piloto', 'Cliente Ejemplo', 'per_document', 'manager-001', 1000, '2024-12-31');