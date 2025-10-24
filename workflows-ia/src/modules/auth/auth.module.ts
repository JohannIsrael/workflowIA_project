import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthServiceProxy } from './proxies/auth-service.proxy';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { AuditLogs } from './entities/AuditLogs.entity';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET, // Usar el secret del access token para JWT module
      signOptions: { expiresIn: '1h' },
    }),
    TypeOrmModule.forFeature([User, AuditLogs]),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthServiceProxy, JwtStrategy, JwtAuthGuard],
})
export class AuthModule {}
