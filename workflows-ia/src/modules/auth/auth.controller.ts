import { Controller, Get, Post, Body, Patch, Param, Delete, UnauthorizedException, Req, Query } from '@nestjs/common';
import type { Request } from 'express';
import { AuthServiceProxy } from './proxies/auth-service.proxy';
import { LoginDto } from './dto/login-dto';
import { Public } from './decorators/public.decorators';
import { AuthService } from './auth.service';

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
    const authHeader = req.headers.authorization;
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
}
