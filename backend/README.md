# 🔄 PwnDoc Backend - Refactorización Clean Architecture

## Resumen

Backend de PwnDoc refactorizado con arquitectura de capas separadas, implementando:
- Separación de responsabilidades (Routes → Controllers → Services)
- Middlewares centralizados (Auth, ACL, Validación, Errores)
- 3 módulos nuevos para ACGII (Procedures, Status, Verification)
- 144 endpoints API REST

---

##  Arquitectura

### Estructura de Directorios

```
backend/
├── src/
│   ├── routes/           # Definición de endpoints HTTP
│   ├── controllers/      # Manejo de requests/responses
│   ├── services/         # Lógica de negocio
│   ├── middlewares/      # Auth, ACL, validación, errores
│   ├── models/           # Schemas de MongoDB
│   ├── utils/            # Helpers (httpResponse, etc)
│   ├── config/           # Configuraciones
│   ├── socket/           # WebSocket handlers
│   ├── translate/        # i18n
│   └── lib/              # Librerías legacy
├── tests/                # Tests unitarios e integración
└── docs/                 # Documentación API (Swagger)
```

### Flujo de Request

```
Request → Route → Middlewares → Controller → Service → Model → Database
                     ↓
        [Auth, ACL, Validación, Error Handler]
```

---

## 📦 Capas de la Aplicación

### 1. Routes (Definición de Endpoints)
**Responsabilidad:** Definir rutas HTTP y aplicar middlewares

**Ejemplo:**
```javascript
// src/routes/user.routes.js
router.post('/login',
    validateJoi(userSchemas.login),     // Validación
    asyncHandler(UserController.login)  // Controller
);
```

**Archivos:**
- `user.routes.js` - Usuarios y autenticación
- `audit.routes.js` - Auditorías
- `client.routes.js` - Clientes
- `company.routes.js` - Empresas
- `vulnerability.routes.js` - Vulnerabilidades
- `template.routes.js` - Plantillas
- `backup.routes.js` - Backups
- `settings.routes.js` - Configuración
- `data.routes.js` - Data maestro
- `image.routes.js` - Gestión de imágenes
- **`audit-procedure.routes.js`** - Procedimientos ACGII ⭐
- **`audit-status.routes.js`** - Estados ACGII ⭐
- **`audit-verification.routes.js`** - Verificaciones ACGII ⭐

---

### 2. Controllers (Manejo HTTP)
**Responsabilidad:** Manejar requests/responses HTTP, validar entrada, llamar servicios

**Ejemplo:**
```javascript
// src/controllers/user.controller.js
async login(req, res) {
    const Response = require('../utils/httpResponse');
    const { username, password } = req.body;
    
    const result = await UserService.authenticate(username, password);
    Response.Ok(res, result);
}
```

**Características:**
- ✅ Sin lógica de negocio
- ✅ Llaman a services
- ✅ Manejan respuestas HTTP con `Response` helper
- ✅ Error handling con `asyncHandler`

---

### 3. Services (Lógica de Negocio)
**Responsabilidad:** Implementar toda la lógica de negocio

**Ejemplo:**
```javascript
// src/services/user.service.js
class UserService {
    static async authenticate(username, password) {
        const user = await User.findOne({ username });
        if (!user) throw { fn: 'Unauthorized', message: 'Invalid credentials' };
        
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) throw { fn: 'Unauthorized', message: 'Invalid credentials' };
        
        const token = jwt.sign({ userId: user._id, role: user.role }, jwtSecret);
        return { token, user };
    }
}
```

**Servicios disponibles:**
- `UserService` - Gestión de usuarios
- `AuditService` - Gestión de auditorías
- `ClientService` - Gestión de clientes
- `VulnerabilityService` - Gestión de vulnerabilidades
- **`AuditProcedureService`** - Procedimientos ACGII ⭐
- **`AuditStatusService`** - Estados ACGII ⭐
- **`AuditVerificationService`** - Verificaciones ACGII ⭐

---

### 4. Middlewares (Cross-cutting Concerns)

#### Auth Middleware (`auth.middleware.js`)
```javascript
// Verificar token JWT
verifyToken(req, res, next)

// Verificar refresh token
verifyRefreshToken(req, res, next)
```

#### ACL Middleware (`acl.middleware.js`)
```javascript
// Verificar permisos
acl.hasPermission('users:create')

// Roles disponibles
- admin: Todos los permisos
- user: Permisos limitados
```

#### Error Middleware (`error.middleware.js`)
```javascript
// Async handler para controllers
asyncHandler(controllerMethod)

// Error handler global
errorHandler(err, req, res, next)

// 404 handler
notFoundHandler(req, res)
```

