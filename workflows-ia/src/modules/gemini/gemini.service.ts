import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateGeminiDto } from './dto/create-gemini.dto';
import { UpdateGeminiDto } from './dto/update-gemini.dto';
import { GoogleGenAI } from '@google/genai';
import { WORKFLOW_CREATE_PROMPT } from './entities/prompts/Create';
import { Projects } from './entities/Projects.entity';
import { Tasks } from './entities/Tasks.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Console } from 'console';

@Injectable()
export class GeminiService {
    private genAI: GoogleGenAI;
    private rules = WORKFLOW_CREATE_PROMPT;


    constructor(
      @InjectRepository(Projects) private readonly projectsRepository: Repository<Projects>,
      @InjectRepository(Tasks) private readonly tasksRepository: Repository<Tasks>,
      private readonly dataSource: DataSource,
    ) {
      this.genAI = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
      });
    }


    async generateProjectSpec(userInput: string) {
    const response = await this.genAI.models.generateContent({
      model: 'gemini-2.5-flash', 
      contents: `${this.rules}\n\nUser idea: ${userInput}`,
    });

    const text = (response.text ?? '').trim();

    if (!text) {
      throw new Error('Empty response from Gemini');
    }
    const persisted = await this.ingestGeminiSpec(text);
    return persisted;
  }

  /** Extrae el primer bloque { ... } balanceado del texto. */
private extractBalancedJsonBlock(text: string): string {
  const s = (text ?? '').replace(/\uFEFF/g, '');
  const start = s.indexOf('{');
  if (start < 0) return '';

  let i = start, depth = 0, inStr: '"' | "'" | null = null, esc = false;
  for (; i < s.length; i++) {
    const ch = s[i];

    if (inStr) {
      if (esc) { esc = false; continue; }
      if (ch === '\\') { esc = true; continue; }
      if (ch === inStr) inStr = null;
      continue;
    }
    if (ch === '"' || ch === "'") { inStr = ch as '"' | "'"; continue; }
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return s.slice(start, i + 1);
    }
  }
  return s.slice(start);
}

/** Reemplaza saltos de línea crudos dentro de strings por espacio (para que el JSON sea parseable). */
private collapseNewlinesInsideStrings(text: string): string {
  let out = '';
  let inStr = false;
  let esc = false;
  for (const ch of text) {
    if (inStr) {
      if (esc) { out += ch; esc = false; continue; }
      if (ch === '\\') { out += ch; esc = true; continue; }
      if (ch === '\n' || ch === '\r') { out += ' '; continue; }
      if (ch === '"') { inStr = false; out += ch; continue; }
      out += ch; continue;
    }
    if (ch === '"') { inStr = true; out += ch; continue; }
    out += ch;
  }
  return out;
}

