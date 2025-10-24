import { Injectable, BadRequestException } from '@nestjs/common';
import { BaseGeminiStrategy, StrategyContext, StrategyResult } from './base/gemini-strategy.interface';
import { WORKFLOW_CREATE_PROMPT } from '../entities/prompts/Create';
import { GoogleGenAI } from '@google/genai';
import { JsonCleanerProcessor } from '../processors/json-cleaner.processor';
import { JsonParserProcessor } from '../processors/json-parser.processor';
import { SpecNormalizerProcessor } from '../processors/spec-normalizer.processor';
import { SpecPersisterProcessor, PersistedResult } from '../processors/spec-persister.processor';
import { ISpecProcessor } from '../processors/base/spec-processor.interface';

@Injectable()
export class CreateProjectStrategy extends BaseGeminiStrategy {
  private processingChain: ISpecProcessor;

  constructor(
    private readonly genAI: GoogleGenAI,
    private readonly jsonCleaner: JsonCleanerProcessor,
    private readonly jsonParser: JsonParserProcessor,
    private readonly specNormalizer: SpecNormalizerProcessor,
    private readonly specPersister: SpecPersisterProcessor,
  ) {
    super();
    this.processingChain = this.buildProcessingChain();
  }

  getPrompt(): string {
    return WORKFLOW_CREATE_PROMPT;
  }

  validate(context: StrategyContext): void {
    super.validate(context);
    if (!context.userInput) {
      throw new BadRequestException('userInput is required for Create strategy');
    }
  }

  async execute(context: StrategyContext): Promise<StrategyResult> {
    this.validate(context);

    const prompt = this.buildPromptWithContext(this.getPrompt(), context);
    const rawResponse = await this.generateContent(prompt);

    const result = await this.processingChain.process(rawResponse) as Promise<PersistedResult>;
    const finalResult = await result;

    return {
      action: 'create',
      project: finalResult.isSingle ? finalResult.projects[0] : finalResult.projects,
      metadata: {
        tasksAdded: finalResult.projects.reduce((sum, p) => sum + (p.tasks?.length || 0), 0),
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

  private buildProcessingChain(): ISpecProcessor {
    this.jsonCleaner
      .setNext(this.jsonParser)
      .setNext(this.specNormalizer)
      .setNext(this.specPersister);
    return this.jsonCleaner;
  }
}
