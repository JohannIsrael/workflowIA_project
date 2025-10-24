import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Projects } from './entities/Projects.entity';
import { GeminiStrategyFactory, StrategyType } from './strategies/strategy.factory';
import { StrategyContext } from './strategies/base/gemini-strategy.interface';

@Injectable()
export class GeminiService {
  constructor(
    @InjectRepository(Projects) 
    private readonly projectsRepository: Repository<Projects>,
    private readonly strategyFactory: GeminiStrategyFactory,
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

    const result = await strategy.execute(context);
    return result.project;
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

