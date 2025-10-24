# 🏭 Factory Pattern en Gemini Service

## ¿Qué es el patrón Factory?

El patrón **Factory** (o Factory Method) es un patrón de diseño creacional que proporciona una interfaz para crear objetos, pero permite que las subclases o una clase especializada decidan qué clase instanciar. En lugar de llamar directamente a constructores, el código cliente solicita objetos a través de una fábrica.

---

## 📊 Problema que resuelve

### ❌ Antes (sin Factory)

El servicio tenía que inyectar y gestionar manualmente cada estrategia:

```typescript
@Injectable()
export class GeminiService {
  constructor(
    @InjectRepository(Projects) 
    private readonly projectsRepository: Repository<Projects>,
    private readonly createStrategy: CreateProjectStrategy,      // 👈 Inyección 1
    private readonly predictStrategy: PredictProjectStrategy,    // 👈 Inyección 2
    private readonly optimizeStrategy: OptimizeProjectStrategy,  // 👈 Inyección 3
  ) {}

  async createProject(userInput: string) {
    return this.createStrategy.execute({ userInput });
  }

  async predictProject(projectId: string) {
    const project = await this.loadProject(projectId);
    return this.predictStrategy.execute({ existingProject: project });
  }

  async optimizeProject(projectId: string) {
    const project = await this.loadProject(projectId);
    return this.optimizeStrategy.execute({ existingProject: project });
  }
}
```

**Problemas:**
- ❌ Servicio con muchas dependencias (crece con cada nueva estrategia)
- ❌ No hay forma de obtener estrategias dinámicamente
- ❌ Difícil agregar nuevas estrategias sin modificar el servicio
- ❌ No se puede listar o descubrir estrategias disponibles
- ❌ Código repetitivo en cada método

### ✅ Después (con Factory)

Una única dependencia (el Factory) que gestiona todas las estrategias:

```typescript
@Injectable()
export class GeminiService {
  constructor(
    @InjectRepository(Projects) 
    private readonly projectsRepository: Repository<Projects>,
    private readonly strategyFactory: GeminiStrategyFactory,  // 👈 Una sola inyección
  ) {}

  async createProject(userInput: string) {
    const strategy = this.strategyFactory.getStrategy('create');
    return strategy.execute({ userInput });
  }

  async executeStrategy(type: StrategyType, input: any) {
    const strategy = this.strategyFactory.getStrategy(type);  // 👈 Dinámico
    // ...
  }

  getAvailableStrategies() {
    return this.strategyFactory.getAvailableStrategies();  // 👈 Descubrimiento
  }
}
```

**Beneficios:**
- ✅ Servicio con una sola dependencia relacionada con estrategias
- ✅ Creación dinámica de estrategias por nombre/tipo
- ✅ Fácil agregar nuevas estrategias (solo modificar el Factory)
- ✅ Descubrimiento automático de estrategias disponibles
- ✅ Centralización de la lógica de creación

---

## 🏗️ Arquitectura del Factory

```
┌────────────────────────────────────────────────────────┐
│                   GeminiController                     │
│  - POST /gemini/create                                 │
│  - POST /gemini/predict                                │
│  - POST /gemini/optimize                               │
│  - POST /gemini/execute       (nuevo - unificado)      │
│  - GET  /gemini/strategies    (nuevo - listado)        │
└──────────────────────┬─────────────────────────────────┘
                       │
                       ▼
┌────────────────────────────────────────────────────────┐
│                   GeminiService                        │
│  Usa: GeminiStrategyFactory                            │
│                                                        │
│  + createProject(userInput)                            │
│  + predictProject(projectId)                           │
│  + optimizeProject(projectId)                          │
│  + executeStrategy(type, input)     (nuevo)            │
│  + getAvailableStrategies()         (nuevo)            │
└──────────────────────┬─────────────────────────────────┘
                       │
                       ▼
┌────────────────────────────────────────────────────────┐
│            GeminiStrategyFactory                       │
│  Responsabilidad: Crear y gestionar estrategias        │
│                                                        │
│  - strategies: Map<StrategyType, IGeminiStrategy>      │
│                                                        │
│  + getStrategy(type): IGeminiStrategy                  │
│  + getAvailableStrategies(): StrategyType[]            │
│  + hasStrategy(type): boolean                          │
└───────┬────────────┬────────────┬──────────────────────┘
        │            │            │
        ▼            ▼            ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│   Create    │ │   Predict   │ │  Optimize   │
│  Strategy   │ │  Strategy   │ │  Strategy   │
└─────────────┘ └─────────────┘ └─────────────┘
```

