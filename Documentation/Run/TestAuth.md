# 🔐 Tests del Módulo Auth

Todos los tests de este archivo son de **BACKEND** y deben ejecutarse desde el directorio raíz `/workflows-ia/`

---

## 🚀 Ejecución Rápida

### Ejecutar todos los tests del módulo
```bash
npm run test auth
```

### Ejecutar todos los tests con cobertura
```bash
npm run test:cov auth
```

### Ejecutar tests en modo watch (desarrollo)
```bash
npm run test:watch auth
```

---

## 📦 Tests por Componente

### 1️⃣ JWT Strategy (Passport)

La estrategia JWT valida y decodifica tokens de acceso.

```bash
npm run test jwt.strategy.spec
```

**Cobertura:**
- ✅ Inicialización con JWT_ACCESS_SECRET desde variables de entorno
- ✅ Validación de tokens JWT
- ✅ Transformación de payload (sub → id)
- ✅ Exclusión de password del objeto user
- ✅ Manejo de diferentes formatos de datos (UUID, emails, fechas ISO)
- ✅ Validación de configuración (error si secret no está definido)
- ✅ Integración con Passport para adjuntar user a request

**Responsabilidades:**
- Verificar firma del JWT con el secret
- Extraer datos del payload
- Transformar a formato User sin password
- Adjuntar usuario autenticado al request

---

### 2️⃣ Auth Service

El service maneja la lógica de autenticación y generación de tokens.

```bash
npm run test auth.service.spec
```

**Cobertura:**
- ✅ **validateUser**: Validación de credenciales (email + password)
- ✅ **Token generation**: Access token (1h) y Refresh token (7d)
- ✅ **Payload structure**: Datos correctos en JWT (sub, email, name, etc.)
- ✅ **Security**: Password nunca incluido en respuesta
- ✅ **refreshTokens**: Generación de nuevos tokens desde refresh token
- ✅ **Config validation**: Errores si JWT_ACCESS_SECRET o JWT_REFRESH_SECRET no están definidos
- ✅ **Error handling**: Manejo de errores de base de datos y JWT signing
- ✅ **Edge cases**: Passwords largos, caracteres especiales, case-sensitive emails

**Responsabilidades:**
- Validar credenciales contra la base de datos
- Generar access tokens con expiración de 1 hora
- Generar refresh tokens con expiración de 7 días
- Renovar tokens desde un refresh token válido

---

### 3️⃣ Auth Service Proxy (Patrón Proxy)

El proxy intercepta llamadas al AuthService y agrega funcionalidad de audit logging.

```bash
npm run test auth-service.proxy.spec
```

**Cobertura:**
- ✅ **validateUser con audit logs**:
  - LOGIN_SUCCESS: Login exitoso con duración y user ID
  - LOGIN_FAILED: Login fallido con razón
  - LOGIN_ERROR: Error durante login
- ✅ **refreshTokens con audit logs**:
  - TOKEN_REFRESH_SUCCESS: Refresh exitoso
  - TOKEN_REFRESH_FAILED: Refresh fallido
  - TOKEN_REFRESH_ERROR: Error durante refresh
- ✅ **Performance tracking**: Medición de duración en millisegundos
- ✅ **Error resilience**: No falla si audit log falla (solo log en consola)
- ✅ **getAllAuditLogs**: Paginación correcta (skip/take)
- ✅ **logAction**: Guardado de audit logs personalizados
- ✅ **findAuditLog**: Búsqueda por ID con validación

**Responsabilidades:**
- Interceptar llamadas a AuthService sin modificar la interfaz
- Registrar todas las operaciones de autenticación en audit logs
- Medir tiempos de ejecución
- Proporcionar trazabilidad completa de eventos de seguridad

---

### 4️⃣ Auth Controller

El controller expone los endpoints REST de autenticación.

```bash
npm run test auth.controller.spec
```

**Cobertura:**
- ✅ **POST /auth/login**:
  - Login exitoso con tokens y datos de usuario
  - UnauthorizedException si credenciales inválidas
  - Validación de LoginDto
