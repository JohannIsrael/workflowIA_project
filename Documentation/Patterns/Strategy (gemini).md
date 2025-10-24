# 🎯 Strategy Pattern en Gemini Service

## ¿Qué es el patrón Strategy?

El patrón **Strategy** es un patrón de diseño conductual que permite definir una familia de algoritmos, encapsular cada uno de ellos y hacerlos intercambiables. Strategy permite que el algoritmo varíe independientemente de los clientes que lo utilizan.

---

## 📊 Problema que resuelve

### ❌ Antes (sin Strategy)

Un único servicio con múltiples métodos que hacen cosas similares pero con lógica diferente:

```typescript
class GeminiService {
  async generateProjectSpec(userInput: string) { /* ... */ }
  async updateProjectWithPredictions(projectId: string) { /* ... */ }
  async optimizeProjectTasks(projectId: string) { /* ... */ }
}
```

**Problemas:**
- ❌ Código duplicado (generación con Gemini, parseo, etc.)
- ❌ Difícil de mantener (cambiar uno afecta a todos)
- ❌ Violación del Open/Closed Principle
- ❌ Difícil de testear (cada método tiene muchas responsabilidades)
- ❌ Difícil de extender (agregar nueva operación requiere modificar el servicio)

### ✅ Después (con Strategy)

Cada operación es una **estrategia independiente**:

```typescript
class GeminiService {
  constructor(
    private createStrategy: CreateProjectStrategy,
    private predictStrategy: PredictProjectStrategy,
    private optimizeStrategy: OptimizeProjectStrategy
  ) {}

  async createProject(input: string) {
    return this.createStrategy.execute({ userInput: input });
  }

  async predictProject(id: string) {
    const project = await this.loadProject(id);
    return this.predictStrategy.execute({ existingProject: project });
  }

  async optimizeProject(id: string) {
    const project = await this.loadProject(id);
    return this.optimizeStrategy.execute({ existingProject: project });
  }
}
```

**Beneficios:**
- ✅ Cada estrategia es independiente y testeable
- ✅ Fácil de extender (agregar nueva estrategia sin modificar código existente)
- ✅ Código reutilizable (cada estrategia usa los mismos procesadores)
- ✅ Cumple SOLID principles
- ✅ Clara separación de responsabilidades

---

## 🏗️ Arquitectura del sistema

```
┌─────────────────────────────────────────────────────────────┐
│                     GeminiController                        │
│  - POST /gemini/create                                      │
│  - POST /gemini/predict                                     │
│  - POST /gemini/optimize                                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                      GeminiService                          │
│  Responsabilidad: Orquestar estrategias                     │
│                                                             │
│  + createProject(userInput)                                 │
│  + predictProject(projectId)                                │
│  + optimizeProject(projectId)                               │
│  - loadProject(projectId)                                   │
└───────┬─────────────┬─────────────┬──────────────────────────┘
        │             │             │
        ▼             ▼             ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   Create     │ │   Predict    │ │   Optimize   │
│  Strategy    │ │  Strategy    │ │  Strategy    │
└──────────────┘ └──────────────┘ └──────────────┘
        │             │             │
        │             └─────┬───────┘
        │                   │
        ▼                   ▼
┌─────────────────┐  ┌─────────────────┐
│   Processors    │  │   Processors    │
│   (Full Chain)  │  │  (Partial Use)  │
│                 │  │                 │
│ • Cleaner       │  │ • Cleaner       │
│ • Parser        │  │ • Parser        │
│ • Normalizer    │  │ (No normalizer) │
│ • Persister     │  │ (No persister)  │
└─────────────────┘  └─────────────────┘
        │                   │
        ▼                   ▼
┌─────────────────────────────────────┐
│           Database                  │
│  • Projects table                   │
│  • Tasks table                      │
└─────────────────────────────────────┘
```

---

## 📁 Estructura de archivos

