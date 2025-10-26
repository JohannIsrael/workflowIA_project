import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { AuthModule } from '../auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tasks } from '../gemini/entities/Tasks.entity';

@Module({
  imports: [
    AuthModule, 
    TypeOrmModule.forFeature([
      Tasks
    ]),
  ],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}
