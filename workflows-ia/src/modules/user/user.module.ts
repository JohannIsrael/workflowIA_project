import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { AuditLogs } from './entities/AuditLogs.entity';

@Module({
  imports: [TypeOrmModule.forFeature([
    User, 
    AuditLogs,
  ])],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
