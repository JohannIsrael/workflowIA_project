import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { User } from '../../user/entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    const accessTokenSecret = configService.get<string>('JWT_ACCESS_SECRET');
    if (!accessTokenSecret) {
      throw new Error('JWT_ACCESS_SECRET environment variable is not defined');
    }
    
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: accessTokenSecret,
    });
  }

  async validate(payload: any): Promise<Omit<User, 'password'>> {
    // The payload contains the decoded JWT token data
    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      fullName: payload.fullName,
      createdAt: payload.createdAt,
      lastLogin: payload.lastLogin,
      token: payload.token,
    };
  }
}