import { Controller, Post, Body, Get } from '@nestjs/common';
import { GeminiService } from './gemini.service';

@Controller('gemini')
export class GeminiController {
  constructor(private readonly geminiService: GeminiService) {}

  @Post('create')
  async generateProject(@Body('idea') idea: string) {
    const result = await this.geminiService.createProject(idea);
    return this.sanitizeResponse(result);
  }

  @Post('predict')
  async predictProject(@Body('projectId') projectId: string) {
    const result = await this.geminiService.predictProject(projectId);
    return this.sanitizeResponse(result);
  }

  @Post('optimize')
  async optimizeProject(@Body('projectId') projectId: string) {
    const result = await this.geminiService.optimizeProject(projectId);
    return this.sanitizeResponse(result);
  }

  @Post('execute')
  async executeStrategy(
    @Body('strategy') strategy: string,
    @Body('userInput') userInput?: string,
    @Body('projectId') projectId?: string
  ) {
    const result = await this.geminiService.executeStrategy(
      strategy as any,
      { userInput, projectId }
    );
    return this.sanitizeResponse(result);
  }

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

  private sanitizeResponse(data: any) {
    const sanitizeProject = (project: any) => ({
      id: project.id,
      name: project.name,
      priority: project.priority,
      backtech: project.backtech,
      fronttech: project.fronttech,
      cloudTech: project.cloudTech,
      sprintsQuantity: project.sprintsQuantity,
      endDate: project.endDate,
      tasks: project.tasks?.map((task: any) => ({
        id: task.id,
        name: task.name,
        description: task.description,
        assignedTo: task.assignedTo,
        sprint: task.sprint,
      }))
    });

    return Array.isArray(data)
      ? data.map(sanitizeProject)
      : sanitizeProject(data);
  }
}