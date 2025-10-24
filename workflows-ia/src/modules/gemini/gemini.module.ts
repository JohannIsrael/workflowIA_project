
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GoogleGenAI } from '@google/genai';
import { GeminiController } from './gemini.controller';
import { GeminiService } from './gemini.service';
import { Projects } from './entities/Projects.entity';
import { Tasks } from './entities/Tasks.entity';
import { JsonCleanerProcessor } from './processors/json-cleaner.processor';
import { JsonParserProcessor } from './processors/json-parser.processor';
import { SpecNormalizerProcessor } from './processors/spec-normalizer.processor';
import { SpecPersisterProcessor } from './processors/spec-persister.processor';
import { CreateProjectStrategy } from './strategies/create-project.strategy';
import { PredictProjectStrategy } from './strategies/predict-project.strategy';
import { OptimizeProjectStrategy } from './strategies/optimize-project.strategy';
import { GeminiStrategyFactory } from './strategies/strategy.factory';  // 👈 NUEVO

@Module({
  imports: [
    TypeOrmModule.forFeature([Projects, Tasks])
  ],
  controllers: [GeminiController],
  providers: [
    GeminiService,
    {
      provide: GoogleGenAI,
      useFactory: () => new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
      }),
    },
    JsonCleanerProcessor,
    JsonParserProcessor,
    SpecNormalizerProcessor,
    SpecPersisterProcessor,
    CreateProjectStrategy,
    PredictProjectStrategy,
    OptimizeProjectStrategy,
    GeminiStrategyFactory,  // 👈 NUEVO
  ],
  exports: [GeminiService],
})
export class GeminiModule {}
