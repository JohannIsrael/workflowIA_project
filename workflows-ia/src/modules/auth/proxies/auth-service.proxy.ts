import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, Like, In } from 'typeorm';
import { AuthService } from '../auth.service';
import { AuditLogs } from '../entities/AuditLogs.entity';
import { User } from '../../user/entities/user.entity';
import { LoginDto } from '../dto/login-dto';
import { IAuditLogsOperations} from '../interfaces/AuditLogs';

@Injectable()
export class AuthServiceProxy implements IAuditLogsOperations{
  constructor(
    private readonly authService: AuthService,
    @InjectRepository(AuditLogs)
    private auditLogsRepository: Repository<AuditLogs>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async validateUser(dto: LoginDto): Promise<any> {

    const startTime = Date.now();
    let userFound: User | null = null;
    
    try {
      // Buscar el usuario para obtener su ID para el audit log
      userFound = await this.userRepository.findOne({ where: { email: dto.email } });
      
      const result = await this.authService.validateUser(dto);
      const duration = Date.now() - startTime;
      
      if (result) {
        // Login exitoso
        await this.createAuditLog({
          action: 'LOGIN_SUCCESS',
          description: `Login successful for user: ${dto.email}`,
          details: `Duration: ${duration}ms, User ID: ${result.user?.id}`,
          user: userFound,
        });
      } else {
        // Login fallido
        await this.createAuditLog({
          action: 'LOGIN_FAILED',
          description: `Login failed for user: ${dto.email}`,
          details: `Duration: ${duration}ms, Reason: Invalid credentials`,
          user: userFound,
        });
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      if (userFound) {
        // Error en login
        await this.createAuditLog({
          action: 'LOGIN_ERROR',
          description: `Login error for user: ${dto.email}`,
          details: `Duration: ${duration}ms, Error: ${error.message}`,
          user: userFound,
        });
      }
      
      
      throw error;
    }
  }

  async refreshTokens(refreshToken: string): Promise<any> {
    const startTime = Date.now();
    
    try {
      const result = await this.authService.refreshTokens(refreshToken);
      const duration = Date.now() - startTime;
      
      if (result) {
        // Token refresh exitoso
        await this.createAuditLog({
          action: 'TOKEN_REFRESH_SUCCESS',
          description: 'Token refresh successful',
          details: `Duration: ${duration}ms`,
          user: null,
        });
      } else {
        // Token refresh fallido
        await this.createAuditLog({
          action: 'TOKEN_REFRESH_FAILED',
          description: 'Token refresh failed',
          details: `Duration: ${duration}ms, Reason: Invalid refresh token`,
          user: null,
        });
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Error en token refresh
      await this.createAuditLog({
        action: 'TOKEN_REFRESH_ERROR',
        description: 'Token refresh error',
        details: `Duration: ${duration}ms, Error: ${error.message}`,
        user: null,
      });
      
      throw error;
    }
  }

  async createAuditLog(data: {
    action: string;
    description: string | null;
    details: string | null;
    user: User | null;
  }): Promise<void> {
    try {
      const auditLog = this.auditLogsRepository.create({
        action: data.action,
        description: data.description,
        details: data.details,
        createdAt: new Date().toISOString(),
        user: data.user || undefined,
      });
      
      await this.auditLogsRepository.save(auditLog);
    } catch (error) {
      // No lanzamos error para no interrumpir el flujo principal
      console.error('Error creating audit log:', error);
    }
  }

  async getAllAuditLogs(page: number, limit: number) {
    return await this.auditLogsRepository.find({
      skip: (page - 1) * limit,
      take: limit,
      order: {
        createdAt: 'DESC',
      },
      relations: ['user'],
    });
  }

  async getSuccessAuditLogs(page: number, limit: number, userId: string) {
    const allowedActions = [
      'CREATE_PROJECT',
      'UPDATE_PROJECT',
      'DELETE_PROJECT',
      'CREATE_TASK',
      'UPDATE_TASK',
      'DELETE_TASK',
      'PREDICT_PROJECT',
      'OPTIMIZE_PROJECT',
    ];

    return await this.auditLogsRepository.find({
      where: {
        description: Not(Like('%Error%')),
        action: In(allowedActions),
        user: {
          id: userId,
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      order: {
        createdAt: 'DESC',
      },
      relations: ['user'],
    });
  }

  // Funciones logger
  async logAction(data: AuditLogs): Promise<void> {
    await this.auditLogsRepository.save(data);
  }

  async findAuditLog(id: string): Promise<AuditLogs> {
    const auditLog = await this.auditLogsRepository.findOne({ where: { id } });
    if (!auditLog) {
      throw new Error(`Audit log with id ${id} not found`);
    }
    return auditLog;
  }

}
