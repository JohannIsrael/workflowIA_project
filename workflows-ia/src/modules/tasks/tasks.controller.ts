import { Controller, Get, Post, Body, Patch, Param, Delete, Request, HttpCode } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import type { AuthenticatedUserInterface } from '../auth/interfaces/authenticated-user-interface';

@Controller('tasks')
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
  ) {}

  @Post()
  create(
    @Body() dto: CreateTaskDto, 
    @Request() request: AuthenticatedUserInterface
  ) {
    return this.tasksService.create(dto, request);
  }

  @Get(':id')
  findAll(
    @Param('id') id: string,
    @Request() request: AuthenticatedUserInterface
  ) {
    return this.tasksService.findAll(id, request);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Request() request: AuthenticatedUserInterface
  ) {
    return this.tasksService.findOne(id, request);
  }

  @Patch(':id')
  update(
    @Param('id') id: string, 
    @Body() dto: UpdateTaskDto,
    @Request() request: AuthenticatedUserInterface
  ) {
    return this.tasksService.update(id, dto, request);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(
    @Param('id') id: string,
    @Request() request: AuthenticatedUserInterface
  ) {
    await this.tasksService.remove(id, request);
  }
}