#### Validation Middleware (`validation.middleware.js`)
```javascript
// Validación con Joi
validateJoi(schema)

// Validación básica
validateBody({ required: ['email', 'password'] })
```

---

### 5. Models (Schemas MongoDB)

**Ejemplo:**
```javascript
// src/models/user.model.js
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String, required: true },
    role: { type: String, default: 'user' },
    enabled: { type: Boolean, default: true }
});
```

**Modelos disponibles:**
- `User` - Usuarios
- `Audit` - Auditorías
- `Client` - Clientes
- `Company` - Empresas
- `Vulnerability` - Vulnerabilidades
- `Template` - Plantillas
- **`AuditProcedure`** - Procedimientos ACGII ⭐
- **`AuditStatus`** - Estados ACGII ⭐
- **`AuditVerification`** - Verificaciones ACGII ⭐

---

### 6. Utils (Helpers)

#### httpResponse.js
```javascript
Response.Ok(res, data)              // 200
Response.Created(res, data)          // 201
Response.BadParameters(res, msg)     // 400
Response.Unauthorized(res, msg)      // 401
Response.Forbidden(res, msg)         // 403
Response.NotFound(res, msg)          // 404
Response.Internal(res, err)          // 500
```

---

## 🆕 Módulos ACGII

### 1. Audit Procedures (16 endpoints)
**Propósito:** Gestión de procedimientos de auditoría para ACGII

**Endpoints principales:**
```
GET    /api/audit-procedures                    - Listar
POST   /api/audit-procedures                    - Crear
GET    /api/audit-procedures/:id                - Obtener
PUT    /api/audit-procedures/:id                - Actualizar
DELETE /api/audit-procedures/:id                - Eliminar
PUT    /api/audit-procedures/:id/informe        - Actualizar informe
PUT    /api/audit-procedures/:id/instructivo    - Actualizar instructivo
GET    /api/audit-procedures/audit/:auditId     - Por auditoría
GET    /api/audit-procedures/stats              - Estadísticas
```

### 2. Audit Status (10 endpoints)
**Propósito:** Seguimiento de estados de auditorías

**Endpoints principales:**
```
GET    /api/audit-status                           - Listar
POST   /api/audit-status                           - Crear
GET    /api/audit-status/audit/:auditId            - Por auditoría
GET    /api/audit-status/audit/:auditId/history    - Historial
GET    /api/audit-status/stats                     - Estadísticas
```

### 3. Audit Verification (12 endpoints)
**Propósito:** Verificación de hallazgos reportados

**Endpoints principales:**
```
GET    /api/audit-verification                    - Listar
POST   /api/audit-verification                    - Crear
POST   /api/audit-verification/:id/finalize       - Finalizar
POST   /api/audit-verification/:id/findings       - Agregar hallazgo
PUT    /api/audit-verification/:id/findings/:fId  - Actualizar hallazgo
GET    /api/audit-verification/stats              - Estadísticas
```

---

## Instalación y Uso

### Requisitos
- Node.js 14+
- MongoDB 4.4+
- npm o yarn

### Instalación
```bash
cd backend
npm install
```

### Configuración
Crear archivo `.env` o configurar `src/config/config.json`:

```json
{
  "dev": {
    "port": 8443,
    "host": "0.0.0.0",
    "database": {
      "server": "localhost",
      "port": 27017,
      "name": "pwndoc"
    },
    "jwtSecret": "auto-generated",
    "jwtRefreshSecret": "auto-generated"
  }
}
```

### Ejecución

```bash
# Desarrollo
npm start

# Producción
NODE_ENV=production npm start

# Tests (pendiente de actualización)
npm test
```

---

## Estadísticas

### Endpoints por Módulo
```
Users & Auth:          17 endpoints
Audits:                29 endpoints
Audit Procedures:      16 endpoints ⭐
Audit Status:          10 endpoints ⭐
Audit Verification:    12 endpoints ⭐
Clients:                5 endpoints
Companies:              4 endpoints
Vulnerabilities:        9 endpoints
Templates:              6 endpoints
Backups:                9 endpoints
Settings:               4 endpoints
Data (Languages, etc): 20 endpoints
Images:                 3 endpoints
────────────────────────────────────
TOTAL:                144 endpoints
```

### Reducción de Código
```
Routes originales:  2,848 líneas
Routes refactorizadas: 1,367 líneas
Reducción:          52% ✅
```

---

## Autenticación y Autorización

### Sistema de Permisos

**Roles:**
- `admin` - Acceso total (wildcard `*`)
- `user` - Permisos específicos definidos

**Formato de permisos:**
```
<recurso>:<acción>

Ejemplos:
- users:create
- audits:read
- audits:update
- clients:delete
```

### Uso en Rutas:
```javascript
router.post('/users',
    verifyToken,                        // 1. Verificar token
    acl.hasPermission('users:create'),  // 2. Verificar permiso
    asyncHandler(UserController.create) // 3. Ejecutar
);
```

