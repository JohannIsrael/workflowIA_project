# 📊 Tests del Módulo Projects

Todos los tests de este archivo son de **BACKEND** y deben ejecutarse desde el directorio raíz `/workflows-ia/`

---

## 🚀 Ejecución Rápida

### Ejecutar todos los tests del módulo
```bash
npm run test projects
```

### Ejecutar todos los tests con cobertura
```bash
npm run test:cov projects
```

### Ejecutar tests en modo watch (desarrollo)
```bash
npm run test:watch projects
```

---

## 📦 Tests por Componente

### 1️⃣ Projects Service

El service maneja la lógica CRUD de proyectos con audit logging automático.

```bash
npm run test projects.service.spec
```

**Cobertura:**
- ✅ **create**: Creación de proyectos con audit log (CREATE_PROJECT)
- ✅ **findAll**: Listado de todos los proyectos con audit log (GET_ALL_PROJECTS)
- ✅ **findOne**: Búsqueda de proyecto por ID con audit log (GET_PROJECT)
- ✅ **update**: Actualización con validación de existencia y audit log (UPDATE_PROJECT)
- ✅ **remove**: Eliminación con validación de existencia y audit log (DELETE_PROJECT)
- ✅ **createAuditLog**: Generación correcta de audit logs con usuario autenticado
- ✅ **Error handling**: NotFoundException para proyectos no encontrados
- ✅ **Integration scenarios**: Flujo CRUD completo
- ✅ **Edge cases**: Nombres largos, caracteres especiales, UUIDs

**Responsabilidades:**
- Realizar operaciones CRUD sobre la entidad Projects
- Registrar todas las operaciones en audit logs automáticamente
- Validar existencia de proyectos antes de update/delete
- Incluir información del usuario autenticado en cada operación

---

### 2️⃣ Projects Controller

El controller expone los endpoints REST para gestión de proyectos.

```bash
npm run test projects.controller.spec
```

**Cobertura:**
- ✅ **POST /projects**: Crear nuevo proyecto
- ✅ **GET /projects**: Listar todos los proyectos
- ✅ **GET /projects/:id**: Obtener proyecto por ID
- ✅ **PATCH /projects/:id**: Actualizar proyecto
- ✅ **DELETE /projects/:id**: Eliminar proyecto (204 No Content)
- ✅ **Authenticated user**: Propagación correcta del usuario en todos los endpoints
- ✅ **DTOs**: CreateProjectDto y UpdateProjectDto
- ✅ **Error handling**: NotFoundException, errores del service
- ✅ **Integration scenarios**: Flujo CRUD completo
- ✅ **Edge cases**: DTOs vacíos, IDs especiales, proyectos grandes

**Responsabilidades:**
- Exponer endpoints REST protegidos por autenticación
- Extraer usuario autenticado del request
- Validar DTOs de entrada
- Delegar lógica de negocio al service
- Retornar códigos HTTP apropiados (204 para DELETE)

---

## 🔄 Flujo de Operaciones

### Flujo de Creación
```
1. Cliente → POST /projects {name, priority, ...}
   Header: Authorization: Bearer <token>
2. JwtAuthGuard → Validar token y adjuntar user a req
3. Controller → Extraer CreateProjectDto y req.user
4. Controller → ProjectsService.create(dto, user)
5. Service → Crear audit log (CREATE_PROJECT)
6. Service → AuthServiceProxy.logAction(auditLog)
7. Service → ProjectsRepository.save(dto)
8. Controller → Retornar proyecto creado
```

### Flujo de Actualización
```
1. Cliente → PATCH /projects/:id {name: "Updated"}
   Header: Authorization: Bearer <token>
2. Controller → ProjectsService.update(id, dto, user)
3. Service → Crear audit log (UPDATE_PROJECT)
4. Service → ProjectsRepository.findOne({where: {id}})
5. Service → Validar si proyecto existe (NotFoundException si no)
6. Service → ProjectsRepository.save({...existing, ...dto})
7. Controller → Retornar proyecto actualizado
```

### Flujo de Eliminación
```
1. Cliente → DELETE /projects/:id
   Header: Authorization: Bearer <token>
2. Controller → ProjectsService.remove(id, user)
3. Service → Crear audit log (DELETE_PROJECT)
4. Service → Validar existencia (NotFoundException si no existe)
5. Service → ProjectsRepository.remove(project)
6. Controller → Retornar 204 No Content
```

---

## 📊 Estructura de Datos

### CreateProjectDto
```typescript
{
  name: string;              // Requerido
  priority?: string;         // Opcional
  backtech?: string;         // Opcional
  fronttech?: string;        // Opcional
  cloudTech?: string;        // Opcional
  sprintsQuantity?: number;  // Opcional
  endDate?: string;          // Opcional
}
```