---

## 📁 Estructura de archivos

```
gemini/
├── strategies/
│   ├── base/
│   │   └── gemini-strategy.interface.ts
│   ├── strategy.factory.ts              # 🆕 Factory Pattern
│   ├── create-project.strategy.ts
│   ├── predict-project.strategy.ts
│   └── optimize-project.strategy.ts
├── processors/
│   └── ...
├── entities/
│   └── ...
├── gemini.controller.ts                 # ✏️ Actualizado
├── gemini.service.ts                    # ✏️ Simplificado
└── gemini.module.ts                     # ✏️ Actualizado
```

---

## 🔧 Implementación del Factory

### Componente principal: `GeminiStrategyFactory`

```typescript
export type StrategyType = 'create' | 'predict' | 'optimize';

@Injectable()
export class GeminiStrategyFactory {
  private readonly strategies: Map<StrategyType, IGeminiStrategy>;

  constructor(
    private readonly createStrategy: CreateProjectStrategy,
    private readonly predictStrategy: PredictProjectStrategy,
    private readonly optimizeStrategy: OptimizeProjectStrategy,
  ) {
    // Registrar todas las estrategias en el Map
    this.strategies = new Map<StrategyType, IGeminiStrategy>([
      ['create', this.createStrategy],
      ['predict', this.predictStrategy],
      ['optimize', this.optimizeStrategy],
    ] as Array<[StrategyType, IGeminiStrategy]>);
  }

  getStrategy(type: StrategyType): IGeminiStrategy {
    const strategy = this.strategies.get(type);
    
    if (!strategy) {
      throw new BadRequestException(
        `Unknown strategy type: ${type}. Available: ${Array.from(this.strategies.keys()).join(', ')}`
      );
    }

    return strategy;
  }

  getAvailableStrategies(): StrategyType[] {
    return Array.from(this.strategies.keys());
  }

  hasStrategy(type: string): type is StrategyType {
    return this.strategies.has(type as StrategyType);
  }
}
```

**Responsabilidades del Factory:**

1. **Registro**: Mantiene un mapa de todas las estrategias disponibles
2. **Creación**: Retorna la estrategia solicitada por tipo
3. **Validación**: Lanza error si se solicita una estrategia inexistente
4. **Descubrimiento**: Lista todas las estrategias registradas
5. **Type-checking**: Valida si un string es un tipo de estrategia válido

---

## 🎯 Uso del Factory

### 1. En el servicio

```typescript
@Injectable()
export class GeminiService {
  constructor(
    @InjectRepository(Projects) 
    private readonly projectsRepository: Repository<Projects>,
    private readonly strategyFactory: GeminiStrategyFactory,
  ) {}

  // Método específico (sintaxis tradicional)
  async createProject(userInput: string): Promise<Projects | Projects[]> {
    const strategy = this.strategyFactory.getStrategy('create');
    const context: StrategyContext = { userInput };
    const result = await strategy.execute(context);
    return result.project;
  }

  // Método dinámico (nueva funcionalidad)
  async executeStrategy(
    type: StrategyType,
    input: { userInput?: string; projectId?: string }
  ): Promise<Projects | Projects[]> {
    const strategy = this.strategyFactory.getStrategy(type);
    
    // Preparar contexto
    let context: StrategyContext;
    if (type === 'create') {
      context = { userInput: input.userInput };
    } else {
      const project = await this.loadProject(input.projectId!);
      context = { existingProject: project };
    }

    const result = await strategy.execute(context);
    return result.project;
  }

  // Listar estrategias disponibles
  getAvailableStrategies(): string[] {
    return this.strategyFactory.getAvailableStrategies();
  }
}
```

### 2. En el controller

