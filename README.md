# 🚛 Sistema de Gestión de Alarmas de Transporte

Sistema integral de gestión y monitoreo de alarmas para flotas de transporte, desarrollado con arquitectura moderna full-stack TypeScript.

## 📋 Descripción

Sistema profesional de gestión de alarmas que permite el monitoreo en tiempo real de flotas de transporte, con capacidades avanzadas de análisis, seguimiento de conductores, gestión de dispositivos y generación de reportes. Incluye workflow completo de revisión de alarmas desde pendientes hasta confirmadas/rechazadas.

## 🚀 Características Principales

### 🔔 Gestión de Alarmas
- **Workflow de Estados**: Pendiente → Sospechosa → Confirmada/Rechazada
- **Asignación de Conductores**: Vinculación de alarmas con conductores específicos
- **Clasificación de Anomalías**: Categorización detallada de alarmas confirmadas
- **Función de Deshacer**: Reversión de estados para correcciones
- **Soporte Multimedia**: Gestión de imágenes y videos con integración AWS S3

### 📊 Dashboard y Analytics
- **KPIs en Tiempo Real**: Métricas clave de rendimiento
- **Gráficos Interactivos**: Distribución por días, tipos, tendencias semanales
- **Rankings**: Clasificaciones de conductores y dispositivos
- **Análisis Temporal**: Distribución horaria y patrones de comportamiento

### 👥 Gestión de Conductores
- **Perfiles Detallados**: Información completa y estadísticas
- **Asociación con Empresas**: Gestión multi-empresa
- **Historial de Alarmas**: Seguimiento de incidentes por conductor
- **Estadísticas de Rendimiento**: Métricas individuales y comparativas

### 📱 Gestión de Dispositivos
- **Monitoreo de Flota**: Estado y ubicación de vehículos
- **Seguimiento GPS**: Visualización en mapas interactivos
- **Estadísticas por Dispositivo**: Análisis de performance individual
- **Alertas de Estado**: Notificaciones de funcionamiento

## 🏗️ Arquitectura Técnica

### Backend
- **Framework**: Express.js con TypeScript
- **Base de Datos**: SQL Server con Prisma ORM
- **Esquemas Multi-Schema**: `alarmas`, `dimCentral`, `dbo`
- **API RESTful**: Endpoints organizados por recursos
- **Autenticación**: JWT con bcryptjs
- **Almacenamiento**: AWS S3 para multimedia
- **Documentos**: Generación de PDFs con PDFKit

### Frontend
- **Framework**: Next.js 15 con App Router
- **UI/UX**: Tailwind CSS + shadcn/ui + Radix UI
- **Estado**: React Query para gestión de estado del servidor
- **Mapas**: Leaflet para visualización geográfica
- **Formularios**: React Hook Form con validación Zod
- **Gráficos**: Recharts para visualizaciones

### Base de Datos
```
📋 Tablas Principales:
├── AlarmasHistorico    # Gestión principal de alarmas
├── Choferes           # Información de conductores
├── Dispositivos       # Dispositivos/vehículos
├── Anomalia          # Tipos de anomalías
└── Empresa           # Gestión de empresas
```

## 🛠️ Instalación y Configuración

### Prerrequisitos
- **Node.js**: v18.0.0 o superior
- **npm**: v8.0.0 o superior
- **SQL Server**: Base de datos configurada
- **AWS Account**: Para almacenamiento S3 (opcional)

### 1. Clonar el Repositorio
```bash
git clone [URL_DEL_REPOSITORIO]
cd sistema-de-transporte
```

### 2. Configuración del Backend
```bash
cd backend
npm install
```

Configurar variables de entorno en `.env`:
```env
DATABASE_URL="sqlserver://[usuario]:[contraseña]@[servidor]:[puerto];database=[nombre];schema=dbo;encrypt=true;trustServerCertificate=true"
JWT_SECRET="tu_jwt_secret_aqui"
AWS_ACCESS_KEY_ID="tu_aws_access_key"
AWS_SECRET_ACCESS_KEY="tu_aws_secret_key"
AWS_REGION="tu_region"
AWS_S3_BUCKET="tu_bucket_name"
```

