import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { LoginDto } from './dto/login-dto';
import { UserService } from '../user/user.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async validateUser(user: LoginDto): Promise<any> {
    const userFound = await this.userRepository.findOne({ where: { email: user.email } });
    
    if (!userFound) {
      return null;
    }

    if (userFound.password !== user.password) {
      return null;
    }

    // Generar access token y refresh token
    const payload = { 
      sub: userFound.id,
      email: userFound.email,
      name: userFound.name,
      fullName: userFound.fullName,
      createdAt: userFound.createdAt,
      lastLogin: userFound.lastLogin,
      token: userFound.token,
    };

    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    return {
      accessToken,
      refreshToken,
      user: {
        id: userFound.id,
        email: userFound.email,
        name: userFound.name,
        fullName: userFound.fullName,
      }
    };
  }

  async refreshTokens(refreshToken: string): Promise<any> {
    if (!refreshToken) {
      return null;
    }

    // En un caso real, aquí validarías el refresh token contra una base de datos
    // Por ahora, simulamos que el refresh token es válido y obtenemos un usuario
    // En producción deberías:
    // 1. Decodificar el refresh token para obtener el user ID
    // 2. Buscar el usuario en la base de datos
    // 3. Verificar que el refresh token no esté revocado
    
    // Por simplicidad, buscamos un usuario existente
    // En producción usarías el ID del refresh token decodificado
    const userFound = await this.userRepository.findOne({ 
      where: { email: 'user@example.com' } // En producción: where: { id: userIdFromRefreshToken }
    });

    if (!userFound) {
      return null;
    }

    // Generar nuevo access token con los mismos datos del login original
    const payload = { 
      sub: userFound.id,
      email: userFound.email,
      name: userFound.name,
      fullName: userFound.fullName,
      createdAt: userFound.createdAt,
      lastLogin: userFound.lastLogin,
      token: userFound.token,
    };

    const newAccessToken = this.generateAccessToken(payload);
    const newRefreshToken = this.generateRefreshToken(payload);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  private generateAccessToken(payload: any): string {
    const accessTokenSecret = this.configService.get<string>('JWT_ACCESS_SECRET');
    if (!accessTokenSecret) {
      throw new Error('JWT_ACCESS_SECRET environment variable is not defined');
    }
    
    return jwt.sign(payload, accessTokenSecret, { expiresIn: '1h' });
  }

  private generateRefreshToken(payload: any): string {
    const refreshTokenSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
    if (!refreshTokenSecret) {
      throw new Error('JWT_REFRESH_SECRET environment variable is not defined');
    }
    
    return jwt.sign(payload, refreshTokenSecret, { expiresIn: '7d' });
  }
}
