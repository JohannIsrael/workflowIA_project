# 🔗 Chain of Responsibility en tu código

## ¿Qué es Chain of Responsibility?

Es un patrón de diseño que permite **pasar una solicitud a través de una cadena de manejadores**. Cada manejador decide si procesa la solicitud y/o la pasa al siguiente.

---

## 📐 Estructura del código

### 1️⃣ La Interface Base (`ISpecProcessor`)

```typescript
export interface ISpecProcessor<TIn = any, TOut = any> {
  setNext(processor: ISpecProcessor): ISpecProcessor;  // 🔗 Conecta el siguiente
  process(input: TIn): Promise<TOut> | TOut;           // ⚙️ Procesa y pasa al siguiente
}
```

**Propósito:**
- Define el contrato que todos los procesadores deben cumplir
- Permite encadenar procesadores de forma uniforme

---

### 2️⃣ La Clase Abstracta (`BaseSpecProcessor`)

```typescript
export abstract class BaseSpecProcessor<TIn = any, TOut = any> {
  private nextProcessor: ISpecProcessor | null = null;  // 👉 Referencia al siguiente

  public setNext(processor: ISpecProcessor): ISpecProcessor {
    this.nextProcessor = processor;  // Conecta el siguiente eslabón
    return processor;                 // Permite encadenar: a.setNext(b).setNext(c)
  }

  public async process(input: TIn): Promise<TOut> {
    const result = await this.handle(input);  // 1. Procesa con lógica propia
    
    if (this.nextProcessor) {
      return this.nextProcessor.process(result);  // 2. Pasa al siguiente
    }
    
    return result as TOut;  // 3. Si es el último, retorna
  }

  protected abstract handle(input: TIn): Promise<any> | any;  // Cada hijo implementa esto
}
```

**Propósito:**
- Implementa la lógica de encadenamiento
- Cada procesador solo implementa `handle()` con su lógica específica
- La propagación al siguiente es automática

---

## 🔄 Flujo completo en tu aplicación

### Construcción de la cadena (en `GeminiService`)

```typescript
private buildProcessingChain(): ISpecProcessor {
  this.jsonCleaner              // Paso 1: Limpia el JSON
    .setNext(this.jsonParser)   // ↓ Paso 2: Parsea a objeto
    .setNext(this.specNormalizer) // ↓ Paso 3: Normaliza estructura
    .setNext(this.specPersister);  // ↓ Paso 4: Guarda en BD

  return this.jsonCleaner;  // Retorna el primer eslabón
}
```

**Explicación del encadenamiento:**
- `setNext()` retorna el procesador que acabas de conectar
- Esto permite la sintaxis fluida: `.setNext(a).setNext(b).setNext(c)`
- Es como construir una tubería donde cada sección se conecta a la siguiente

---

### Ejecución de la cadena

```typescript
async generateProjectSpec(userInput: string) {
  const rawResponse = await this.generateContent(userInput);  // Gemini genera texto
  
  // Inicia la cadena con el texto crudo
  const result = await this.processingChain.process(rawResponse);
  //                        ⬆️ Empieza aquí
  
  return result.isSingle ? result.projects[0] : result.projects;
}
```

---

## 📊 Diagrama de flujo visual

```
┌─────────────────────┐
│  User Input         │
│  "Create a web app" │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Gemini AI          │ ← Genera JSON (puede venir sucio)
│  generateContent()  │
└──────────┬──────────┘
           │
           ▼
     Raw Text: ```json { projectName: 'App', ... } ```
           │
           ▼
┌─────────────────────────────┐
│ 1️⃣ JsonCleanerProcessor    │ ← handle(): Limpia markdown, comillas, etc.
│    .handle(rawText)         │
└──────────┬──────────────────┘
           │
     Cleaned: { "projectName": "App", ... }
           │
           ▼ nextProcessor.process(cleaned)
┌─────────────────────────────┐
│ 2️⃣ JsonParserProcessor      │ ← handle(): JSON.parse()
│    .handle(cleanedJson)     │
└──────────┬──────────────────┘
           │
     Parsed: { projectName: "App", tasks: [...] }
           │
           ▼ nextProcessor.process(parsed)
┌─────────────────────────────┐
│ 3️⃣ SpecNormalizerProcessor  │ ← handle(): Valida y normaliza campos
│    .handle(parsedJson)      │
└──────────┬──────────────────┘
           │
     Normalized: { isSingle: true, projects: [{ name, tasks, ... }] }
           │
           ▼ nextProcessor.process(normalized)
┌─────────────────────────────┐
│ 4️⃣ SpecPersisterProcessor   │ ← handle(): Guarda en base de datos
│    .handle(normalizedSpec)  │
└──────────┬──────────────────┘
           │
     Persisted: { isSingle: true, projects: [ProjectEntity] }
           │
           ▼
┌─────────────────────┐
│  Result to User     │
│  Project Entity     │
└─────────────────────┘
```

---

## 🎯 ¿Por qué es Chain of Responsibility?

### ✅ Características del patrón presentes:

1. **Cadena de objetos**: Cada procesador conoce al siguiente
2. **Responsabilidad única**: Cada uno hace UNA cosa
3. **Propagación**: Los datos fluyen de uno a otro automáticamente
4. **Desacoplamiento**: Cada procesador no sabe qué viene antes o después
5. **Extensibilidad**: Puedes agregar/quitar eslabones fácilmente

---

## 🔧 Ejemplo de cómo agregar un nuevo procesador

Imagina que quieres agregar logging entre pasos:

```typescript
// Nuevo procesador: Logger
@Injectable()
export class LoggerProcessor extends BaseSpecProcessor<any, any> {
  protected handle(input: any): any {
    console.log('Processing:', JSON.stringify(input).slice(0, 100));
    return input;  // Solo loguea, no transforma
  }
}
```

**Agregarlo a la cadena:**

```typescript
// En gemini.module.ts - agregar al providers
providers: [
  GeminiService,
  JsonCleanerProcessor,
  JsonParserProcessor,
  LoggerProcessor,           // 👈 Nuevo
  SpecNormalizerProcessor,
  SpecPersisterProcessor,
]

// En gemini.service.ts - inyectar
constructor(
  private readonly jsonCleaner: JsonCleanerProcessor,
  private readonly jsonParser: JsonParserProcessor,
  private readonly logger: LoggerProcessor,  // 👈 Nuevo
  private readonly specNormalizer: SpecNormalizerProcessor,
  private readonly specPersister: SpecPersisterProcessor,
) {
  // ...
}

// En buildProcessingChain() - agregar a la cadena
private buildProcessingChain(): ISpecProcessor {
  this.jsonCleaner
    .setNext(this.jsonParser)
    .setNext(this.logger)           // 👈 Nuevo eslabón
    .setNext(this.specNormalizer)
    .setNext(this.specPersister);

  return this.jsonCleaner;
}
```

---