```typescript
@Controller('gemini')
export class GeminiController {
  constructor(private readonly geminiService: GeminiService) {}

  // Endpoints tradicionales (mantienen compatibilidad)
  @Post('create')
  async generateProject(@Body('idea') idea: string) {
    return await this.geminiService.createProject(idea);
  }

  // Nuevo endpoint unificado
  @Post('execute')
  async executeStrategy(
    @Body('strategy') strategy: string,
    @Body('userInput') userInput?: string,
    @Body('projectId') projectId?: string
  ) {
    return await this.geminiService.executeStrategy(
      strategy as StrategyType,
      { userInput, projectId }
    );
  }

  // Nuevo endpoint de descubrimiento
  @Get('strategies')
  async getStrategies() {
    return {
      strategies: this.geminiService.getAvailableStrategies(),
      description: {
        create: 'Create a new project from user idea',
        predict: 'Predict and add new tasks to existing project',
        optimize: 'Optimize project by replacing all tasks'
      }
    };
  }
}
```

---

## 🌐 Endpoints disponibles

### Endpoints tradicionales (sin cambios)

#### 1. Crear proyecto
```http
POST /gemini/create
Content-Type: application/json

{
  "idea": "A restaurant reservation system with AI"
}
```

#### 2. Predecir tareas
```http
POST /gemini/predict
Content-Type: application/json

{
  "projectId": "uuid-123"
}
```

#### 3. Optimizar proyecto
```http
POST /gemini/optimize
Content-Type: application/json

{
  "projectId": "uuid-123"
}
```

### 🆕 Nuevos endpoints

#### 4. Ejecutar estrategia dinámica
```http
POST /gemini/execute
Content-Type: application/json

{
  "strategy": "create",
  "userInput": "An e-commerce platform"
}
```

```http
POST /gemini/execute
Content-Type: application/json

{
  "strategy": "predict",
  "projectId": "uuid-123"
}
```

**Beneficio**: Un solo endpoint puede ejecutar cualquier estrategia.

#### 5. Listar estrategias disponibles
```http
GET /gemini/strategies
```

**Respuesta:**
```json
{
  "strategies": ["create", "predict", "optimize"],
  "description": {
    "create": "Create a new project from user idea",
    "predict": "Predict and add new tasks to existing project",
    "optimize": "Optimize project by replacing all tasks"
  }
}
```

**Beneficio**: Los clientes pueden descubrir dinámicamente qué estrategias están disponibles.

---

## 🔄 Flujo de ejecución

### Flujo tradicional (POST /gemini/create)

```
1. Request llega al controller
   POST /gemini/create { "idea": "..." }

2. Controller llama al servicio
   geminiService.createProject(idea)

3. Servicio obtiene estrategia del Factory
   strategy = strategyFactory.getStrategy('create')
   
4. Factory retorna CreateProjectStrategy
   return this.strategies.get('create')

5. Servicio ejecuta estrategia
   result = await strategy.execute({ userInput: idea })

6. Estrategia procesa y retorna resultado
   { action: 'create', project: {...}, metadata: {...} }

7. Servicio retorna proyecto
   return result.project

8. Controller sanitiza y envía respuesta
   return sanitizeResponse(project)
```

### 🆕 Flujo dinámico (POST /gemini/execute)

```
1. Request llega con tipo de estrategia
   POST /gemini/execute { "strategy": "predict", "projectId": "..." }

2. Controller llama al método dinámico
   geminiService.executeStrategy('predict', { projectId: "..." })

3. Servicio valida input según tipo
   if (type === 'predict' && !input.projectId) throw Error(...)

4. Servicio obtiene estrategia del Factory
   strategy = strategyFactory.getStrategy('predict')
   
5. Factory valida y retorna estrategia
   if (!strategies.has('predict')) throw Error(...)
   return this.strategies.get('predict')

6. Servicio prepara contexto
   const project = await loadProject(projectId)
   context = { existingProject: project }

7. Servicio ejecuta estrategia
   result = await strategy.execute(context)

8. Retorna resultado
   return result.project
```

---

## 🎯 Beneficios del Factory Pattern

### 1. **Desacoplamiento** 
El servicio no necesita conocer las implementaciones específicas de cada estrategia, solo usa la interfaz común.

```typescript
// Antes: Dependencia directa de cada estrategia
constructor(
  private readonly createStrategy: CreateProjectStrategy,
  private readonly predictStrategy: PredictProjectStrategy,
  private readonly optimizeStrategy: OptimizeProjectStrategy,
)

// Después: Una sola dependencia del Factory
constructor(
  private readonly strategyFactory: GeminiStrategyFactory,
)
```

### 2. **Creación dinámica**
Puedes obtener estrategias basándote en valores de runtime.

