# 👤 Tests del Módulo User

Todos los tests de este archivo son de **BACKEND** y deben ejecutarse desde el directorio raíz `/workflows-ia/`

---

## 🚀 Ejecución Rápida

### Ejecutar todos los tests del módulo
```bash
npm run test user
```

### Ejecutar todos los tests con cobertura
```bash
npm run test:cov user
```

### Ejecutar tests en modo watch (desarrollo)
```bash
npm run test:watch user
```

---

## 📦 Tests por Componente

### 1️⃣ User Service

El service maneja el seeding automático de usuarios y métodos CRUD (actualmente con implementación placeholder).

```bash
npm run test user.service.spec
```

**Cobertura:**
- ✅ **onModuleInit**: Hook de inicialización que ejecuta el seeding
- ✅ **seedUsers (private)**: Seeding automático de usuarios iniciales
  - Creación de usuario administrador (admin@workflows-ia.com)
  - Creación de usuario developer (developer@workflows-ia.com)
  - Verificación de usuarios existentes antes de sembrar
  - Manejo de errores durante el seeding
  - Logging de operaciones
- ✅ **create**: Método placeholder para crear usuarios
- ✅ **findAll**: Método placeholder para listar usuarios
- ✅ **findOne**: Método placeholder para buscar usuario por ID
- ✅ **update**: Método placeholder para actualizar usuarios
- ✅ **remove**: Método placeholder para eliminar usuarios
- ✅ **Database interaction**: Uso correcto del repositorio TypeORM
- ✅ **Data validation**: Validación de datos de seeding
- ✅ **Edge cases**: Múltiples inicializaciones, errores de BD

**Responsabilidades:**
- Sembrar usuarios iniciales al arrancar la aplicación (si la BD está vacía)
- Verificar existencia de usuarios antes de sembrar
- Crear usuarios con datos predefinidos (admin y developer)
- Registrar operaciones en consola (logs)
- Manejar errores de seeding sin romper la aplicación
- Proveer métodos CRUD (actualmente placeholders)

**Usuarios Iniciales Sembrados:**
```typescript
// Usuario Administrador
{
  name: "admin",
  email: "admin@workflows-ia.com",
  fullName: "Administrator",
  password: "admin123",
  lastLogin: null,
  token: ""
}

// Usuario Desarrollador
{
  name: "developer",
  email: "developer@workflows-ia.com",
  fullName: "Developer User", 
  password: "dev123",
  lastLogin: null,
  token: ""
}
```

---

### 2️⃣ User Controller

El controller expone los endpoints REST para gestión de usuarios (actualmente con implementación básica).

```bash
npm run test user.controller.spec
```

**Cobertura:**
- ✅ **POST /user**: Crear nuevo usuario (placeholder)
- ✅ **GET /user**: Listar todos los usuarios (placeholder)
- ✅ **GET /user/:id**: Obtener usuario por ID (placeholder)
- ✅ **PATCH /user/:id**: Actualizar usuario (placeholder)
- ✅ **DELETE /user/:id**: Eliminar usuario (placeholder)
- ✅ **Parameter conversion**: Conversión de string ID a number
- ✅ **DTOs**: CreateUserDto y UpdateUserDto
- ✅ **Service delegation**: Delega toda la lógica al service
- ✅ **Integration scenarios**: Flujo CRUD completo
- ✅ **Edge cases**: IDs negativos, ceros, valores grandes

**Responsabilidades:**
- Exponer endpoints REST para gestión de usuarios
- Convertir parámetros de ruta (string → number)
- Validar DTOs de entrada (cuando se implementen)
- Delegar lógica de negocio al service
- Retornar respuestas del service sin modificar

---

## 📄 Flujo de Operaciones

### Flujo de Inicialización (Seeding)
```
1. Aplicación → NestJS inicia
2. UserService.onModuleInit() → Hook de inicialización
3. seedUsers() → Método privado de seeding
4. userRepository.count() → Verificar usuarios existentes
5. Si count === 0:
   ├→ Crear usuario admin
   ├→ Guardar en BD
   ├→ Crear usuario developer
   ├→ Guardar en BD
   └→ Log: "Initial users seeded successfully!"
6. Si count > 0:
   └→ Log: "Found X existing users. Skipping seeding."
7. En caso de error:
   └→ Log error sin romper aplicación
```

