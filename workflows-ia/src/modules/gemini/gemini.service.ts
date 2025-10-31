import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Projects } from './entities/Projects.entity';
import { GeminiStrategyFactory, StrategyType } from './strategies/strategy.factory';
import { StrategyContext } from './strategies/base/gemini-strategy.interface';
import { AuthServiceProxy } from '../auth/proxies/auth-service.proxy';

@Injectable()
export class GeminiService {
  constructor(
    @InjectRepository(Projects) 
    private readonly projectsRepository: Repository<Projects>,
    private readonly strategyFactory: GeminiStrategyFactory,
    private readonly authServiceProxy: AuthServiceProxy,
  ) {}

  async createProject(userInput: string): Promise<Projects | Projects[]> {
    const strategy = this.strategyFactory.getStrategy('create');
    const context: StrategyContext = { userInput };
    const result = await strategy.execute(context);
    return result.project;
  }

  async predictProject(projectId: string): Promise<Projects> {
    const strategy = this.strategyFactory.getStrategy('predict');
    const existingProject = await this.loadProject(projectId);
    const context: StrategyContext = { existingProject };
    const result = await strategy.execute(context);
    return result.project as Projects;
  }

  async optimizeProject(projectId: string): Promise<Projects> {
    const strategy = this.strategyFactory.getStrategy('optimize');
    const existingProject = await this.loadProject(projectId);
    const context: StrategyContext = { existingProject };
    const result = await strategy.execute(context);
    return result.project as Projects;
  }

  async executeStrategy(
    type: StrategyType,
    input: { userInput?: string; projectId?: string }
  ): Promise<Projects | Projects[]> {
    if (type === 'create' && !input.userInput) {
      throw new BadRequestException('userInput is required for create strategy');
    }
    if ((type === 'predict' || type === 'optimize') && !input.projectId) {
      throw new BadRequestException(`projectId is required for ${type} strategy`);
    }

    const strategy = this.strategyFactory.getStrategy(type);
    
    let context: StrategyContext;
    if (type === 'create') {
      context = { userInput: input.userInput };
    } else {
      const existingProject = await this.loadProject(input.projectId!);
      context = { existingProject };
    }

    try {
      const result = await strategy.execute(context);
      
      // Log de éxito
      const projects = Array.isArray(result.project) ? result.project : [result.project];
      const projectNames = projects.map(p => p.name).join(', ');
      const projectIds = projects.map(p => p.id).join(', ');
      const tasksCount = result.metadata?.tasksAdded || 0;
      
      await this.authServiceProxy.createAuditLog({
        action: type === 'create' ? 'CREATE_PROJECT' : type === 'predict' ? 'PREDICT_PROJECT' : 'OPTIMIZE_PROJECT',
        description: type === 'create' 
          ? `Proyecto(s) creado(s) vía Gemini: ${projectNames}`
          : type === 'predict'
          ? `Predicción realizada para proyecto: ${context.existingProject?.name || 'N/A'}`
          : `Optimización realizada para proyecto: ${context.existingProject?.name || 'N/A'}`,
        details: tasksCount > 0 
          ? `Proyecto IDs: ${projectIds}, Tareas agregadas: ${tasksCount}`
          : `Proyecto IDs: ${projectIds}`,
        user: null,
      });
      
      return result.project;
    } catch (error) {
      // Log de error
      await this.authServiceProxy.createAuditLog({
        action: type === 'create' ? 'CREATE_PROJECT' : type === 'predict' ? 'PREDICT_PROJECT' : 'OPTIMIZE_PROJECT',
        description: `Error en estrategia ${type} vía Gemini`,
        details: error instanceof Error ? error.message : 'Error desconocido',
        user: null,
      });
      
      throw error;
    }
  }

  getAvailableStrategies(): string[] {
    return this.strategyFactory.getAvailableStrategies();
  }

  private async loadProject(projectId: string): Promise<Projects> {
    const project = await this.projectsRepository.findOne({ 
      where: { id: projectId }, 
      relations: ['tasks'] 
    });

    if (!project) {
      throw new BadRequestException(`Project with id ${projectId} not found`);
    }

    return project;
  }
}