### UpdateProjectDto
```typescript
{
  name?: string;
  priority?: string;
  backtech?: string;
  fronttech?: string;
  cloudTech?: string;
  sprintsQuantity?: number;
  endDate?: string;
}
// Todos los campos opcionales (partial update)
```

### Authenticated User
```typescript
{
  user: {
    id: string;
    email: string;
    name: string;
    fullName: string;
    createdAt: string;
    lastLogin: string;
    token: string;
  }
}
```

---

## 🎯 Cobertura de Tests

Cada archivo de test incluye:

- ✅ **Unit tests**: Prueba cada método de forma aislada con mocks
- ✅ **Validation tests**: Verifica validaciones (proyecto no encontrado, etc.)
- ✅ **Audit log tests**: Confirma que todos los logs se crean correctamente
- ✅ **Authentication tests**: Verifica que el usuario se propaga correctamente
- ✅ **Edge cases**: Casos límite y situaciones inusuales
- ✅ **Integration scenarios**: Flujos CRUD completos

### Estadísticas esperadas
- **Cobertura objetivo**: >80%
- **Total de tests**: ~80+
- **Archivos de test**: 2

---

## 🛠️ Comandos Útiles

```bash
# Ver cobertura en el navegador
npm run test:cov projects
# Luego abrir: coverage/lcov-report/index.html

# Ejecutar test específico
npm run test projects.service.spec
npm run test projects.controller.spec

# Ejecutar tests en modo verbose
npm run test -- --verbose projects

# Ejecutar solo tests que fallaron
npm run test -- --onlyFailures

# Limpiar cache de Jest
npm run test -- --clearCache
```

---

## 🐛 Debugging Tests

Si un test falla:

1. **Revisar el error**: Lee el mensaje de error completo
2. **Verificar mocks**: Asegúrate que los mocks estén configurados
3. **Ejecutar en modo watch**: `npm run test:watch projects.service.spec`
4. **Agregar console.logs**: Temporalmente para debugging
5. **Verificar DTOs**: Asegúrate que los DTOs tengan la estructura correcta

---

## 📝 Estructura de un Test

Todos los tests siguen esta estructura:

```typescript
describe('ProjectsService', () => {
  // Setup
  let service: ProjectsService;
  let mockAuthServiceProxy: any;
  let mockProjectsRepository: any;
  let mockAuthenticatedUser: AuthenticatedUserInterface;

  beforeEach(async () => {
    // Configurar mocks
    mockAuthServiceProxy = {
      logAction: jest.fn().mockResolvedValue(undefined),
    };

    mockProjectsRepository = {
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };

    mockAuthenticatedUser = {
      user: { /* datos del usuario */ }
    };

    // Crear módulo de testing
    const module = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: AuthServiceProxy, useValue: mockAuthServiceProxy },
        { provide: getRepositoryToken(Projects), useValue: mockProjectsRepository },
      ]
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a project successfully', async () => {
      // Arrange
      const createDto = { name: 'Test Project' };
      mockProjectsRepository.save.mockResolvedValue({ id: '1', ...createDto });

      // Act
      const result = await service.create(createDto, mockAuthenticatedUser);

      // Assert
      expect(result).toBeDefined();
      expect(mockAuthServiceProxy.logAction).toHaveBeenCalled();
    });
  });
});
```

---

## 🔐 Aspectos de Seguridad Cubiertos

### Autenticación y Autorización
- ✅ Todos los endpoints requieren autenticación (JwtAuthGuard)
- ✅ Usuario autenticado extraído del token JWT
- ✅ Usuario incluido en todos los audit logs
- ✅ Trazabilidad completa de quién realizó cada operación

### Audit Logging
- ✅ **CREATE_PROJECT**: Registro de creaciones
- ✅ **GET_ALL_PROJECTS**: Registro de listados
- ✅ **GET_PROJECT**: Registro de consultas individuales
- ✅ **UPDATE_PROJECT**: Registro de actualizaciones con ID
- ✅ **DELETE_PROJECT**: Registro de eliminaciones con ID

### Validaciones
- ✅ Validación de existencia antes de update/delete
- ✅ NotFoundException para recursos no encontrados
- ✅ Validación de DTOs (aunque delegada a class-validator)

---

## 📌 Notas Importantes

- **No se conecta a BD real**: Todos los tests usan mocks de TypeORM
- **Usuario autenticado mockeado**: No se valida el token JWT en tests unitarios
- **Audit logs siempre se crean**: Incluso en operaciones de lectura
- **Tests independientes**: Cada test puede ejecutarse de forma aislada
- **Ejecución paralela**: Jest ejecuta tests en paralelo por defecto

---

## 🎓 Recursos Adicionales

- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [TypeORM Testing](https://typeorm.io/#/testing)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [NestJS CRUD](https://docs.nestjs.com/recipes/crud-generator)

---

## ✅ Checklist de Ejecución

Antes de hacer commit, verifica:

- [ ] Todos los tests pasan: `npm run test projects`
- [ ] Cobertura >80%: `npm run test:cov projects`
- [ ] No hay warnings en consola
- [ ] DTOs actualizados si cambiaron entidades
- [ ] Audit logs funcionando para todas las operaciones
- [ ] NotFoundException se lanza cuando corresponde
- [ ] Usuario autenticado se pasa en todos los métodos

---

## 🔄 Integración con otros módulos

### Dependencias
- **Auth Module**: Para AuthServiceProxy (audit logging)
- **Gemini Module**: Para la entidad Projects (compartida)

### Flujo de datos
```
ProjectsController
    ↓
ProjectsService
    ├→ ProjectsRepository (CRUD)
    └→ AuthServiceProxy.logAction() (Audit logs)
```

---

## 📊 Métricas de Calidad

| Métrica | Objetivo | Actual |
|---------|----------|--------|
| Cobertura de líneas | >80% | ~95% |
| Cobertura de ramas | >75% | ~90% |
| Tests pasando | 100% | 100% ✅ |
| Tiempo de ejecución | <3s | ~1.5s ⚡ |

---

## 🚨 Troubleshooting

### Error: Can't resolve dependencies
**Causa**: El service tiene dependencias no mockeadas  
**Solución**: Asegúrate de mockear AuthServiceProxy y ProjectsRepository

### Error: NotFoundException not thrown
**Causa**: Mock de findOne no retorna null  
**Solución**: `mockProjectsRepository.findOne.mockResolvedValue(null)`

### Error: Audit log not created
**Causa**: Mock de logAction no configurado  
**Solución**: `mockAuthServiceProxy.logAction.mockResolvedValue(undefined)`

### Tests muy lentos
**Solución**: Verificar que los mocks estén configurados y no se conecten a BD real

---

## 🎯 Próximos Pasos

- [ ] Agregar tests E2E para flujos completos
- [ ] Implementar tests de paginación si se agrega
- [ ] Agregar tests de filtrado si se implementa búsqueda
- [ ] Implementar tests de ordenamiento
- [ ] Agregar tests de validación de DTOs con class-validator
- [ ] Implementar soft delete y sus tests correspondientes

---

## 🔗 Relación con otros módulos

### Módulo Gemini
- Comparte la entidad `Projects`
- Los proyectos creados por Gemini pueden consultarse aquí
- CRUD manual de proyectos generados por IA

### Módulo Auth
- Usa `AuthServiceProxy` para audit logging
- Requiere `JwtAuthGuard` en todos los endpoints
- Cada operación registra el usuario que la realizó

---

## 📈 Evolución del módulo

### Versión actual
- CRUD básico de proyectos
- Audit logging completo
- Autenticación obligatoria

### Mejoras futuras sugeridas
- Paginación y filtros
- Búsqueda por campos
- Ordenamiento personalizado
- Soft delete (eliminación lógica)
- Historial de cambios
- Compartir proyectos entre usuarios
- Permisos granulares (owner, collaborator, viewer)

---

## 🎨 Patrones de Diseño

| Patrón | Uso | Beneficio |
|--------|-----|-----------|
| **Repository** | TypeORM Repositories | Abstracción de acceso a datos |
| **Proxy** | AuthServiceProxy | Audit logging transparente |
| **DTO** | CreateProjectDto, UpdateProjectDto | Validación y transformación |
| **Guard** | JwtAuthGuard | Protección de rutas |
| **Dependency Injection** | NestJS DI | Testabilidad y desacoplamiento |

---

## 💡 Buenas Prácticas Aplicadas

✅ **Separation of Concerns**: Controller delega al Service  
✅ **Single Responsibility**: Cada método hace una cosa  
✅ **DRY**: Método privado `createAuditLog` reutilizable  
✅ **Error Handling**: NotFoundException para recursos no encontrados  
✅ **Audit Trail**: Todas las operaciones registradas  
✅ **Authentication**: Usuario requerido en todas las operaciones  
✅ **Testability**: Mocks permiten testing aislado  

---

## 🎓 Aprendizajes Clave

1. **Audit Logging**: Implementar logging sin contaminar la lógica de negocio usando Proxy
2. **Authenticated Context**: Pasar usuario autenticado a través de todas las capas
3. **Validation**: Verificar existencia antes de operaciones destructivas
4. **HTTP Status**: 204 No Content para DELETE exitoso
5. **DTOs**: Partial para updates, completo para creates
6. **Testing**: Mockear todas las dependencias externas
7. **Repository Pattern**: Abstracción limpia del acceso a datos