```
gemini/
├── strategies/
│   ├── base/
│   │   └── gemini-strategy.interface.ts      # Interface y clase base
│   ├── create-project.strategy.ts            # Estrategia 1: Crear
│   ├── predict-project.strategy.ts           # Estrategia 2: Predecir
│   └── optimize-project.strategy.ts          # Estrategia 3: Optimizar
├── processors/
│   ├── base/
│   │   └── spec-processor.interface.ts       # Chain of Responsibility
│   ├── json-cleaner.processor.ts             # Limpia JSON sucio
│   ├── json-parser.processor.ts              # Parsea JSON
│   ├── spec-normalizer.processor.ts          # Normaliza estructura
│   └── spec-persister.processor.ts           # Persiste en BD
├── entities/
│   ├── prompts/
│   │   ├── Create.ts                         # Prompt para crear
│   │   ├── Predict.ts                        # Prompt para predecir
│   │   └── Optimize.ts                       # Prompt para optimizar
│   ├── Projects.entity.ts
│   └── Tasks.entity.ts
├── dto/
│   └── project-response.dto.ts               # DTOs de respuesta
├── gemini.controller.ts
├── gemini.service.ts
└── gemini.module.ts
```

---

## 🎭 Las 3 estrategias

### 1️⃣ CreateProjectStrategy

**Propósito:** Crear un proyecto completamente nuevo desde una idea del usuario.

**Input:**
```typescript
{
  userInput: "An e-commerce platform with AI recommendations"
}
```

**Proceso:**
1. Genera prompt con contexto de creación
2. Llama a Gemini AI
3. Procesa respuesta a través de la **cadena completa** de procesadores:
   - `JsonCleanerProcessor` → Limpia markdown, comillas, etc.
   - `JsonParserProcessor` → Parsea a objeto JavaScript
   - `SpecNormalizerProcessor` → Valida y normaliza campos
   - `SpecPersisterProcessor` → Guarda en base de datos
4. Retorna proyecto(s) creado(s)

**Output:**
```typescript
{
  action: 'create',
  project: Projects | Projects[],
  metadata: {
    tasksAdded: 8
  }
}
```

**Características:**
- ✅ Usa la cadena completa de procesadores
- ✅ Persiste automáticamente en la base de datos
- ✅ Puede crear uno o múltiples proyectos
- ✅ Prompt optimizado para creación desde cero

---

### 2️⃣ PredictProjectStrategy

**Propósito:** Analizar un proyecto existente y agregar nuevas tareas sugeridas.

**Input:**
```typescript
{
  existingProject: Projects (con todas sus tareas actuales)
}
```

**Proceso:**
1. Construye prompt con **datos del proyecto actual**
2. Llama a Gemini AI para obtener sugerencias
3. Procesa respuesta usando **solo** limpieza y parseo:
   - `JsonCleanerProcessor` → Limpia respuesta
   - `JsonParserProcessor` → Parsea a objeto
4. **Merge** manual: Mantiene tareas existentes + agrega nuevas
5. Puede actualizar: `sprintsQuantity`, `endDate`
6. Guarda proyecto actualizado

**Output:**
```typescript
{
  action: 'predict',
  project: Projects,
  metadata: {
    tasksAdded: 3,
    fieldsUpdated: ['sprintsQuantity']
  }
}
```

**Características:**
- ✅ **Mantiene todas las tareas existentes**
- ✅ Agrega nuevas tareas al final
- ✅ Puede sugerir cambios en metadatos del proyecto
- ✅ No usa normalizer ni persister (control manual)
- ✅ Prompt optimizado para análisis y predicción

**Ejemplo:**
```
Tareas antes:  [Task1, Task2, Task3]
Nuevas tareas: [Task4, Task5]
Tareas después: [Task1, Task2, Task3, Task4, Task5]
```

---

### 3️⃣ OptimizeProjectStrategy

**Propósito:** Reorganizar completamente las tareas de un proyecto existente.

**Input:**
```typescript
{
  existingProject: Projects (con todas sus tareas actuales)
}
```

**Proceso:**
1. Construye prompt con **datos del proyecto actual**
2. Llama a Gemini AI para obtener set optimizado
3. Procesa respuesta usando **solo** limpieza y parseo
4. **Replace** en transacción:
   - Elimina TODAS las tareas existentes
   - Crea nuevas tareas optimizadas
5. Puede actualizar: `sprintsQuantity`, `endDate`
6. Guarda proyecto optimizado

**Output:**
```typescript
{
  action: 'optimize',
  project: Projects,
  metadata: {
    tasksRemoved: 8,
    tasksAdded: 6,
    fieldsUpdated: ['sprintsQuantity', 'endDate']
  }
}
```

**Características:**
- ✅ **Elimina todas las tareas existentes**
- ✅ Crea un set completamente nuevo
- ✅ Todo en transacción (rollback si falla)
- ✅ Puede reorganizar sprints y fechas
- ✅ Prompt optimizado para mejora y eficiencia

