# 🧪 Tests del Módulo Gemini

Todos los tests de este archivo son de **BACKEND** y deben ejecutarse desde el directorio raíz `/workflows-ia/`

---

## 🚀 Ejecución Rápida

### Ejecutar todos los tests del módulo
```bash
npm run test gemini
```

### Ejecutar todos los tests con cobertura
```bash
npm run test:cov gemini
```

### Ejecutar tests en modo watch (desarrollo)
```bash
npm run test:watch gemini
```

---

## 📦 Tests por Componente

### 1️⃣ Chain of Responsibility Pattern (Processors)

Los processors procesan la respuesta de Gemini AI en una cadena secuencial.

```bash
# Test individual de cada processor
npm run test json-cleaner.processor.spec      # Limpia JSON (markdown, comillas, etc)
npm run test json-parser.processor.spec       # Parsea JSON a objetos JS
npm run test spec-normalizer.processor.spec   # Normaliza estructura de datos
npm run test spec-persister.processor.spec    # Persiste en base de datos
```

**Cobertura:**
- ✅ Limpieza de respuestas de IA (markdown, comillas, comentarios)
- ✅ Parsing robusto de JSON
- ✅ Normalización de campos alternativos
- ✅ Persistencia con transacciones

---

### 2️⃣ Factory Method Pattern

El factory gestiona la creación y obtención de strategies.

```bash
npm run test strategy.factory.spec
```

**Cobertura:**
- ✅ Obtención de strategies por tipo
- ✅ Validación de tipos disponibles
- ✅ Manejo de estrategias inválidas
- ✅ Type guards y validaciones

---

### 3️⃣ Strategy Pattern

Cada strategy implementa un flujo específico de interacción con Gemini AI.

```bash
# Test de cada strategy
npm run test create-project.strategy.spec    # Crea proyectos nuevos
npm run test predict-project.strategy.spec   # Predice y agrega tareas
npm run test optimize-project.strategy.spec  # Optimiza reemplazando tareas
```

**Cobertura por Strategy:**

#### CreateProjectStrategy
- ✅ Creación de uno o múltiples proyectos
- ✅ Procesamiento en cadena (cleaner → parser → normalizer → persister)
- ✅ Integración con Gemini AI
- ✅ Manejo de errores y validaciones

#### PredictProjectStrategy
- ✅ Predicción de nuevas tareas para proyecto existente
- ✅ Merge de tareas (preserva existentes + agrega nuevas)
- ✅ Actualización de campos opcionales (sprintsQuantity, endDate)
- ✅ Validación de proyecto existente

#### OptimizeProjectStrategy
- ✅ Reemplazo completo de tareas (DELETE + CREATE)
- ✅ Transacciones atómicas para integridad
- ✅ Actualización de campos del proyecto
- ✅ Metadata de tareas removidas/agregadas

---

### 4️⃣ Service Layer

El service orquesta las strategies y maneja la lógica de negocio.

```bash
npm run test gemini.service.spec
```

**Cobertura:**
- ✅ Métodos CRUD: createProject, predictProject, optimizeProject
- ✅ Método genérico: executeStrategy
- ✅ Carga de proyectos con relaciones
- ✅ Validaciones de parámetros
- ✅ Manejo de errores (proyecto no encontrado, etc)
- ✅ Integración con strategy factory

---

### 5️⃣ Controller Layer

El controller expone los endpoints REST y sanitiza las respuestas.

```bash
npm run test gemini.controller.spec
```

**Cobertura:**
- ✅ Endpoints: POST /create, /predict, /optimize, /execute
- ✅ Endpoint: GET /strategies
- ✅ Sanitización de respuestas (elimina campos internos)
- ✅ Manejo de proyectos únicos y múltiples
- ✅ Propagación de errores del service

---

## 📊 Resumen de Patrones de Diseño Implementados

| Patrón | Componente | Propósito |
|--------|------------|-----------|
| **Chain of Responsibility** | Processors | Procesar respuesta de IA en pasos secuenciales |
| **Factory Method** | StrategyFactory | Crear y obtener strategies dinámicamente |
| **Strategy** | Create/Predict/Optimize | Encapsular algoritmos de interacción con IA |
| **Repository** | TypeORM Repositories | Abstracción de acceso a datos |
| **Dependency Injection** | NestJS DI | Inyección de dependencias y testabilidad |

---

## 🎯 Cobertura de Tests

Cada archivo de test incluye:

- ✅ **Unit tests**: Prueba componentes de forma aislada con mocks
- ✅ **Validation tests**: Verifica validaciones y manejo de errores
- ✅ **Integration tests**: Prueba interacciones entre componentes
- ✅ **Edge cases**: Casos límite y situaciones inusuales

### Estadísticas esperadas
- **Cobertura objetivo**: >80%
- **Total de tests**: ~300+
- **Archivos de test**: 10

---

## 🛠️ Comandos Útiles

```bash
# Ver cobertura en el navegador
npm run test:cov gemini
# Luego abrir: coverage/lcov-report/index.html

# Ejecutar test específico
npm run test json-cleaner.processor.spec

# Ejecutar tests en modo verbose
npm run test -- --verbose gemini

# Ejecutar solo tests que fallaron
npm run test -- --onlyFailures

# Limpiar cache de Jest
npm run test -- --clearCache
```

---

## 🐛 Debugging Tests

Si un test falla:

1. **Revisar el error**: Lee el mensaje de error completo
2. **Verificar mocks**: Asegúrate que los mocks estén configurados correctamente
3. **Ejecutar en modo watch**: `npm run test:watch <archivo>`
4. **Agregar console.logs**: Temporalmente para debugging
5. **Verificar imports**: Asegúrate que las rutas sean correctas

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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('methodName', () => {
    it('should do something successfully', async () => {
      // Arrange: Preparar datos
      // Act: Ejecutar método
      // Assert: Verificar resultados
    });

    it('should handle errors correctly', async () => {
      // Test de manejo de errores
    });
  });
});
```

---


## 📌 Notas Importantes

- **No se conecta a BD real**: Todos los tests usan mocks de TypeORM
- **No llama a Gemini AI**: Las respuestas de la API están mockeadas
- **Tests independientes**: Cada test puede ejecutarse de forma aislada

---
