import { Controller, Get, Post, Body, Patch, Param, Delete, UnauthorizedException, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AuthServiceProxy } from './proxies/auth-service.proxy';
import { LoginDto } from './dto/login-dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authServiceProxy: AuthServiceProxy) {}

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
}