**Ejemplo:**
```
Tareas antes:     [Task1, Task2, Task3, Task4, Task5, Task6, Task7, Task8]
Optimización:     Gemini analiza y reorganiza
Tareas después:   [NewTask1, NewTask2, NewTask3, NewTask4, NewTask5, NewTask6]
                  (completamente diferentes)
```

---

## 🔄 Comparativa de estrategias

| Aspecto | Create | Predict | Optimize |
|---------|--------|---------|----------|
| **Input** | User idea (string) | Existing project | Existing project |
| **Tareas existentes** | N/A (nuevo) | Se mantienen | Se eliminan |
| **Tareas nuevas** | Crea desde cero | Agrega al final | Reemplaza todas |
| **Procesadores** | Cadena completa | Solo Clean + Parse | Solo Clean + Parse |
| **Persistencia** | Automática (Persister) | Manual (Save) | Manual (Transaction) |
| **Campos actualizables** | Todos | sprintsQuantity, endDate | sprintsQuantity, endDate |
| **Prompt** | Creación | Análisis + Predicción | Análisis + Optimización |

---

## 🧩 Componentes del patrón

### Interface base: `IGeminiStrategy`

```typescript
export interface IGeminiStrategy {
  execute(context: StrategyContext): Promise<StrategyResult>;
  getPrompt(): string;
  validate(context: StrategyContext): void;
}
```

**Responsabilidades:**
- Definir el contrato que todas las estrategias deben cumplir
- Garantizar consistencia en la ejecución

---

### Clase abstracta: `BaseGeminiStrategy`

```typescript
export abstract class BaseGeminiStrategy implements IGeminiStrategy {
  abstract execute(context: StrategyContext): Promise<StrategyResult>;
  abstract getPrompt(): string;

  validate(context: StrategyContext): void {
    if (!context) throw new Error('Context is required');
  }

  protected buildPromptWithContext(
    template: string, 
    context: StrategyContext
  ): string {
    // Construye el prompt combinando template + contexto
  }
}
```

**Responsabilidades:**
- Proporcionar funcionalidad común (validación, construcción de prompts)
- Forzar implementación de métodos abstractos en clases hijas

---

### Contexto de estrategia: `StrategyContext`

```typescript
export interface StrategyContext {
  userInput?: string;           // Para CreateProjectStrategy
  existingProject?: Projects;   // Para Predict/OptimizeProjectStrategy
  additionalData?: any;         // Para extensiones futuras
}
```

**Propósito:**
- Encapsular todos los datos que una estrategia puede necesitar
- Permite flexibilidad sin cambiar interfaces

---

### Resultado de estrategia: `StrategyResult`

```typescript
export interface StrategyResult {
  action: 'create' | 'predict' | 'optimize';
  project: Projects | Projects[];
  metadata?: {
    tasksAdded?: number;
    tasksRemoved?: number;
    fieldsUpdated?: string[];
  };
}
```

**Propósito:**
- Estandarizar la respuesta de todas las estrategias
- Proporcionar información útil sobre la operación realizada

---

## 🔗 Integración con Chain of Responsibility

Las estrategias usan los procesadores del patrón **Chain of Responsibility** de diferentes formas:

### CreateProjectStrategy: Cadena completa

```typescript
this.jsonCleaner
  .setNext(this.jsonParser)
  .setNext(this.specNormalizer)
  .setNext(this.specPersister);

const result = await this.processingChain.process(rawResponse);
```

**Flujo:**
```
Raw Gemini Response
    ↓
JsonCleaner → JsonParser → SpecNormalizer → SpecPersister
    ↓            ↓              ↓                ↓
  clean       parsed        normalized      persisted
```

### Predict/Optimize: Uso selectivo

```typescript
const cleaned = this.jsonCleaner['handle'](rawResponse);
const parsed = this.jsonParser['handle'](cleaned);
// Luego procesamiento manual sin normalizer ni persister
```

**Flujo:**
```
Raw Gemini Response
    ↓
JsonCleaner → JsonParser → Manual merge/replace → Manual save
    ↓            ↓              ↓                      ↓
  clean       parsed         merged              persisted
```

---

## 📝 Flujo de ejecución completo

### Ejemplo: Predict Project

