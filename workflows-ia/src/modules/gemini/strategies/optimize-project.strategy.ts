import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { BaseGeminiStrategy, StrategyContext, StrategyResult } from './base/gemini-strategy.interface';
import { WORKFLOW_OPTIMIZE_PROMPT } from '../entities/prompts/Optimize';
import { GoogleGenAI } from '@google/genai';
import { Projects } from '../entities/Projects.entity';
import { Tasks } from '../entities/Tasks.entity';
import { JsonCleanerProcessor } from '../processors/json-cleaner.processor';
import { JsonParserProcessor } from '../processors/json-parser.processor';

@Injectable()
export class OptimizeProjectStrategy extends BaseGeminiStrategy {
  constructor(
    private readonly genAI: GoogleGenAI,
    private readonly jsonCleaner: JsonCleanerProcessor,
    private readonly jsonParser: JsonParserProcessor,
    @InjectRepository(Projects) 
    private readonly projectsRepository: Repository<Projects>,
    @InjectRepository(Tasks) 
    private readonly tasksRepository: Repository<Tasks>,
    private readonly dataSource: DataSource,
  ) {
    super();
  }

  getPrompt(): string {
    return WORKFLOW_OPTIMIZE_PROMPT;
  }

  validate(context: StrategyContext): void {
    super.validate(context);
    if (!context.existingProject) {
      throw new BadRequestException('existingProject is required for Optimize strategy');
    }
  }

  async execute(context: StrategyContext): Promise<StrategyResult> {
    this.validate(context);

    const prompt = this.buildPromptWithContext(this.getPrompt(), context);
    const rawResponse = await this.generateContent(prompt);

    const parsed = await this.parseResponse(rawResponse);

    const optimizedProject = await this.replaceAllTasks(
      context.existingProject!,
      parsed
    );

    // Extract metadata that was attached during transaction
    const metadata = (optimizedProject as any).__metadata || {};
    delete (optimizedProject as any).__metadata;

    return {
      action: 'optimize',
      project: optimizedProject,
      metadata: {
        tasksRemoved: metadata.tasksRemoved || 0,
        tasksAdded: metadata.tasksAdded || 0,
        fieldsUpdated: metadata.fieldsUpdated || [],
      }
    };
  }

  private async generateContent(prompt: string): Promise<string> {
    const response = await this.genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = (response.text ?? '').trim();
    if (!text) {
      throw new Error('Empty response from Gemini');
    }

    return text;
  }

  private async parseResponse(rawResponse: string): Promise<any> {
    // Accede directamente a handle() - IMPORTANTE: debe ser público
    const cleaned = this.jsonCleaner['handle'](rawResponse);
    const parsed = this.jsonParser['handle'](cleaned);
    return parsed;
  }

  private async replaceAllTasks(
    existing: Projects,
    optimizations: any
  ): Promise<Projects> {
    return await this.dataSource.transaction(async manager => {
      const taskRepo = manager.getRepository(Tasks);
      const projectRepo = manager.getRepository(Projects);

      const oldTasksCount = existing.tasks?.length || 0;
      const updatedFields: string[] = [];

      // 1. DELETE all existing tasks
      if (existing.tasks && existing.tasks.length > 0) {
        await taskRepo.remove(existing.tasks);
        existing.tasks = [];
      }

      // 2. Update sprintsQuantity if provided
      if (optimizations.sprintsQuantity !== undefined && optimizations.sprintsQuantity !== null) {
        const newValue = Number(optimizations.sprintsQuantity);
        if (Number.isFinite(newValue) && newValue !== existing.sprintsQuantity) {
          existing.sprintsQuantity = newValue;
          updatedFields.push('sprintsQuantity');
        }
      }

      // 3. Update endDate if provided
      if (optimizations.endDate !== undefined && optimizations.endDate !== null) {
        const newDate = String(optimizations.endDate);
        if (newDate !== existing.endDate) {
          existing.endDate = newDate;
          updatedFields.push('endDate');
        }
      }

      // 4. Create NEW optimized tasks (replaces all)
      const newTasks: Tasks[] = [];
      const tasksArray = optimizations.Tasks || optimizations.tasks || [];
      
      if (Array.isArray(tasksArray) && tasksArray.length > 0) {
        for (const t of tasksArray) {
          const task = new Tasks();
          task.name = t.name || t.taskName;
          task.description = this.safeString(t.description);
          task.assignedTo = this.safeString(t.assignedTo);
          task.sprint = this.parseIntOrNull(t.sprint);
          task.project = existing;
          newTasks.push(task);
        }

        existing.tasks = newTasks;
      }

      // 5. Save updated project with new tasks
      const saved = await projectRepo.save(existing);

      // Attach metadata temporarily
      (saved as any).__metadata = {
        tasksRemoved: oldTasksCount,
        tasksAdded: newTasks.length,
        fieldsUpdated: updatedFields
      };

      return saved;
    });
  }

  private parseIntOrNull(v: any): number | null {
    if (v === null || v === undefined || v === '') return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  private safeString(v: any): string | null {
    if (v === null || v === undefined) return null;
    const s = String(v).trim();
    return s || null;
  }
}
