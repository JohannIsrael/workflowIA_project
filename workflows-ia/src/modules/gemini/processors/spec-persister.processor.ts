import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BaseSpecProcessor } from './base/spec-processor.interface';
import { Projects } from '../entities/Projects.entity';
import { Tasks } from '../entities/Tasks.entity';
import { NormalizedSpec } from './spec-normalizer.processor';

export interface PersistedResult {
  isSingle: boolean;
  projects: Projects[];
}

@Injectable()
export class SpecPersisterProcessor extends BaseSpecProcessor<NormalizedSpec, PersistedResult> {
  constructor(
    @InjectRepository(Projects) 
    private readonly projectsRepository: Repository<Projects>,
    @InjectRepository(Tasks) 
    private readonly tasksRepository: Repository<Tasks>,
    private readonly dataSource: DataSource,
  ) {
    super();
  }

  protected async handle(normalized: NormalizedSpec): Promise<PersistedResult> {
    const saved = await this.dataSource.transaction(async manager => {
      const projRepo = manager.getRepository(Projects);
      const results: Projects[] = [];

      for (const p of normalized.projects) {
        const project = new Projects();
        project.name = p.name;
        project.priority = p.priority ?? null;
        project.backtech = p.backtech ?? null;
        project.fronttech = p.fronttech ?? null;
        project.cloudTech = p.cloudTech ?? null;
        project.sprintsQuantity = this.parseIntOrNull(p.sprintsQuantity);
        project.endDate = p.endDate ?? null;

        project.tasks = (p.tasks ?? []).map((t) => {
          const task = new Tasks();
          task.name = t.name;
          task.description = t.description;
          task.assignedTo = t.assignedTo ?? null;
          task.sprint = this.parseIntOrNull(t.sprint);
          return task;
        });

        const savedProject = await projRepo.save(project);
        results.push(savedProject);
      }

      return results;
    });

    return {
      isSingle: normalized.isSingle,
      projects: saved
    };
  }

  private parseIntOrNull(v: any): number | null {
    if (v === null || v === undefined || v === '') return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
}