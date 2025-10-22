import { Module } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { GeminiController } from './gemini.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tasks } from './entities/Tasks.entity';
import { Projects } from './entities/Projects.entity';

@Module({
  imports: [TypeOrmModule.forFeature([
    Projects,
    Tasks
  ])],
  controllers: [GeminiController],
  providers: [GeminiService],
})
export class GeminiModule {}