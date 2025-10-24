import { Projects } from '../../entities/Projects.entity';

export interface StrategyContext {
  userInput?: string;
  existingProject?: Projects;
  additionalData?: any;
}

export interface StrategyResult {
  action: 'create' | 'predict' | 'optimize';
  project: Projects | Projects[];
  metadata?: {
    tasksAdded?: number;
    tasksRemoved?: number;
    fieldsUpdated?: string[];
  };
}

export interface IGeminiStrategy {
  execute(context: StrategyContext): Promise<StrategyResult>;
  getPrompt(): string;
  validate(context: StrategyContext): void;
}

export abstract class BaseGeminiStrategy implements IGeminiStrategy {
  abstract execute(context: StrategyContext): Promise<StrategyResult>;
  abstract getPrompt(): string;

  validate(context: StrategyContext): void {
    if (!context) {
      throw new Error('Context is required');
    }
  }

  protected buildPromptWithContext(template: string, context: StrategyContext): string {
    let prompt = template;

    if (context.userInput) {
      prompt += `\n\nUser idea: ${context.userInput}`;
    }

    if (context.existingProject) {
      prompt += `\n\nCurrent project data:\n${JSON.stringify({
        name: context.existingProject.name,
        priority: context.existingProject.priority,
        backtech: context.existingProject.backtech,
        fronttech: context.existingProject.fronttech,
        cloudTech: context.existingProject.cloudTech,
        sprintsQuantity: context.existingProject.sprintsQuantity,
        endDate: context.existingProject.endDate,
        tasks: context.existingProject.tasks?.map(t => ({
          name: t.name,
          description: t.description,
          assignedTo: t.assignedTo,
          sprint: t.sprint
        }))
      }, null, 2)}`;
    }

    return prompt;
  }
}