Generar cliente Prisma:
```bash
npx prisma generate
```

### 3. Configuración del Frontend
```bash
cd frontend
npm install
```

Configurar variables de entorno en `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## 🚀 Ejecución del Proyecto

### Desarrollo
```bash
# Terminal 1 - Backend
cd backend
npm run dev          # Puerto 3001

# Terminal 2 - Frontend  
cd frontend
npm run dev          # Puerto 3000
```

### Producción
```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
npm start
```

## 📡 API Endpoints

### Alarmas
- `GET /api/alarmas` - Listar alarmas con filtros
- `GET /api/alarmas/:guid` - Detalle de alarma específica
- `PUT /api/alarmas/:guid/status` - Actualizar estado
- `PUT /api/alarmas/:guid/chofer` - Asignar conductor
- `PUT /api/alarmas/:guid/anomalia` - Asignar anomalía

### Conductores
- `GET /api/choferes` - Listar conductores
- `GET /api/choferes/:id` - Detalle de conductor
- `GET /api/choferes/:id/stats` - Estadísticas del conductor

### Dispositivos
- `GET /api/dispositivos` - Listar dispositivos
- `GET /api/dispositivos/:id` - Detalle de dispositivo
- `GET /api/dispositivos/:id/alarms` - Alarmas por dispositivo

### Dashboard
- `GET /api/dashboard/kpis` - Métricas principales
- `GET /api/dashboard/charts` - Datos para gráficos
- `GET /api/dashboard/rankings` - Rankings de performance

### Anomalías
- `GET /api/anomalias` - Listar tipos de anomalías

## 🔧 Scripts Disponibles

### Backend
```bash
npm run dev          # Desarrollo con hot reload
npm run build        # Compilar TypeScript
npm start            # Ejecutar build de producción
npx prisma generate  # Regenerar cliente Prisma
```

### Frontend
```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm start            # Servidor de producción
npm run lint         # Análisis de código
```

## 📊 Flujo de Datos

```
1. Alarma creada → Estado "Pendiente"
2. Revisión manual → "Sospechosa" o "Rechazada"
3. Si sospechosa → "Confirmada" (con anomalía) o "Rechazada"
4. Asignación de conductor en cualquier etapa
5. Todas las acciones soportan función deshacer
```

## 🛡️ Seguridad

- **Autenticación JWT**: Tokens seguros para sesiones
- **Validación de Entrada**: Validaciones con Zod
- **Sanitización**: Prevención de inyecciones SQL con Prisma
- **CORS Configurado**: Acceso controlado desde frontend
- **Variables de Entorno**: Configuración sensible protegida

## 🧪 Testing

```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm run lint
```

## 📁 Estructura del Proyecto

```
sistema-de-transporte/
├── backend/                 # API Express.js + TypeScript
│   ├── src/
│   │   ├── controllers/     # Lógica de controladores
│   │   ├── routes/         # Definición de rutas
│   │   ├── utils/          # Utilidades y helpers
│   │   └── config/         # Configuraciones
│   ├── prisma/             # Esquemas y migraciones
│   └── package.json
├── frontend/               # Next.js + React
│   ├── app/               # Pages con App Router
│   ├── components/        # Componentes reutilizables
│   ├── lib/              # Funciones utilitarias
│   ├── types/            # Definiciones TypeScript
│   └── package.json
└── README.md
```

## 🤝 Contribución

1. Fork del proyecto
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit de cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📝 Notas Importantes

⚠️ **Base de Datos de Producción**: NO utilizar `npx prisma migrate dev` o `npx prisma studio` ya que contiene datos de producción que no pueden ser eliminados.

✅ **Generación de Cliente**: Usar solo `npx prisma generate` después de cambios en el schema.

## 📄 Licencia

Este proyecto es de uso interno. Todos los derechos reservados.

## 📞 Soporte

Para soporte técnico y consultas, contactar al equipo de desarrollo.

---

**Desarrollado con ❤️ para la gestión eficiente de flotas de transporte**