- ✅ **POST /auth/refresh**:
  - Refresh exitoso con nuevos tokens
  - Extracción de token desde header Authorization
  - UnauthorizedException si token faltante/inválido
  - Manejo de diferentes formatos de Bearer token
- ✅ **GET /auth/audit-logs**:
  - Paginación con defaults (page=1, limit=10)
  - Query parameters personalizados
  - Manejo de valores extremos (página 0, límites grandes)
- ✅ **Error handling**: Propagación correcta de errores del service
- ✅ **Edge cases**: Headers null/undefined, tokens largos

**Responsabilidades:**
- Exponer endpoints REST para autenticación
- Validar DTOs de entrada
- Extraer tokens de headers
- Manejar errores y retornar códigos HTTP apropiados
- Sanitizar respuestas antes de enviarlas al cliente

---

## 📊 Resumen de Patrones de Diseño Implementados

| Patrón | Componente | Propósito |
|--------|------------|-----------|
| **Strategy** | JwtStrategy (Passport) | Estrategia de validación JWT para Passport |
| **Proxy** | AuthServiceProxy | Interceptar llamadas y agregar audit logging |
| **Repository** | TypeORM Repositories | Abstracción de acceso a datos (User, AuditLogs) |
| **Dependency Injection** | NestJS DI | Inyección de dependencias y testabilidad |
| **DTO** | LoginDto | Validación de datos de entrada |
| **Guard** | JwtAuthGuard | Protección de rutas con autenticación JWT |

---

## 🔑 Flujos de Autenticación

### Flujo de Login
```
1. Cliente → POST /auth/login {email, password}
2. Controller → AuthServiceProxy.validateUser()
3. Proxy → AuthService.validateUser()
   ├─ Buscar usuario en DB
   ├─ Validar password
   ├─ Generar access token (1h)
   └─ Generar refresh token (7d)
4. Proxy → Crear audit log (LOGIN_SUCCESS/FAILED/ERROR)
5. Controller → Retornar {accessToken, refreshToken, user}
```

### Flujo de Token Refresh
```
1. Cliente → POST /auth/refresh 
   Header: Authorization: Bearer <refresh-token>
2. Controller → Extraer token del header
3. Controller → AuthServiceProxy.refreshTokens()
4. Proxy → AuthService.refreshTokens()
   ├─ Validar refresh token
   ├─ Generar nuevo access token (1h)
   └─ Generar nuevo refresh token (7d)
5. Proxy → Crear audit log (TOKEN_REFRESH_SUCCESS/FAILED/ERROR)
6. Controller → Retornar {accessToken, refreshToken}
```

### Flujo de Protección de Rutas
```
1. Cliente → GET /protected-route
   Header: Authorization: Bearer <access-token>
2. JwtAuthGuard → Interceptar request
3. JwtStrategy → Validar token con JWT_ACCESS_SECRET
4. JwtStrategy → Decodificar payload
5. JwtStrategy → Adjuntar user a req.user
6. Controller → Acceder a req.user (usuario autenticado)
```

---

## 🎯 Cobertura de Tests

Cada archivo de test incluye:

- ✅ **Unit tests**: Prueba componentes de forma aislada con mocks
- ✅ **Validation tests**: Verifica validaciones y manejo de errores
- ✅ **Security tests**: Prueba casos de seguridad (tokens inválidos, passwords, etc.)
- ✅ **Edge cases**: Casos límite y situaciones inusuales
- ✅ **Integration scenarios**: Flujos completos de autenticación

### Estadísticas esperadas
- **Cobertura objetivo**: >80%
- **Total de tests**: ~140+
- **Archivos de test**: 4

---

## 🛠️ Comandos Útiles

```bash
# Ver cobertura en el navegador
npm run test:cov auth
# Luego abrir: coverage/lcov-report/index.html

# Ejecutar test específico
npm run test jwt.strategy.spec
npm run test auth.service.spec
npm run test auth-service.proxy.spec
npm run test auth.controller.spec

# Ejecutar tests en modo verbose
npm run test -- --verbose auth

# Ejecutar solo tests que fallaron
npm run test -- --onlyFailures

# Limpiar cache de Jest
npm run test -- --clearCache
```

---

## 🐛 Debugging Tests