```typescript
// Dinámico: el tipo viene del request
const strategyType = request.body.strategy;
const strategy = this.strategyFactory.getStrategy(strategyType);
```

### 3. **Centralización**
Toda la lógica de creación y registro está en un solo lugar.

```typescript
// Un solo lugar para agregar/remover estrategias
constructor(...) {
  this.strategies = new Map([
    ['create', this.createStrategy],
    ['predict', this.predictStrategy],
    ['optimize', this.optimizeStrategy],
    // Agregar nuevas aquí
  ]);
}
```

### 4. **Validación automática**
El Factory valida automáticamente si una estrategia existe.

```typescript
getStrategy(type: StrategyType): IGeminiStrategy {
  const strategy = this.strategies.get(type);
  
  if (!strategy) {
    throw new BadRequestException(
      `Unknown strategy type: ${type}. Available: ${this.getAvailableStrategies().join(', ')}`
    );
  }
  
  return strategy;
}
```

### 5. **Descubrimiento de capacidades**
Los clientes pueden consultar qué estrategias están disponibles.

```typescript
// GET /gemini/strategies
{
  "strategies": ["create", "predict", "optimize"]
}
```

### 6. **Type-safety con TypeScript**
El tipo `StrategyType` garantiza que solo se usen estrategias válidas.

```typescript
export type StrategyType = 'create' | 'predict' | 'optimize';

// Error de compilación si usas un tipo inválido
const strategy = factory.getStrategy('invalid');  // ❌ Error
const strategy = factory.getStrategy('create');   // ✅ OK
```

---

## 🚀 Extensibilidad

### Agregar una nueva estrategia

Ejemplo: Agregar **AnalyzeProjectStrategy**

#### Paso 1: Crear la estrategia

```typescript
// strategies/analyze-project.strategy.ts
@Injectable()
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
      throw new BadRequestException('existingProject required for analyze');
    }
  }

  async execute(context: StrategyContext): Promise<StrategyResult> {
    // Lógica de análisis
    const analysis = await this.analyzeViability(context.existingProject!);
    
    return {
      action: 'analyze',
      project: context.existingProject!,
      metadata: {
        viabilityScore: analysis.score,
        risks: analysis.risks,
        recommendations: analysis.recommendations
      }
    };
  }

  private async analyzeViability(project: Projects) {
    // Implementación del análisis
    // ...
  }
}
```

#### Paso 2: Actualizar el tipo en el Factory

```typescript
// strategies/strategy.factory.ts

// ANTES:
export type StrategyType = 'create' | 'predict' | 'optimize';

// DESPUÉS:
export type StrategyType = 'create' | 'predict' | 'optimize' | 'analyze';  // 👈 Agregar
```

#### Paso 3: Registrar en el Factory constructor

```typescript
@Injectable()
export class GeminiStrategyFactory {
  constructor(
    private readonly createStrategy: CreateProjectStrategy,
    private readonly predictStrategy: PredictProjectStrategy,
    private readonly optimizeStrategy: OptimizeProjectStrategy,
    private readonly analyzeStrategy: AnalyzeProjectStrategy,  // 👈 Inyectar
  ) {
    this.strategies = new Map<StrategyType, IGeminiStrategy>([
      ['create', this.createStrategy],
      ['predict', this.predictStrategy],
      ['optimize', this.optimizeStrategy],
      ['analyze', this.analyzeStrategy],  // 👈 Registrar
    ] as Array<[StrategyType, IGeminiStrategy]>);
  }
}
```

#### Paso 4: Registrar en el módulo

```typescript
// gemini.module.ts
@Module({
  providers: [
    // ...
    AnalyzeProjectStrategy,  // 👈 Agregar provider
    GeminiStrategyFactory,
  ]
})
export class GeminiModule {}
```

#### Paso 5: (Opcional) Agregar método específico en el servicio

```typescript
// gemini.service.ts
async analyzeProject(projectId: string): Promise<Projects> {
  const strategy = this.strategyFactory.getStrategy('analyze');
  const existingProject = await this.loadProject(projectId);
  const result = await strategy.execute({ existingProject });
  return result.project as Projects;
}
```

#### Paso 6: (Opcional) Agregar endpoint en el controller