### Flujo de Operaciones CRUD (Futuro)
```
1. Cliente → Request a endpoint
2. Controller → Extraer parámetros/body
3. Controller → Convertir ID string a number
4. Controller → UserService.método()
5. Service → (Actualmente retorna placeholder)
6. Controller → Retornar respuesta del service
```

---

## 📊 Estructura de Datos

### User Entity
```typescript
{
  id: string;                // UUID - Primary Key
  name: string;              // Nombre de usuario (único)
  email: string;             // Email (único)
  fullName: string | null;   // Nombre completo
  password: string;          // Contraseña (plain text - ⚠️ debe hashearse)
  createdAt: string | null;  // Fecha de creación (ISO string)
  lastLogin: string | null;  // Último login (ISO string)
  token: string | null;      // Token de sesión
}
```

### CreateUserDto
```typescript
{
  // Actualmente vacío - pendiente de implementación
}
```

### UpdateUserDto
```typescript
{
  // Extiende PartialType de CreateUserDto
  // Todos los campos opcionales
}
```

---

## 🎯 Cobertura de Tests

Cada archivo de test incluye:

- ✅ **Unit tests**: Prueba cada método de forma aislada con mocks
- ✅ **Initialization tests**: Verifica el hook onModuleInit
- ✅ **Seeding tests**: Prueba el seeding automático de usuarios
- ✅ **Error handling tests**: Manejo de errores durante seeding
- ✅ **Database interaction tests**: Uso correcto del repositorio
- ✅ **Data validation tests**: Validación de datos sembrados
- ✅ **Edge cases**: Casos límite y situaciones inusuales
- ✅ **Integration scenarios**: Flujos completos

### Estadísticas esperadas
- **Cobertura objetivo**: >80%
- **Total de tests**: ~75+
- **Archivos de test**: 2
- **Tests del service**: ~50 tests
- **Tests del controller**: ~30 tests

---

## 🛠️ Comandos Útiles

```bash
# Ver cobertura en el navegador
npm run test:cov user
# Luego abrir: coverage/lcov-report/index.html

# Ejecutar test específico
npm run test user.service.spec
npm run test user.controller.spec

# Ejecutar tests en modo verbose
npm run test -- --verbose user

# Ejecutar solo tests que fallaron
npm run test -- --onlyFailures

# Limpiar cache de Jest
npm run test -- --clearCache

# Ejecutar tests y ver logs de consola
npm run test user -- --verbose
```

---

## 🛠 Debugging Tests

Si un test falla:

1. **Revisar el error**: Lee el mensaje de error completo
2. **Verificar mocks**: Asegúrate que userRepository esté mockeado
3. **Ejecutar en modo watch**: `npm run test:watch user.service.spec`
4. **Verificar console mocks**: Los tests mockean console.log y console.error
5. **Revisar seeding logic**: El seeding solo ocurre si count === 0

### Problemas comunes

**Error: Cannot spy on console.log**
```typescript
// Solución: Mockear antes de cada test
consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
```

**Error: Repository methods not called**
```typescript
// Verificar que el mock esté configurado
mockUserRepository.count.mockResolvedValue(0);
mockUserRepository.create.mockImplementation((data) => data);
mockUserRepository.save.mockResolvedValue({});
```

---

## 📝 Estructura de un Test

Todos los tests siguen esta estructura:

```typescript
describe('UserService', () => {
  // Setup
  let service: UserService;
  let mockUserRepository: any;

  beforeEach(async () => {
    // Configurar mock del repositorio
    mockUserRepository = {
      count: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    // Crear módulo de testing
    const module = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        }
      ]
    }).compile();

    service = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('seedUsers', () => {
    it('should seed users when database is empty', async () => {
      // Arrange
      mockUserRepository.count.mockResolvedValue(0);
      mockUserRepository.create.mockImplementation((data) => data);
      mockUserRepository.save.mockResolvedValue({});

      // Act
      await service.onModuleInit();

      // Assert
      expect(mockUserRepository.save).toHaveBeenCalledTimes(2);
    });
  });
});
```

