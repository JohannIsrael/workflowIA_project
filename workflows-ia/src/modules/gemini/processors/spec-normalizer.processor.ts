import { Injectable, BadRequestException } from '@nestjs/common';
import { BaseSpecProcessor } from './base/spec-processor.interface';

export interface NormalizedSpec {
  isSingle: boolean;
  projects: NormalizedProject[];
}

export interface NormalizedProject {
  name: string;
  priority?: string | null;
  backtech?: string | null;
  fronttech?: string | null;
  cloudTech?: string | null;
  sprintsQuantity?: number | null;
  endDate?: string | null;
  tasks: NormalizedTask[];
}

export interface NormalizedTask {
  name: string;
  description: string | null;
  assignedTo?: string | null;
  sprint?: number | null;
}

@Injectable()
export class SpecNormalizerProcessor extends BaseSpecProcessor<any, NormalizedSpec> {
  protected handle(json: any): NormalizedSpec {
    let isSingle = false;
    let projects: any[] = [];

    if (Array.isArray(json?.projects)) {
      projects = json.projects;
    } else if (json?.project && typeof json.project === 'object') {
      projects = [json.project];
      isSingle = true;
    } else if (json && typeof json === 'object') {
      projects = [json];
      isSingle = true;
    } else {
      throw new BadRequestException('Estructura no reconocida');
    }

    projects = projects.map((p0) => {
      const p = { ...p0 };
      
      p.name = p.name ?? p.projectName ?? p.project_name;
      p.backtech = p.backtech ?? p.backTech ?? p.back_tech;
      p.fronttech = p.fronttech ?? p.frontTech ?? p.front_tech;
      p.cloudTech = p.cloudTech ?? p.cloud_tech ?? p.cloud;
      p.sprintsQuantity = p.sprintsQuantity ?? p.sprints_quantity;
      p.tasks = p.tasks ?? p.Tasks ?? [];

      if (p.priority !== undefined && p.priority !== null) {
        p.priority = String(p.priority);
      }

      if (p.endDate !== undefined && p.endDate !== null) {
        p.endDate = String(p.endDate);
      }

      p.tasks = (Array.isArray(p.tasks) ? p.tasks : []).map((t0: any) => {
        const t = { ...t0 };
        t.name = t.name ?? t.taskName ?? t.title;
        t.description = this.safeText(t.description);
        t.assignedTo = t.assignedTo ?? t.assigned_to ?? null;
        
        t.sprint = (t.sprint === '' || t.sprint === null || t.sprint === undefined) 
          ? null 
          : Number(t.sprint);
        
        if (!Number.isFinite(t.sprint)) {
          t.sprint = null;
        }
        
        return t;
      });

      return p;
    });

    projects.forEach((p, i) => {
      if (!p?.name) {
        throw new BadRequestException(`Proyecto #${i + 1}: "name" es obligatorio`);
      }
      
      (p.tasks ?? []).forEach((t: any, j: number) => {
        if (!t?.name) {
          throw new BadRequestException(
            `Proyecto #${i + 1}, tarea #${j + 1}: "name" es obligatorio`
          );
        }
      });
    });

    return { isSingle, projects };
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
      
      try {
        const s = JSON.stringify(value);
        return s || null;
      } catch {
        return null;
      }
    }
    
    const s = String(value).replace(/\s+/g, ' ').trim();
    return s || null;
  }

  private safeText(v: any, max = 4000): string | null {
    const s = this.asPlainText(v);
    if (!s) return null;
    return s.length > max ? s.slice(0, max) : s;
  }
}