```typescript
// gemini.controller.ts
@Post('analyze')
async analyzeProject(@Body('projectId') projectId: string) {
  const result = await this.geminiService.analyzeProject(projectId);
  return this.sanitizeResponse(result);
}
```

### ✅ Resultado

La nueva estrategia **funciona automáticamente** en:

1. ✅ `POST /gemini/execute` con `{ "strategy": "analyze", "projectId": "..." }`
2. ✅ `GET /gemini/strategies` ahora incluye `"analyze"`
3. ✅ `service.executeStrategy('analyze', {...})` funciona
4. ✅ (Opcional) `POST /gemini/analyze` si agregaste el endpoint específico

**¡Sin modificar código existente de otras estrategias!**

---

## 🧪 Testing

### Test del Factory

```typescript
describe('GeminiStrategyFactory', () => {
  let factory: GeminiStrategyFactory;
  let mockCreateStrategy: jest.Mocked<CreateProjectStrategy>;
  let mockPredictStrategy: jest.Mocked<PredictProjectStrategy>;
  let mockOptimizeStrategy: jest.Mocked<OptimizeProjectStrategy>;

  beforeEach(() => {
    mockCreateStrategy = createMock<CreateProjectStrategy>();
    mockPredictStrategy = createMock<PredictProjectStrategy>();
    mockOptimizeStrategy = createMock<OptimizeProjectStrategy>();

    factory = new GeminiStrategyFactory(
      mockCreateStrategy,
      mockPredictStrategy,
      mockOptimizeStrategy
    );
  });

  it('should return create strategy', () => {
    const strategy = factory.getStrategy('create');
    expect(strategy).toBe(mockCreateStrategy);
  });

  it('should return predict strategy', () => {
    const strategy = factory.getStrategy('predict');
    expect(strategy).toBe(mockPredictStrategy);
  });

  it('should throw error for unknown strategy', () => {
    expect(() => factory.getStrategy('invalid' as any))
      .toThrow('Unknown strategy type: invalid');
  });

  it('should list all available strategies', () => {
    const strategies = factory.getAvailableStrategies();
    expect(strategies).toEqual(['create', 'predict', 'optimize']);
  });

  it('should check if strategy exists', () => {
    expect(factory.hasStrategy('create')).toBe(true);
    expect(factory.hasStrategy('invalid')).toBe(false);
  });
});
```

### Test del servicio con Factory

```typescript
describe('GeminiService with Factory', () => {
  let service: GeminiService;
  let mockFactory: jest.Mocked<GeminiStrategyFactory>;
  let mockStrategy: jest.Mocked<IGeminiStrategy>;
  let mockRepo: jest.Mocked<Repository<Projects>>;

  beforeEach(() => {
    mockFactory = createMock<GeminiStrategyFactory>();
    mockStrategy = createMock<IGeminiStrategy>();
    mockRepo = createMock<Repository<Projects>>();

    service = new GeminiService(mockRepo, mockFactory);
  });

  it('should execute create strategy', async () => {
    const userInput = 'Test project';
    mockFactory.getStrategy.mockReturnValue(mockStrategy);
    mockStrategy.execute.mockResolvedValue({
      action: 'create',
      project: createMockProject()
    });

    await service.createProject(userInput);

    expect(mockFactory.getStrategy).toHaveBeenCalledWith('create');
    expect(mockStrategy.execute).toHaveBeenCalledWith({ userInput });
  });

  it('should execute dynamic strategy', async () => {
    mockFactory.getStrategy.mockReturnValue(mockStrategy);
    mockStrategy.execute.mockResolvedValue({
      action: 'predict',
      project: createMockProject()
    });

    await service.executeStrategy('predict', { projectId: 'uuid-123' });

    expect(mockFactory.getStrategy).toHaveBeenCalledWith('predict');
  });

  it('should get available strategies', () => {
    mockFactory.getAvailableStrategies.mockReturnValue(['create', 'predict', 'optimize']);

    const strategies = service.getAvailableStrategies();

    expect(strategies).toEqual(['create', 'predict', 'optimize']);
  });
});
```

---

## 🎓 Principios SOLID aplicados

### 1. **Single Responsibility Principle (SRP)**
El Factory tiene una única responsabilidad: **gestionar la creación y registro de estrategias**.

```typescript
// Factory solo se encarga de estrategias
class GeminiStrategyFactory {
  getStrategy() { /* ... */ }
  getAvailableStrategies() { /* ... */ }
  hasStrategy() { /* ... */ }
}
```

