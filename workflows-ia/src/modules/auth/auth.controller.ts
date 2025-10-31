import { Controller, Get, Post, Body, Patch, Param, Delete, UnauthorizedException, Req, Query, Request } from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { AuthServiceProxy } from './proxies/auth-service.proxy';
import { LoginDto } from './dto/login-dto';
import { Public } from './decorators/public.decorators';
import { AuthService } from './auth.service';
import type { AuthenticatedUserInterface } from './interfaces/authenticated-user-interface';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authServiceProxy: AuthServiceProxy,
    private readonly authService: AuthService
  ) {}

  @Public()
  @Post('login')
  async login(@Body() data: LoginDto) {
    const result = await this.authServiceProxy.validateUser(data);

    if (!result) {
      throw new UnauthorizedException('Invalid credentials');
    }
    
    return result;
  }

  @Post('refresh')
  async refresh(@Req() req: Request) {
    // Extraer el refresh token del header Authorization
    const authHeader = req.headers['authorization'];
    const refreshToken = authHeader?.replace('Bearer ', '');
    
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }
    
    const result = await this.authServiceProxy.refreshTokens(refreshToken);

    if (!result) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    
    return result;
  }
  
  @Get('audit-logs')
  async getAuditLogs(@Query('page') page: number = 1, @Query('limit') limit: number = 10) {
    return this.authServiceProxy.getAllAuditLogs(page, limit);
  }

  @Get('audit-logs/success')
  async getSuccessAuditLogs(
    @Query('page') page: number = 1, 
    @Query('limit') limit: number = 10,
    @Request() request: AuthenticatedUserInterface
  ) {
    return this.authServiceProxy.getSuccessAuditLogs(page, limit, request.user.id);
  }
}
