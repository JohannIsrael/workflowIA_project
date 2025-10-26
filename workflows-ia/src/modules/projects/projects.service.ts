import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AuthServiceProxy } from '../auth/proxies/auth-service.proxy';
import { AuthenticatedUserInterface } from '../auth/interfaces/authenticated-user-interface';
import { AuditLogs } from '../auth/entities/AuditLogs.entity';
import { GeminiService } from '../gemini/gemini.service';
import { Projects } from '../gemini/entities/Projects.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class ProjectsService {

  constructor(
    private readonly authServiceProxy: AuthServiceProxy,
    @InjectRepository(Projects)
    private readonly projectsRepository: Repository<Projects>,
  ) {}

  async create(dto: CreateProjectDto, request: AuthenticatedUserInterface) {
    const auditLog = this.createAuditLog(request, 'CREATE_PROJECT');
    await this.authServiceProxy.logAction(auditLog as AuditLogs);

    const project = await this.projectsRepository.save(dto);
    return project;

  }

  async findAll(request: AuthenticatedUserInterface) {
    const auditLog = this.createAuditLog(request, 'GET_ALL_PROJECTS');
    await this.authServiceProxy.logAction(auditLog as AuditLogs);
    const projects = await this.projectsRepository.find();
    return projects;
  }

  async findOne(id: string, request: AuthenticatedUserInterface) {
    const auditLog = this.createAuditLog(request, 'GET_PROJECT', `Get project with id: ${id}`);
    await this.authServiceProxy.logAction(auditLog as AuditLogs);
    const project = await this.projectsRepository.findOne({ where: { id } });
    return project;
  }

  async update(id: string, dto: UpdateProjectDto, request: AuthenticatedUserInterface) {
    const auditLog = this.createAuditLog(request, 'UPDATE_PROJECT', `Update project with id: ${id}`);
    await this.authServiceProxy.logAction(auditLog as AuditLogs);
    
    const project = await this.projectsRepository.findOne({ where: { id } });
    
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    
    const projectUpdated = await this.projectsRepository.save({
      ...project,
      ...dto,
    });

    return project;
  }

  async remove(id: string, request: AuthenticatedUserInterface) {
    const auditLog = this.createAuditLog(request, 'DELETE_PROJECT', `Delete project with id: ${id}`);
    await this.authServiceProxy.logAction(auditLog as AuditLogs);
    const project = await this.projectsRepository.findOne({ where: { id } });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    await this.projectsRepository.remove(project);
    return project;
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