### 2. **Open/Closed Principle (OCP)**
- **Abierto para extensión**: Agregar nueva estrategia = modificar solo el Factory
- **Cerrado para modificación**: El servicio y controller no cambian

```typescript
// Agregar estrategia: solo modificas el Factory constructor
constructor(
  // ... estrategias existentes
  private readonly newStrategy: NewStrategy,  // 👈 Agregar
) {
  this.strategies = new Map([
    // ... existentes
    ['new', this.newStrategy],  // 👈 Registrar
  ]);
}
```

### 3. **Liskov Substitution Principle (LSP)**
Todas las estrategias son intercambiables porque implementan `IGeminiStrategy`.

```typescript
// Cualquier estrategia funciona aquí
const strategy: IGeminiStrategy = factory.getStrategy(type);
await strategy.execute(context);
```

### 4. **Interface Segregation Principle (ISP)**
El Factory solo expone los métodos necesarios, no más.

```typescript
interface IStrategyFactory {
  getStrategy(type: string): IGeminiStrategy;
  getAvailableStrategies(): string[];
}
```

### 5. **Dependency Inversion Principle (DIP)**
El servicio depende de la abstracción (Factory) no de las implementaciones concretas (estrategias).

```typescript
// Servicio depende del Factory (abstracción)
constructor(
  private readonly strategyFactory: GeminiStrategyFactory,
)

// No depende directamente de:
// CreateProjectStrategy, PredictProjectStrategy, etc.
```

---

## 🆚 Comparación: Antes vs Después

| Aspecto | Sin Factory | Con Factory |
|---------|-------------|-------------|
| **Dependencias del servicio** | 3+ (una por estrategia) | 1 (solo el Factory) |
| **Creación de estrategias** | Manual e estática | Dinámica por tipo |
| **Agregar nueva estrategia** | Modificar servicio + controller | Solo modificar Factory |
| **Descubrimiento** | No disponible | `GET /strategies` |
| **Endpoint unificado** | No disponible | `POST /execute` |
| **Validación de tipos** | Manual | Automática en Factory |
| **Testeo** | Mock de cada estrategia | Mock del Factory |
| **Escalabilidad** | Baja (crece linealmente) | Alta (crece logarítmicamente) |

---

## 📚 Patrones relacionados

### Factory + Strategy

Nuestro sistema combina ambos:

- **Strategy Pattern**: Define cómo ejecutar diferentes algoritmos (Create, Predict, Optimize)
- **Factory Pattern**: Define cómo obtener/crear esas estrategias

```
Factory provee → Strategy ejecuta
```

### Factory + Chain of Responsibility

Las estrategias usan procesadores del Chain of Responsibility:

```
Factory → Strategy → Chain of Processors
```

### Otros patrones complementarios

1. **Abstract Factory**: Si necesitaras familias de estrategias relacionadas
2. **Builder**: Si las estrategias necesitaran construcción compleja
3. **Singleton**: Si el Factory debiera tener una única instancia (ya lo hace NestJS)

---

## 💡 Mejores prácticas

### ✅ DO (Hacer)

1. **Registrar todas las estrategias en el constructor**
   ```typescript
   constructor(...allStrategies) {
     this.strategies = new Map([...]);
   }
   ```

2. **Validar tipos desconocidos**
   ```typescript
   if (!strategy) {
     throw new BadRequestException(`Unknown: ${type}`);
   }
   ```

3. **Usar TypeScript para type-safety**
   ```typescript
   export type StrategyType = 'create' | 'predict' | 'optimize';
   ```

4. **Proporcionar mensajes de error útiles**
   ```typescript
   throw new Error(
     `Unknown strategy: ${type}. Available: ${available.join(', ')}`
   );
   ```

5. **Documentar las estrategias disponibles**
   ```typescript
   @Get('strategies')
   async getStrategies() {
     return {
       strategies: [...],
       description: { create: '...', predict: '...', ... }
     };
   }
   ```

### ❌ DON'T (No hacer)

1. **No crear estrategias con `new` fuera del Factory**
   ```typescript
   // ❌ Mal
   const strategy = new CreateProjectStrategy(...);
   
   // ✅ Bien
   const strategy = factory.getStrategy('create');
   ```