/** Limpia JSON “sucio” de LLM y lo parsea con tolerancia. */
private cleanAndParseJson(raw: string): any {
  if (!raw || typeof raw !== 'string') throw new BadRequestException('Respuesta vacía');

  let cleaned = raw
    .replace(/```(?:json)?/gi, '')
    .replace(/```/g, '')
    .replace(/\r\n/g, '\n')
    .trim();

  cleaned = this.extractBalancedJsonBlock(cleaned) || cleaned;

  // 👇 muy importante para tu payload:
  cleaned = this.collapseNewlinesInsideStrings(cleaned);

  // 👇 no borra contenido dentro de strings:
  cleaned = this.stripCommentsSafely(cleaned);

  // normaliza comillas tipográficas
  cleaned = cleaned.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");

  // keys sin comillas
  cleaned = cleaned.replace(/([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)(\s*:)/g, '$1"$2"$3');

  // comas colgantes
  cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');

  // valores con '...' seguros
  cleaned = this.convertSingleQuotedValuesSafely(cleaned);

  // NaN/Infinity → null
  cleaned = cleaned.replace(/\bNaN|Infinity|-Infinity\b/g, 'null');

  try {
    const parsed = JSON.parse(cleaned);
    const rawTasks = parsed.Tasks ?? parsed.tasks ?? [];
    return parsed;
  } catch (e: any) {
    const msg: string = e.message || 'JSON inválido';
    const m = msg.match(/position\s+(\d+)/i);
    if (m) {
      const pos = Number(m[1]);
      const start = Math.max(0, pos - 30);
      const end = Math.min(cleaned.length, pos + 30);
      const snippet = cleaned.slice(start, end);
      throw new BadRequestException(`JSON inválido: ${msg}. Contexto: “…${snippet}…”`);
    }
    throw new BadRequestException(`JSON inválido: ${msg}`);
  }
}

/** Acepta {project}, {projects:[...]}, o un objeto plano. Normaliza claves y tipos. */
private normalizeSpec(json: any): { isSingle: boolean; projects: any[] } {
  let isSingle = false;
  let projects: any[] = [];

  // orígenes posibles
  if (Array.isArray(json?.projects)) projects = json.projects;
  else if (json?.project && typeof json.project === 'object') { projects = [json.project]; isSingle = true; }
  else if (json && typeof json === 'object') { projects = [json]; isSingle = true; }
  else throw new BadRequestException('Estructura no reconocida');

  // normalizar cada proyecto
  projects = projects.map((p0) => {
    const p = { ...p0 };

    // alias de nombre
    p.name = p.name ?? p.projectName ?? p.project_name;

    // back-end tech
    p.backtech = p.backtech ?? p.backTech ?? p.back_tech;

    // front-end tech
    p.fronttech = p.fronttech ?? p.frontTech ?? p.front_tech;

    // cloud
    p.cloudTech = p.cloudTech ?? p.cloud_tech ?? p.cloud;

    // sprints
    p.sprintsQuantity = p.sprintsQuantity ?? p.sprints_quantity;

    // tasks (acepta Tasks/tasks)
    p.tasks = p.tasks ?? p.Tasks ?? [];

    // tipado/limpieza
    if (p.priority !== undefined && p.priority !== null) {
      // tu columna es varchar → guardamos String(priority)
      p.priority = String(p.priority);
    }
    if (p.endDate !== undefined && p.endDate !== null) {
      p.endDate = String(p.endDate);
    }

    // normalizar tareas
    p.tasks = (Array.isArray(p.tasks) ? p.tasks : []).map((t0: any) => {
      const t = { ...t0 };
      t.name = t.name ?? t.taskName ?? t.title;
      t.description = this.safeText(
          t.description ?? t.desc ?? t.details ?? t.summary ??
          t.about ?? t.overview ?? t.notes ?? t.note ?? t.text ??
          t.body ?? t.content ?? t.acceptanceCriteria ?? t.AcceptanceCriteria ??
          t.criteria ?? t.bullets ?? t.items
        );
        t.assignedTo = t.assignedTo ?? t.assigned_to ?? null;
      t.sprint = (t.sprint === '' || t.sprint === null || t.sprint === undefined) ? null : Number(t.sprint);
      if (!Number.isFinite(t.sprint)) t.sprint = null;
      return t;
    });

    return p;
  });

  // validaciones mínimas
  projects.forEach((p, i) => {
    if (!p?.name) throw new BadRequestException(`Proyecto #${i + 1}: "name" es obligatorio`);
    (p.tasks ?? []).forEach((t: any, j: number) => {
      if (!t?.name) throw new BadRequestException(`Proyecto #${i + 1}, tarea #${j + 1}: "name" es obligatorio`);
    });
  });

  return { isSingle, projects };
}

private parseIntOrNull(v: any): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

private async ingestGeminiSpec(rawText: string): Promise<Projects[] | Projects> {
  const json = this.cleanAndParseJson(rawText);
  const normalized = this.normalizeSpec(json);

  const saved = await this.dataSource.transaction(async manager => {
    const projRepo = manager.getRepository(Projects);
    const results: Projects[] = [];

    for (const p of normalized.projects) {
      const project = new Projects();
      project.name = p.name;
      project.priority = p.priority ?? null;                // varchar en tu DB
      project.backtech = p.backtech ?? null;
      project.fronttech = p.frontTech ?? null;
      project.cloudTech = p.cloudTech ?? null;
      project.sprintsQuantity = this.parseIntOrNull(p.sprintsQuantity);
      project.endDate = p.endDate ?? null;                  // tu columna es varchar

      project.tasks = (p.tasks ?? []).map((t: any) => {
        const task = new Tasks();
        task.name = t.name;
        task.description = this.safeText(t.description ?? this.asPlainText(
          t.desc ?? t.details ?? t.summary ?? t.text ?? t.body ?? t.acceptanceCriteria
        ));
        task.assignedTo = t.assignedTo ?? null;
        task.sprint = this.parseIntOrNull(t.sprint);
        return task; // se asocian por cascade
      });
      const savedProject = await projRepo.save(project);
      results.push(savedProject);
    }

    return results;
  });

  return normalized.isSingle ? saved[0] : saved;
}

/** Convierte valores 'entre comillas simples' a "dobles" SOLAMENTE cuando son literales JSON.
 *  No toca apóstrofes dentro de palabras ni textos ya entre comillas dobles. */
private stripCommentsSafely(text: string): string {
  let out = '';
  let inStr = false, esc = false, inBlock = false, maybeLine = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = i + 1 < text.length ? text[i + 1] : '';

    if (inStr) {
      if (esc) { out += ch; esc = false; continue; }
      if (ch === '\\') { out += ch; esc = true; continue; }
      if (ch === '"') { inStr = false; out += ch; continue; }
      out += ch; continue;
    }

    if (inBlock) {
      if (ch === '*' && next === '/') { inBlock = false; i++; }
      continue; // no escribas nada del bloque
    }

    // inicio de cadena
    if (ch === '"') { inStr = true; out += ch; continue; }

    // /* ... */
    if (ch === '/' && next === '*') { inBlock = true; i++; continue; }

    // // ... (solo si no estamos en cadena)
    if (ch === '/' && next === '/') {
      // saltar hasta fin de línea
      while (i < text.length && text[i] !== '\n') i++;
      continue;
    }

    out += ch;
  }
  return out;
}