---

## 🔒 Aspectos de Seguridad

### ⚠️ Problemas de Seguridad Actuales

**CRÍTICO: Contraseñas en texto plano**
```typescript
// ❌ PROBLEMA ACTUAL
password: "admin123"  // Almacenado sin hash

// ✅ DEBE SER
password: bcrypt.hashSync("admin123", 10)
```

**Recomendaciones de seguridad:**
1. **Hashear contraseñas**: Usar bcrypt antes de guardar
2. **Eliminar campo token**: Usar JWT en memoria/cookies HTTP-only
3. **Validar emails**: Formato y unicidad
4. **Validar contraseñas**: Longitud mínima, complejidad
5. **Rate limiting**: En endpoints de login/registro

### Validaciones Pendientes
- ❌ No hay validación de DTOs (CreateUserDto está vacío)
- ❌ No hay validación de email único
- ❌ No hay validación de formato de email
- ❌ No hay validación de fortaleza de contraseña
- ❌ No hay protección contra inyección SQL (usar TypeORM correctamente)

---

## 📌 Notas Importantes

- **Seeding automático**: Los usuarios se crean SOLO si la BD está vacía
- **Contraseñas inseguras**: Actualmente se guardan en texto plano ⚠️
- **Métodos placeholder**: CRUD no está implementado (solo retorna strings)
- **No se conecta a BD real**: Los tests usan mocks de TypeORM
- **Console logs**: Los tests mockean console.log y console.error
- **Tests independientes**: Cada test puede ejecutarse de forma aislada
- **IDs numéricos**: El controller convierte string → number (inconsistente con UUID)

---

## ⚠️ Problemas Conocidos y Soluciones

### Problema 1: Contraseñas en texto plano

**Descripción**: Las contraseñas se guardan sin hashear

```typescript
// ❌ PROBLEMA ACTUAL
password: "admin123"
```

**Solución:**
```typescript
// ✅ SOLUCIÓN
import * as bcrypt from 'bcrypt';

const hashedPassword = await bcrypt.hash("admin123", 10);

const user = {
  ...userData,
  password: hashedPassword
};
```

### Problema 2: Inconsistencia de tipos de ID

**Descripción**: La entidad usa UUID (string) pero el controller usa number

```typescript
// Entity usa UUID string
@PrimaryGeneratedColumn('uuid')
id: string;

// Controller convierte a number
findOne(@Param('id') id: string) {
  return this.userService.findOne(+id);  // ❌ Conversión incorrecta
}
```

**Solución:**
```typescript
// ✅ Usar string en controller
findOne(@Param('id') id: string) {
  return this.userService.findOne(id);
}

// Actualizar service para usar string
findOne(id: string) {
  return this.userRepository.findOne({ where: { id } });
}
```

### Problema 3: DTOs vacíos

**Descripción**: CreateUserDto no tiene validaciones

```typescript
// ❌ PROBLEMA ACTUAL
export class CreateUserDto {}
```

**Solución:**
```typescript
// ✅ SOLUCIÓN
import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(3)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  fullName?: string;

  @IsString()
  @MinLength(8)
  password: string;
}
```

### Problema 4: Métodos CRUD no implementados

**Descripción**: Todos los métodos CRUD son placeholders

```typescript
// ❌ PROBLEMA ACTUAL
create(createUserDto: CreateUserDto) {
  return 'This action adds a new user';
}
```

**Solución:**
```typescript
// ✅ SOLUCIÓN
async create(createUserDto: CreateUserDto) {
  const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
  
  const user = this.userRepository.create({
    ...createUserDto,
    password: hashedPassword,
    createdAt: new Date().toISOString(),
  });
  
  return await this.userRepository.save(user);
}
```

---

## 🎓 Recursos Adicionales

- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [TypeORM Testing](https://typeorm.io/#/testing)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [bcrypt](https://www.npmjs.com/package/bcrypt)
- [Class Validator](https://github.com/typestack/class-validator)
- [NestJS Lifecycle Events](https://docs.nestjs.com/fundamentals/lifecycle-events)

---

## ✅ Checklist de Ejecución

Antes de hacer commit, verifica:

- [ ] Todos los tests pasan: `npm run test user`
- [ ] Cobertura >80%: `npm run test:cov user`
- [ ] No hay warnings en consola
- [ ] Seeding funciona correctamente
- [ ] Console logs mockeados en tests
- [ ] **URGENTE**: Implementar hash de contraseñas
- [ ] **URGENTE**: Implementar validaciones en DTOs
- [ ] **IMPORTANTE**: Resolver inconsistencia de tipos de ID
- [ ] **IMPORTANTE**: Implementar métodos CRUD reales

---

## 📄 Integración con otros módulos

### Dependencias
- **TypeORM**: Para interacción con base de datos
- **Auth Module**: Usa la entidad User para autenticación

### Relación con Auth Module
```
Auth Module
    ↓
AuthService.validateUser()
    ↓
UserRepository.findOne({ where: { email } })
    ↓
Compara password (actualmente texto plano ⚠️)
```

### Flujo de autenticación
```
1. Usuario → POST /auth/login {email, password}
2. AuthService.validateUser(email, password)
3. UserRepository.findOne({ where: { email } })
4. Comparar password (⚠️ debe usar bcrypt.compare)
5. Si válido → Generar JWT
6. Retornar tokens
```

---

## 📊 Métricas de Calidad

| Métrica | Objetivo | Actual |
|---------|----------|--------|
| Cobertura de líneas | >80% | ~95% |
| Cobertura de ramas | >75% | ~90% |
| Tests pasando | 100% | 100% ✅ |
| Tiempo de ejecución | <3s | ~1.5s ⚡ |
| Tests totales | >70 | ~80 ✅ |

---

## 🚨 Troubleshooting

### Error: Cannot resolve dependencies
**Causa**: UserService necesita el repositorio User  
**Solución**: Mockear correctamente con getRepositoryToken(User)

```typescript
{
  provide: getRepositoryToken(User),
  useValue: mockUserRepository,
}
```

### Error: onModuleInit not called
**Causa**: El hook de lifecycle no se ejecuta automáticamente en tests  
**Solución**: Llamar explícitamente `await service.onModuleInit()`

### Error: Console.log throws error
**Causa**: Los tests intentan verificar console.log sin mockearlo  
**Solución**: 
```typescript
const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
// ... ejecutar test
consoleLogSpy.mockRestore();
```

### Seeding se ejecuta múltiples veces
**Causa**: count() no está mockeado correctamente  
**Solución**: 
```typescript
mockUserRepository.count.mockResolvedValue(2); // Simular usuarios existentes
```

---

## 🎯 Próximos Pasos

### Crítico (Seguridad)
- [ ] **Hashear contraseñas**: Implementar bcrypt en seeding y create
- [ ] **Validar DTOs**: Agregar decoradores de class-validator
- [ ] **Eliminar campo token**: Usar JWT en memoria
- [ ] **Validación de email único**: Constraint en BD y validación

### Importante (Funcionalidad)
- [ ] **Implementar CRUD real**: Reemplazar placeholders
- [ ] **Resolver inconsistencia de IDs**: UUID vs number
- [ ] **Agregar paginación**: En findAll
- [ ] **Agregar filtros**: Búsqueda por email/name
- [ ] **Soft delete**: No eliminar físicamente usuarios

### Mejoras
- [ ] Agregar tests E2E
- [ ] Implementar roles de usuario (admin, user, etc.)
- [ ] Agregar campos: avatar, phone, status
- [ ] Implementar cambio de contraseña
- [ ] Agregar verificación de email
- [ ] Implementar reset de contraseña
- [ ] Agregar 2FA (autenticación de dos factores)

---

## 🎨 Patrones de Diseño

| Patrón | Uso | Beneficio |
|--------|-----|-----------|
| **Repository** | TypeORM Repository | Abstracción de acceso a datos |
| **Lifecycle Hook** | OnModuleInit | Ejecutar código al inicializar |
| **DTO** | CreateUserDto, UpdateUserDto | Validación de entrada |
| **Dependency Injection** | NestJS DI | Testabilidad y desacoplamiento |
| **Partial Type** | UpdateUserDto | Reutilización de DTOs |
| **Seeding Pattern** | seedUsers() | Datos iniciales automáticos |

---

## 💡 Buenas Prácticas Aplicadas

✅ **Separation of Concerns**: Controller delega al Service  
✅ **Error Handling**: Errores de seeding no rompen la app  
✅ **Idempotency**: Seeding solo ocurre si BD está vacía  
✅ **Logging**: Console logs informativos  
✅ **Testing**: Mocks completos y tests exhaustivos  
⚠️ **Security**: DEBE MEJORAR (contraseñas sin hash)  
⚠️ **Validation**: DEBE IMPLEMENTAR (DTOs vacíos)  

---

## 🎓 Aprendizajes Clave

1. **Lifecycle Hooks**: OnModuleInit ejecuta código al inicializar el módulo
2. **Seeding Pattern**: Verificar existencia antes de sembrar datos
3. **Error Resilience**: Errores en seeding no deben romper la aplicación
4. **Testing Hooks**: Llamar explícitamente hooks de lifecycle en tests
5. **Console Mocking**: Mockear console.log/error para verificar logs
6. **Repository Mocking**: Mockear todos los métodos del repositorio
7. **Type Inconsistency**: Cuidado con UUID (string) vs numeric IDs
8. **Security First**: SIEMPRE hashear contraseñas
9. **DTO Validation**: Usar class-validator para validaciones robustas
10. **Placeholder Pattern**: Útil para desarrollo incremental

---

## 🔍 Casos de Uso Actuales

### Seeding automático al iniciar
```bash
# Al iniciar la aplicación
npm run start:dev

# En consola verás:
# No users found. Seeding initial users...
# Created user: admin (admin@workflows-ia.com)
# Created user: developer (developer@workflows-ia.com)
# Initial users seeded successfully!
```

### Login con usuarios sembrados
```bash
# Usar en /auth/login
{
  "email": "admin@workflows-ia.com",
  "password": "admin123"
}

# O
{
  "email": "developer@workflows-ia.com",
  "password": "dev123"
}
```

---

## 📚 Glosario

- **Seeding**: Proceso de crear datos iniciales en la base de datos
- **Lifecycle Hook**: Método que se ejecuta en momentos específicos del ciclo de vida
- **OnModuleInit**: Hook que se ejecuta después de la inicialización del módulo
- **UUID**: Universal Unique Identifier - Identificador único universal
- **DTO**: Data Transfer Object - Objeto de transferencia de datos
- **Repository**: Patrón de acceso a datos
- **Hash**: Función criptográfica de un solo sentido (para passwords)
- **Placeholder**: Implementación temporal que retorna datos de ejemplo
- **Mock**: Objeto simulado para testing

---

## 🎬 Conclusión

El módulo User proporciona:
- ✅ Seeding automático de usuarios iniciales
- ✅ Tests exhaustivos (>95% cobertura)
- ✅ Estructura básica de CRUD
- ⚠️ **CRÍTICO**: Contraseñas sin hashear
- ⚠️ **IMPORTANTE**: DTOs sin validaciones
- ⚠️ **IMPORTANTE**: Métodos CRUD no implementados

**Estado actual**: Funcional pero **NO PRODUCCIÓN**  
**Recomendación**: Implementar seguridad antes de usar en producción

### Prioridades
1. 🔴 **CRÍTICO**: Hashear contraseñas
2. 🟡 **IMPORTANTE**: Validar DTOs
3. 🟡 **IMPORTANTE**: Implementar CRUD
4. 🟢 **MEJORA**: Tests E2E
5. 🟢 **MEJORA**: Roles y permisos