2. **No agregar lógica de negocio al Factory**
   ```typescript
   // ❌ Mal - el Factory no debe tener lógica de ejecución
   class Factory {
     execute(type, data) {
       const strategy = this.getStrategy(type);
       // ... lógica compleja aquí
     }
   }
   
   // ✅ Bien - el Factory solo crea/retorna
   class Factory {
     getStrategy(type) {
       return this.strategies.get(type);
     }
   }
   ```

3. **No hardcodear strings de estrategias**
   ```typescript
   // ❌ Mal
   const strategy = factory.getStrategy('create');
   
   // ✅ Bien
   const type: StrategyType = 'create';
   const strategy = factory.getStrategy(type);
   ```

4. **No olvidar registrar nuevas estrategias**
   ```typescript
   // ❌ Olvidaste registrar en el Map
   constructor(private readonly newStrategy: NewStrategy) {
     this.strategies = new Map([
       // ... olvidaste agregar ['new', this.newStrategy]
     ]);
   }
   ```

5. **No retornar `null` o `undefined`**
   ```typescript
   // ❌ Mal
   getStrategy(type) {
     return this.strategies.get(type) || null;
   }
   
   // ✅ Bien - lanza error
   getStrategy(type) {
     const strategy = this.strategies.get(type);
     if (!strategy) throw new Error(...);
     return strategy;
   }
   ```

---

## 🎬 Casos de uso reales

### 1. Admin panel dinámico

```typescript
// Frontend obtiene estrategias disponibles
const response = await fetch('/gemini/strategies');
const { strategies } = await response.json();

// Construye UI dinámicamente
strategies.forEach(strategy => {
  createButton(strategy, () => {
    executeStrategy(strategy, data);
  });
});
```

### 2. A/B Testing de estrategias

```typescript
// Probar diferentes estrategias para el mismo input
const strategies = ['create', 'create_v2', 'create_experimental'];
const results = await Promise.all(
  strategies.map(type => 
    service.executeStrategy(type, { userInput })
  )
);

// Comparar resultados
compareAndSelectBest(results);
```

### 3. Pipeline de procesamiento

```typescript
// Ejecutar múltiples estrategias en secuencia
async function processProject(projectId: string) {
  // 1. Predecir nuevas tareas
  await service.executeStrategy('predict', { projectId });
  
  // 2. Optimizar el resultado
  await service.executeStrategy('optimize', { projectId });
  
  // 3. Analizar viabilidad
  await service.executeStrategy('analyze', { projectId });
}
```

### 4. Webhooks configurables

```typescript
// Permitir a usuarios configurar qué estrategia ejecutar via webhook
@Post('webhook/:strategyType')
async handleWebhook(
  @Param('strategyType') strategyType: string,
  @Body() data: any
) {
  if (!this.factory.hasStrategy(strategyType)) {
    throw new BadRequestException('Invalid strategy');
  }
  
  return await this.service.executeStrategy(strategyType as any, data);
}
```

---

## 📖 Recursos adicionales

### Documentación relacionada

- [Strategy Pattern Documentation](./STRATEGY_PATTERN.md)
- [Chain of Responsibility Documentation](./CHAIN_OF_RESPONSIBILITY.md)

### Referencias externas

- [Refactoring Guru - Factory Method](https://refactoring.guru/design-patterns/factory-method)
- [Gang of Four - Design Patterns](https://en.wikipedia.org/wiki/Design_Patterns)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
- [NestJS Dependency Injection](https://docs.nestjs.com/fundamentals/custom-providers)

---

## ✨ Conclusión

El patrón Factory transformó la gestión de estrategias de:

### Antes:
- ❌ Múltiples dependencias en el servicio
- ❌ Creación estática y manual
- ❌ Sin capacidad de descubrimiento
- ❌ Difícil de extender

### Después:
- ✅ Una sola dependencia (Factory)
- ✅ Creación dinámica por tipo
- ✅ Descubrimiento automático (`GET /strategies`)
- ✅ Endpoint unificado (`POST /execute`)
- ✅ Fácil agregar nuevas estrategias
- ✅ Type-safe con TypeScript
- ✅ Testeable y mantenible

El Factory Pattern, combinado con Strategy y Chain of Responsibility, proporciona una arquitectura **flexible, escalable y profesional** para gestionar operaciones con IA de forma elegante.