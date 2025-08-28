# Sistema de Gestión y Seguimiento de Trabajo para Digitalización de Documentos

Sistema integral para la gestión y seguimiento del trabajo de digitalización de documentos, desarrollado con Next.js 14, TypeScript, PostgreSQL y Prisma.

## 🚀 Características Principales

- **Gestión de Proyectos**: Creación y seguimiento de proyectos de digitalización
- **Seguimiento de Tareas**: Control detallado de las 7 etapas del proceso
- **Métricas de Rendimiento**: Análisis de productividad por empleado y proyecto
- **Gestión de Escáneres**: Control de uso y mantenimiento de equipos
- **Reportes Automatizados**: Generación de informes de facturación y productividad
- **Dashboard en Tiempo Real**: Visualización de métricas y estado del sistema

## 🛠️ Stack Tecnológico

- **Frontend**: Next.js 14, React 18, TypeScript
- **Backend**: Express.js, Node.js
- **Base de Datos**: PostgreSQL 15
- **ORM**: Prisma
- **Autenticación**: NextAuth.js
- **UI**: Tailwind CSS, Radix UI
- **Iconos**: Lucide React
- **Gráficos**: Recharts
- **Validación**: Zod
- **Gestión de Estado**: Zustand

## 📋 Prerrequisitos

- Node.js 18+ 
- PostgreSQL 15+
- pnpm (recomendado) o npm

## 🔧 Configuración del Proyecto

### 1. Clonar e instalar dependencias

```bash
# Instalar dependencias
pnpm install
```

### 2. Configurar variables de entorno

Copiar el archivo `.env.example` a `.env` y configurar las variables:

```bash
cp .env.example .env
```

Editar `.env` con tus configuraciones:

```env
# Database
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/digitalizacion_db"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="tu-secret-key-aqui"

# JWT
JWT_SECRET="tu-jwt-secret-aqui"

# Server
PORT=3001
NODE_ENV=development
```

### 3. Configurar la base de datos

```bash
# Generar el cliente de Prisma
pnpm db:generate

# Ejecutar migraciones
pnpm db:push

# (Opcional) Abrir Prisma Studio
pnpm db:studio
```

### 4. Ejecutar el proyecto

```bash
# Modo desarrollo (frontend + backend)
pnpm run dev

# Solo frontend
pnpm run dev:client

# Solo backend
pnpm run dev:server
```

El proyecto estará disponible en:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Prisma Studio: http://localhost:5555

## 📁 Estructura del Proyecto

```
├── api/                    # Backend Express.js
│   ├── routes/            # Rutas de la API
│   │   ├── auth.ts       # Autenticación
│   │   ├── projects/     # Gestión de proyectos
│   │   ├── tasks/        # Gestión de tareas
│   │   ├── reports/      # Reportes
│   │   └── resources/    # Recursos (usuarios, escáneres)
│   ├── app.ts            # Configuración de Express
│   └── server.ts         # Servidor principal
├── src/                   # Frontend React/Next.js
│   ├── components/       # Componentes React
│   │   ├── ui/          # Componentes UI base
│   │   ├── layout/      # Componentes de layout
│   │   └── forms/       # Formularios
│   ├── pages/           # Páginas de la aplicación
│   │   ├── dashboard/   # Dashboard principal
│   │   ├── projects/    # Gestión de proyectos
│   │   ├── tasks/       # Gestión de tareas
│   │   ├── reports/     # Reportes
│   │   ├── resources/   # Recursos
│   │   └── settings/    # Configuración
│   ├── lib/             # Utilidades y configuración
│   │   ├── prisma.ts    # Cliente de Prisma
│   │   ├── utils.ts     # Utilidades generales
│   │   └── validations.ts # Esquemas de validación
│   └── types/           # Tipos TypeScript
├── prisma/              # Configuración de Prisma
│   └── schema.prisma    # Esquema de la base de datos
└── .trae/documents/     # Documentación del proyecto
```

## 🔄 Flujo de Trabajo del Sistema

El sistema gestiona 7 etapas del proceso de digitalización:

1. **Recepción**: Recepción de documentos del cliente
2. **Preparación**: Preparación de documentos para escaneo
3. **Escaneo**: Digitalización de documentos
4. **Control de Calidad**: Verificación de calidad de imágenes
5. **Indexación**: Organización y catalogación
6. **Preparación de Entrega**: Preparación de entregables
7. **Devolución**: Devolución de documentos al cliente

## 👥 Roles de Usuario

- **ADMIN**: Acceso completo al sistema
- **MANAGER**: Gestión de proyectos y equipos
- **EMPLOYEE**: Ejecución de tareas asignadas
- **VIEWER**: Solo lectura de reportes

## 📊 Métricas y Reportes

- **Productividad por empleado**: Documentos/hora por empleado
- **Uso de escáneres**: Tiempo de uso y documentos procesados
- **Progreso de proyectos**: Estado y avance de cada proyecto
- **Facturación**: Cálculos automáticos según método de facturación
- **Reportes automatizados**: Generación programada de informes

## 🔒 Seguridad

- Autenticación JWT
- Autorización basada en roles
- Validación de datos con Zod
- Sanitización de entradas
- Conexiones seguras a la base de datos

## 📚 Scripts Disponibles

```bash
# Desarrollo
pnpm run dev          # Ejecutar frontend + backend
pnpm run dev:client   # Solo frontend
pnpm run dev:server   # Solo backend

# Base de datos
pnpm db:generate      # Generar cliente Prisma
pnpm db:push          # Aplicar cambios al esquema
pnpm db:migrate       # Crear migración
pnpm db:studio        # Abrir Prisma Studio

# Construcción
pnpm run build        # Construir para producción
pnpm run start        # Ejecutar en producción

# Linting
pnpm run lint         # Ejecutar ESLint
```

## 🚀 Despliegue

### Variables de entorno para producción

```env
NODE_ENV=production
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="https://tu-dominio.com"
NEXTAUTH_SECRET="secret-seguro-para-produccion"
JWT_SECRET="jwt-secret-seguro-para-produccion"
```

### Comandos de despliegue

```bash
# Construir para producción
pnpm run build

# Ejecutar migraciones en producción
pnpm db:migrate

# Iniciar servidor de producción
pnpm run start
```

## 📖 Documentación Adicional

- [Requisitos del Producto](./.trae/documents/requisitos_producto_sistema_digitalizacion.md)
- [Arquitectura Técnica](./.trae/documents/arquitectura_tecnica_sistema_digitalizacion.md)

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 📞 Soporte

Para soporte técnico o consultas sobre el proyecto, contactar al equipo de desarrollo.