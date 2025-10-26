import { Controller, Get, Post, Body, Patch, Param, Delete, Request, HttpCode } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import type { AuthenticatedUserInterface } from '../auth/interfaces/authenticated-user-interface';

@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    
  ) {}

  @Post()
  create(
    @Body() dto: CreateProjectDto, 
    @Request() request: AuthenticatedUserInterface
  ) {
    return this.projectsService.create(dto, request);
  }

  @Get()
  findAll(
    @Request() request: AuthenticatedUserInterface
  ) {
    return this.projectsService.findAll(request);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Request() request: AuthenticatedUserInterface
  ) {
    return this.projectsService.findOne(id, request);
  }

  @Patch(':id')
  update(
    @Param('id') id: string, 
    @Body() dto: UpdateProjectDto,
    @Request() request: AuthenticatedUserInterface
  ) {
    return this.projectsService.update(id, dto, request);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(
    @Param('id') id: string,
    @Request() request: AuthenticatedUserInterface
  ) {
    await this.projectsService.remove(id, request);
  }
}