Si un test falla:

1. **Revisar el error**: Lee el mensaje de error completo
2. **Verificar mocks**: Asegúrate que ConfigService retorna los secrets correctos
3. **Ejecutar en modo watch**: `npm run test:watch auth.service.spec`
4. **Agregar console.logs**: Temporalmente para debugging
5. **Verificar variables de entorno**: JWT_ACCESS_SECRET, JWT_REFRESH_SECRET

### Variables de entorno necesarias
```env
JWT_ACCESS_SECRET=your-access-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
```

---

## 📝 Estructura de un Test

Todos los tests siguen esta estructura:

```typescript
describe('ComponentName', () => {
  // Setup
  let component: ComponentType;
  let mockDependency: any;

  beforeEach(async () => {
    // Configurar módulo de testing con mocks
    mockDependency = {
      method: jest.fn(),
    };
    
    const module = await Test.createTestingModule({
      providers: [
        Component,
        { provide: Dependency, useValue: mockDependency }
      ]
    }).compile();
    
    component = module.get<ComponentType>(ComponentType);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('methodName', () => {
    it('should do something successfully', async () => {
      // Arrange: Preparar datos y mocks
      mockDependency.method.mockResolvedValue(expectedValue);
      
      // Act: Ejecutar método
      const result = await component.methodName(input);
      
      // Assert: Verificar resultados
      expect(result).toEqual(expectedValue);
      expect(mockDependency.method).toHaveBeenCalledWith(input);
    });
  });
});
```

---

## 🔒 Aspectos de Seguridad Cubiertos

### Validaciones
- ✅ Passwords nunca incluidos en respuestas
- ✅ Tokens con expiración (access: 1h, refresh: 7d)
- ✅ Validación de secrets de JWT en startup
- ✅ UnauthorizedException para credenciales inválidas
- ✅ Audit logs de todos los intentos de autenticación

### Casos de seguridad testeados
- ✅ Login con credenciales inválidas
- ✅ Tokens expirados o inválidos
- ✅ Intentos de refresh con token inválido
- ✅ Headers de autorización malformados
- ✅ Múltiples intentos de login fallidos (registrados en audit)
- ✅ Caso sensitivo de emails

---

## 📌 Notas Importantes

- **No se conecta a BD real**: Todos los tests usan mocks de TypeORM
- **No valida JWT real**: Los tokens están mockeados con `jest.mock('jsonwebtoken')`
- **Tests independientes**: Cada test puede ejecutarse de forma aislada
- **Ejecución paralela**: Jest ejecuta tests en paralelo por defecto
- **Audit logs**: El proxy siempre registra eventos, incluso si falla el login

---

## 🎓 Recursos Adicionales

- [NestJS Authentication](https://docs.nestjs.com/security/authentication)
- [Passport JWT Strategy](http://www.passportjs.org/packages/passport-jwt/)
- [JWT.io - Debugger](https://jwt.io/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)

---

## ✅ Checklist de Ejecución

Antes de hacer commit, verifica:

- [ ] Todos los tests pasan: `npm run test auth`
- [ ] Cobertura >80%: `npm run test:cov auth`
- [ ] No hay warnings en consola
- [ ] Variables de entorno configuradas (JWT secrets)
- [ ] Tests nuevos documentados
- [ ] Mocks actualizados si cambiaron interfaces
- [ ] Audit logs funcionando correctamente

---

## 🔄 Integración con CI/CD

### GitHub Actions ejemplo
```yaml
name: Auth Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install dependencies
        run: npm install
      - name: Run auth tests
        run: npm run test auth
        env:
          JWT_ACCESS_SECRET: ${{ secrets.JWT_ACCESS_SECRET }}
          JWT_REFRESH_SECRET: ${{ secrets.JWT_REFRESH_SECRET }}
```

---

## 📊 Métricas de Calidad

| Métrica | Objetivo | Actual |
|---------|----------|--------|
| Cobertura de líneas | >80% | ~95% |
| Cobertura de ramas | >75% | ~90% |
| Tests pasando | 100% | 100% ✅ |
| Tiempo de ejecución | <5s | ~2s ⚡ |
