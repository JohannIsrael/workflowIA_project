import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { AuthServiceProxy } from '../auth/proxies/auth-service.proxy';
import { AuthenticatedUserInterface } from '../auth/interfaces/authenticated-user-interface';
import { AuditLogs } from '../auth/entities/AuditLogs.entity';
import { Tasks } from '../gemini/entities/Tasks.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class TasksService {

  constructor(
    private readonly authServiceProxy: AuthServiceProxy,
    @InjectRepository(Tasks)
    private readonly tasksRepository: Repository<Tasks>,
  ) {}

  async create(dto: CreateTaskDto, request: AuthenticatedUserInterface) {
    const auditLog = this.createAuditLog(request, 'CREATE_TASK');
    await this.authServiceProxy.logAction(auditLog as AuditLogs);

    const task = await this.tasksRepository.save(dto);
    return task;
  }

  async findAll(request: AuthenticatedUserInterface) {
    const auditLog = this.createAuditLog(request, 'GET_ALL_TASKS');
    await this.authServiceProxy.logAction(auditLog as AuditLogs);
    const tasks = await this.tasksRepository.find({
      relations: ['project']
    });
    return tasks;
  }

  async findOne(id: string, request: AuthenticatedUserInterface) {
    const auditLog = this.createAuditLog(request, 'GET_TASK', `Get task with id: ${id}`);
    await this.authServiceProxy.logAction(auditLog as AuditLogs);
    const task = await this.tasksRepository.findOne({ 
      where: { id },
      relations: ['project']
    });
    return task;
  }

  async update(id: string, dto: UpdateTaskDto, request: AuthenticatedUserInterface) {
    const auditLog = this.createAuditLog(request, 'UPDATE_TASK', `Update task with id: ${id}`);
    await this.authServiceProxy.logAction(auditLog as AuditLogs);
    
    const task = await this.tasksRepository.findOne({ where: { id } });
    
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    
    const taskUpdated = await this.tasksRepository.save({
      ...task,
      ...dto,
    });

    return taskUpdated;
  }

  async remove(id: string, request: AuthenticatedUserInterface) {
    const auditLog = this.createAuditLog(request, 'DELETE_TASK', `Delete task with id: ${id}`);
    await this.authServiceProxy.logAction(auditLog as AuditLogs);
    const task = await this.tasksRepository.findOne({ where: { id } });
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    await this.tasksRepository.remove(task);
    return task;
  }

  private createAuditLog(request: AuthenticatedUserInterface, action: string, description: string | null = null, details: string | null = null) {
    return {
      action: action,
      description: description,
      details: details,
      createdAt: new Date().toISOString(),
      user: request.user,
    };
  }
}