```
1. Usuario hace request:
   POST /gemini/predict
   { "projectId": "uuid-123" }
   
2. Controller recibe:
   predictProject(projectId)
   
3. Service orquesta:
   - loadProject(projectId) → Carga proyecto con tareas
   - predictStrategy.execute({ existingProject })
   
4. Strategy ejecuta:
   - buildPromptWithContext() → Construye prompt con datos actuales
   - generateContent() → Llama a Gemini AI
   - parseResponse() → Limpia y parsea JSON
   - mergeWithExisting() → Agrega nuevas tareas
   
5. Respuesta se transforma:
   - sanitizeResponse() → Elimina referencias circulares
   
6. Usuario recibe:
   {
     "id": "uuid-123",
     "name": "Project Name",
     "tasks": [
       { "id": "1", "name": "Existing Task 1" },
       { "id": "2", "name": "Existing Task 2" },
       { "id": "3", "name": "NEW: Predicted Task" }
     ]
   }
```

---

## 🎯 Principios SOLID aplicados

### 1. **Single Responsibility Principle (SRP)**
Cada estrategia tiene una única responsabilidad:
- `CreateProjectStrategy` → Solo crear proyectos nuevos
- `PredictProjectStrategy` → Solo predecir y agregar tareas
- `OptimizeProjectStrategy` → Solo optimizar tareas existentes

### 2. **Open/Closed Principle (OCP)**
- **Abierto para extensión:** Puedes agregar nuevas estrategias sin modificar código existente
- **Cerrado para modificación:** Las estrategias existentes no necesitan cambios

```typescript
// Agregar nueva estrategia sin tocar las existentes
export class AnalyzeProjectStrategy extends BaseGeminiStrategy {
  // Nueva funcionalidad
}
```

### 3. **Liskov Substitution Principle (LSP)**
Todas las estrategias son intercambiables:
```typescript
// Cualquier estrategia puede usarse aquí
async function executeStrategy(strategy: IGeminiStrategy, context: StrategyContext) {
  return await strategy.execute(context);
}
```

### 4. **Interface Segregation Principle (ISP)**
Las interfaces son específicas y mínimas:
- `IGeminiStrategy` solo tiene lo necesario
- No fuerza implementaciones innecesarias

### 5. **Dependency Inversion Principle (DIP)**
Dependemos de abstracciones, no de implementaciones:
```typescript
constructor(
  private readonly createStrategy: CreateProjectStrategy,  // Implementación
  // Pero todos implementan IGeminiStrategy (abstracción)
)
```

---

## 🧪 Testing

### Ventajas para testing

El patrón Strategy hace el testing mucho más sencillo:

#### 1. Test de estrategia individual

```typescript
describe('PredictProjectStrategy', () => {
  let strategy: PredictProjectStrategy;
  let mockGenAI: jest.Mocked<GoogleGenAI>;
  let mockRepo: jest.Mocked<Repository<Projects>>;

  beforeEach(() => {
    // Setup mocks
    mockGenAI = createMock<GoogleGenAI>();
    mockRepo = createMock<Repository<Projects>>();
    
    strategy = new PredictProjectStrategy(
      mockGenAI,
      mockJsonCleaner,
      mockJsonParser,
      mockRepo,
      mockTasksRepo
    );
  });

  it('should add new tasks to existing project', async () => {
    const existingProject = createMockProject();
    const context = { existingProject };
    
    mockGenAI.models.generateContent.mockResolvedValue({
      text: '{"tasks": [{"name": "New Task"}]}'
    });
    
    const result = await strategy.execute(context);
    
    expect(result.action).toBe('predict');
    expect(result.metadata.tasksAdded).toBe(1);
  });
});
```

#### 2. Test de servicio (usa mocks de estrategias)

```typescript
describe('GeminiService', () => {
  let service: GeminiService;
  let mockPredictStrategy: jest.Mocked<PredictProjectStrategy>;

  beforeEach(() => {
    mockPredictStrategy = createMock<PredictProjectStrategy>();
    service = new GeminiService(
      mockRepo,
      mockCreateStrategy,
      mockPredictStrategy,
      mockOptimizeStrategy
    );
  });

  it('should call predict strategy with loaded project', async () => {
    const projectId = 'uuid-123';
    const mockProject = createMockProject();
    
    mockRepo.findOne.mockResolvedValue(mockProject);
    mockPredictStrategy.execute.mockResolvedValue({
      action: 'predict',
      project: mockProject
    });
    
    await service.predictProject(projectId);
    
    expect(mockPredictStrategy.execute).toHaveBeenCalledWith({
      existingProject: mockProject
    });
  });
});
```

