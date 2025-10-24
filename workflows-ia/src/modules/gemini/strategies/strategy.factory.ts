import { Injectable, BadRequestException } from '@nestjs/common';
import { IGeminiStrategy } from './base/gemini-strategy.interface';
import { CreateProjectStrategy } from './create-project.strategy';
import { PredictProjectStrategy } from './predict-project.strategy';
import { OptimizeProjectStrategy } from './optimize-project.strategy';

export type StrategyType = 'create' | 'predict' | 'optimize';

@Injectable()
export class GeminiStrategyFactory {
  private readonly strategies: Map<StrategyType, IGeminiStrategy>;

  constructor(
    private readonly createStrategy: CreateProjectStrategy,
    private readonly predictStrategy: PredictProjectStrategy,
    private readonly optimizeStrategy: OptimizeProjectStrategy,
  ) {
    // Fix: Cast explícito para resolver el tipo de Map
    this.strategies = new Map<StrategyType, IGeminiStrategy>([
      ['create', this.createStrategy],
      ['predict', this.predictStrategy],
      ['optimize', this.optimizeStrategy],
    ] as Array<[StrategyType, IGeminiStrategy]>);
  }

  getStrategy(type: StrategyType): IGeminiStrategy {
    const strategy = this.strategies.get(type);
    
    if (!strategy) {
      throw new BadRequestException(
        `Unknown strategy type: ${type}. Available: ${Array.from(this.strategies.keys()).join(', ')}`
      );
    }

    return strategy;
  }

  getAvailableStrategies(): StrategyType[] {
    return Array.from(this.strategies.keys());
  }

  hasStrategy(type: string): type is StrategyType {
    return this.strategies.has(type as StrategyType);
  }
}
