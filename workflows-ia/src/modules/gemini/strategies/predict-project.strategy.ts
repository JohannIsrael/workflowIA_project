import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseGeminiStrategy, StrategyContext, StrategyResult } from './base/gemini-strategy.interface';
import { WORKFLOW_PREDICT_PROMPT } from '../entities/prompts/Predict';
import { GoogleGenAI } from '@google/genai';
import { Projects } from '../entities/Projects.entity';
import { Tasks } from '../entities/Tasks.entity';
import { JsonCleanerProcessor } from '../processors/json-cleaner.processor';
import { JsonParserProcessor } from '../processors/json-parser.processor';

@Injectable()
export class PredictProjectStrategy extends BaseGeminiStrategy {
  constructor(
    private readonly genAI: GoogleGenAI,
    private readonly jsonCleaner: JsonCleanerProcessor,
    private readonly jsonParser: JsonParserProcessor,
    @InjectRepository(Projects) 
    private readonly projectsRepository: Repository<Projects>,
    @InjectRepository(Tasks) 
    private readonly tasksRepository: Repository<Tasks>,
  ) {
    super();
  }

  getPrompt(): string {
    return WORKFLOW_PREDICT_PROMPT;
  }

  validate(context: StrategyContext): void {
    super.validate(context);
    if (!context.existingProject) {
      throw new BadRequestException('existingProject is required for Predict strategy');
    }
  }

  async execute(context: StrategyContext): Promise<StrategyResult> {
    this.validate(context);

    const prompt = this.buildPromptWithContext(this.getPrompt(), context);
    const rawResponse = await this.generateContent(prompt);

    const parsed = await this.parseResponse(rawResponse);

    const updatedProject = await this.mergeWithExisting(
      context.existingProject!,
      parsed
    );

    // Extract metadata that was attached during merge
    const metadata = (updatedProject as any).__metadata || {};
    delete (updatedProject as any).__metadata;

    return {
      action: 'predict',
      project: updatedProject,
      metadata: {
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

  private async mergeWithExisting(
    existing: Projects,
    predictions: any
  ): Promise<Projects> {
    const updatedFields: string[] = [];

    // Update sprintsQuantity if provided
    if (predictions.sprintsQuantity !== undefined && predictions.sprintsQuantity !== null) {
      const newValue = Number(predictions.sprintsQuantity);
      if (Number.isFinite(newValue) && newValue !== existing.sprintsQuantity) {
        existing.sprintsQuantity = newValue;
        updatedFields.push('sprintsQuantity');
      }
    }

    // Update endDate if provided
    if (predictions.endDate !== undefined && predictions.endDate !== null) {
      const newDate = String(predictions.endDate);
      if (newDate !== existing.endDate) {
        existing.endDate = newDate;
        updatedFields.push('endDate');
      }
    }

    // Add NEW tasks (merge with existing)
    const newTasks: Tasks[] = [];
    const tasksArray = predictions.Tasks || predictions.tasks || [];
    
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

      // MERGE: mantener tareas existentes + agregar nuevas
      existing.tasks = [...(existing.tasks || []), ...newTasks];
    }

    // Save updated project
    const saved = await this.projectsRepository.save(existing);
    
    // Attach metadata temporarily (will be extracted in execute())
    (saved as any).__metadata = {
      fieldsUpdated: updatedFields,
      tasksAdded: newTasks.length
    };

    return saved;
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