#### 3. Test de integración

```typescript
describe('Gemini Integration', () => {
  it('should create, predict, and optimize a project', async () => {
    // 1. Create
    const created = await service.createProject('E-commerce platform');
    expect(created).toHaveProperty('id');
    
    // 2. Predict
    const predicted = await service.predictProject(created.id);
    expect(predicted.tasks.length).toBeGreaterThan(created.tasks.length);
    
    // 3. Optimize
    const optimized = await service.optimizeProject(created.id);
    expect(optimized.tasks).not.toEqual(predicted.tasks);
  });
});
```

---

## 🚀 Extensibilidad

### Agregar una nueva estrategia

Ejemplo: **AnalyzeProjectStrategy** (analizar viabilidad sin modificar)

```typescript
// 1. Crear nueva estrategia
export class AnalyzeProjectStrategy extends BaseGeminiStrategy {
  constructor(
    private readonly genAI: GoogleGenAI,
    @InjectRepository(Projects) 
    private readonly projectsRepository: Repository<Projects>,
  ) {
    super();
  }

  getPrompt(): string {
    return WORKFLOW_ANALYZE_PROMPT;
  }

  validate(context: StrategyContext): void {
    super.validate(context);
    if (!context.existingProject) {
      throw new BadRequestException('existingProject required');
    }
  }

  async execute(context: StrategyContext): Promise<StrategyResult> {
    // Lógica de análisis
    const analysis = await this.analyzeProject(context.existingProject);
    
    return {
      action: 'analyze',
      project: context.existingProject,
      metadata: {
        viabilityScore: analysis.score,
        recommendations: analysis.recommendations
      }
    };
  }
}

// 2. Registrar en el módulo
@Module({
  providers: [
    // ... otros providers
    AnalyzeProjectStrategy,  // 👈 Agregar aquí
  ]
})
export class GeminiModule {}

// 3. Inyectar en el servicio
export class GeminiService {
  constructor(
    // ... otras estrategias
    private readonly analyzeStrategy: AnalyzeProjectStrategy,
  ) {}

  async analyzeProject(projectId: string) {
    const project = await this.loadProject(projectId);
    return this.analyzeStrategy.execute({ existingProject: project });
  }
}

// 4. Agregar endpoint en controller
@Post('analyze')
async analyzeProject(@Body('projectId') projectId: string) {
  return this.geminiService.analyzeProject(projectId);
}
```

**¡No modificaste ninguna estrategia existente!** ✅

---

## 📚 Recursos adicionales

### Patrones relacionados

1. **Chain of Responsibility** - Usado en los procesadores
2. **Factory Pattern** - Podría usarse para crear estrategias dinámicamente
3. **Template Method** - `BaseGeminiStrategy` es similar a este patrón

### Referencias

- [Refactoring Guru - Strategy Pattern](https://refactoring.guru/design-patterns/strategy)
- [Gang of Four - Design Patterns](https://en.wikipedia.org/wiki/Design_Patterns)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)

---

## 💡 Mejores prácticas

### ✅ DO (Hacer)

1. **Mantén las estrategias independientes** - No deben conocerse entre sí
2. **Usa el contexto adecuado** - Solo pasa lo que la estrategia necesita
3. **Valida el contexto** - Cada estrategia valida sus requisitos
4. **Retorna resultados estandarizados** - Usa `StrategyResult`
5. **Documenta las diferencias** - Explica cuándo usar cada estrategia

### ❌ DON'T (No hacer)

1. **No compartas estado** entre estrategias
2. **No hagas estrategias dependientes** de otras estrategias
3. **No mezcles responsabilidades** - Una estrategia = una operación
4. **No ignores errores** - Maneja excepciones apropiadamente
5. **No uses lógica condicional** para elegir estrategias en runtime (usa inyección)

---

## 🎓 Conclusión


- ✅ Tres estrategias independientes y especializadas
- ✅ Código reutilizable y mantenible
- ✅ Fácil de testear y extender
- ✅ Cumple principios SOLID
- ✅ Arquitectura limpia y escalable

El patrón Strategy, combinado con Chain of Responsibility, proporciona una arquitectura robusta, flexible y profesional para manejar diferentes operaciones con IA de forma elegante y mantenible.