/** Convierte 'literal' → "literal" SOLO cuando es un valor JSON; nunca toca apóstrofes en palabras. */
private convertSingleQuotedValuesSafely(jsonLike: string): string {
  let out = '';
  let inDouble = false;
  let inSingle = false;
  let esc = false;

  const isWs = (c: string) => c === ' ' || c === '\t' || c === '\n' || c === '\r';

  for (let i = 0; i < jsonLike.length; i++) {
    const ch = jsonLike[i];

    if (esc) { out += ch; esc = false; continue; }
    if (ch === '\\') { out += ch; esc = true; continue; }

    if (inDouble) {
      if (ch === '"') inDouble = false;
      out += ch; continue;
    }
    if (inSingle) {
      if (ch === "'") { inSingle = false; out += '"'; }
      else out += ch;
      continue;
    }

    if (ch === '"') { inDouble = true; out += ch; continue; }
    if (ch === "'") {
      // ¿parece inicio de valor? mira el último char significativo emitido
      let j = out.length - 1; while (j >= 0 && isWs(out[j])) j--;
      const prev = j >= 0 ? out[j] : '';
      if (prev === ':' || prev === '[' || prev === ',' || prev === '{') {
        inSingle = true; out += '"';
      } else {
        out += "'"; // apóstrofe normal en palabras (user's)
      }
      continue;
    }

    out += ch;
  }
  return out;
}

private asPlainText(value: any): string | null {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value)) {
    const joined = value
      .map(v => (v ?? '').toString().replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      .join(' • ');
    return joined || null;
  }
  if (typeof value === 'object') {
    const cand = value.long ?? value.full ?? value.description ?? value.desc ??
                 value.details ?? value.summary ?? value.text ?? value.short ?? value.body;
    if (cand !== undefined) return this.asPlainText(cand);
    try { const s = JSON.stringify(value); return s || null; } catch { return null; }
  }
  const s = String(value).replace(/\s+/g, ' ').trim();
  return s || null;
}

private pickDescription(obj: any): string | null {
  if (!obj || typeof obj !== 'object') return null;

  // candidatos en orden de preferencia
  const candidates = [
    obj.description, obj.desc, obj.details, obj.summary, obj.about, obj.overview,
    obj.notes, obj.note, obj.text, obj.body, obj.content,
    obj.Description, obj.Details, obj.Summary,
    obj.acceptanceCriteria, obj.AcceptanceCriteria, obj.criteria, obj.bullets, obj.items
  ];

  for (const c of candidates) {
    const t = this.asPlainText(c);
    if (t) return t;
  }
  return null;
}

/** compacta y recorta, pero NO lo convierte a null si hay texto */
private safeText(v: any, max = 4000): string | null {
  const s = this.asPlainText(v);
  if (!s) return null;
  return s.length > max ? s.slice(0, max) : s;
}


}