---

## Testing

### Estado Actual
```
Tests legacy:   165 tests (136 fallando)
Motivo:         Tests no actualizados post-refactorización
Estado:         Pospuesto para fase futura
```

### Testing Manual
Usar Postman collection actualizada:
- `PwnDoc_API_COMPLETA.json` - 149 endpoints documentados
- Incluye ejemplos de request/response
- Variables de entorno configurables

---

##  Documentación

### Postman Collection
- **Archivo:** `PwnDoc_API_COMPLETA.json`
- **Endpoints:** 149
- **Organización:** 14 carpetas por módulo
- **Incluye:** Ejemplos, variables, tests

### Swagger (Legacy)
- **URL:** `http://localhost:8443/api-docs`
- **Estado:** Requiere actualización con endpoints ACGII

---

## 🔄 Comparación: Original vs Refactorizado

### Original (PwnDoc 1.3.2)
```
✅ Funcionaba bien
❌ Lógica mezclada en routes
❌ Sin separación de capas
❌ Difícil de mantener
❌ Difícil de testear
```

### Refactorizado
```
 Arquitectura limpia (Routes → Controllers → Services)
 Middlewares centralizados
 Código 52% más reducido
 Fácil de mantener
 Fácil de testear
 38 endpoints nuevos (ACGII)
```

---

## Roadmap

### Completado (Fases 1-2)
- [x] Refactorización a Clean Architecture
- [x] Middlewares centralizados
- [x] 3 módulos ACGII implementados
- [x] Reducción de código 52%
- [x] Documentación Postman actualizada

### 🔄 En Progreso (Fase 3)
- [ ] Documentación completa
- [x] README actualizado

### Futuro (Fase 4+)
- [ ] Actualizar tests legacy
- [ ] Tests para módulos ACGII
- [ ] CI/CD pipeline
- [ ] Swagger actualizado
- [ ] Migración de frontend a React

---

## 👥 Contribución

### Estructura de Commits
```
feat: Agregar nuevo endpoint X
fix: Corregir bug en Y
refactor: Mejorar estructura de Z
docs: Actualizar documentación
```

### Agregar Nuevo Endpoint

1. **Definir modelo** (si es necesario)
```javascript
// src/models/ejemplo.model.js
const ejemploSchema = new mongoose.Schema({...});
module.exports = mongoose.model('Ejemplo', ejemploSchema);
```

2. **Crear service**
```javascript
// src/services/ejemplo.service.js
class EjemploService {
    static async create(data) {
        return await Ejemplo.create(data);
    }
}
module.exports = EjemploService;
```

3. **Crear controller**
```javascript
// src/controllers/ejemplo.controller.js
class EjemploController {
    static async create(req, res) {
        const result = await EjemploService.create(req.body);
        Response.Created(res, result);
    }
}
module.exports = EjemploController;
```

4. **Definir route**
```javascript
// src/routes/ejemplo.routes.js
router.post('/',
    verifyToken,
    acl.hasPermission('ejemplo:create'),
    asyncHandler(EjemploController.create)
);
```

5. **Registrar route**
```javascript
// src/routes/index.js
app.use('/api/ejemplo', require('./ejemplo.routes'));
```

---

## Soporte

Para dudas sobre la refactorización o implementación:
1. Revisar este README
2. Revisar Postman collection
3. Revisar código de ejemplos existentes

---

## Notas Finales

### Decisiones de Diseño

1. **¿Por qué no usar TypeScript?**
   - Mantener compatibilidad con código original
   - Migración incremental más fácil
   - Equipo ya familiarizado con JavaScript

2. **¿Por qué no usar repository pattern?**
   - Mongoose ya provee abstracción suficiente
   - YAGNI (You Ain't Gonna Need It)
   - Simplificar arquitectura

3. **¿Por qué posponer tests?**
   - Backend funcional tiene prioridad
   - Tests legacy necesitan reescritura completa
   - Mejor escribir tests con código estable

### Próximos Pasos

1. ✅ Completar documentación
2. 🔄 Migrar frontend a React
3. ⏸️ Actualizar tests (cuando código esté 100% estable)

---

**Versión Backend:** 2.0.0 (Refactorizado)  
**Fecha última actualización:** 2025-01-07  
**Mantenido por:** Fabian Rieral Condori LLanos


# Installation for developpment environnment

*Source code can be modified live and application will automatically reload on changes.*

Build and run Docker containers
```
docker-compose -f ./docker-compose.dev.yml up -d --build
```

Display container logs
```
docker-compose logs -f
```

Stop/Start container
```
docker-compose stop
docker-compose start
```

API is accessible through https://localhost:5252/api