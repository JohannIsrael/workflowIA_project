import { Injectable, OnModuleInit } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { AuditLogs } from './entities/AuditLogs.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class UserService implements OnModuleInit {

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(AuditLogs)
    private auditLogsRepository: Repository<AuditLogs>,
  ) {}

  async onModuleInit() {
    await this.seedUsers();
  }

  private async seedUsers() {
    try {
      // Verificar si ya existen usuarios
      const existingUsers = await this.userRepository.count();
      
      if (existingUsers === 0) {
        console.log('No users found. Seeding initial users...');
        
        // Datos de usuarios iniciales
        const initialUsers = [
          {
            name: "admin",
            email: "admin@workflows-ia.com",
            fullName: "Administrator",
            password: "admin123",
            createdAt: new Date().toISOString(),
            lastLogin: null,
            token: ""
          },
          {
            name: "developer",
            email: "developer@workflows-ia.com", 
            fullName: "Developer User",
            password: "dev123",
            createdAt: new Date().toISOString(),
            lastLogin: null,
            token: ""
          }
        ];
        
        // Crear usuarios
        for (const userDataItem of initialUsers) {
          const user = this.userRepository.create(userDataItem);
          await this.userRepository.save(user);
          console.log(`Created user: ${userDataItem.name} (${userDataItem.email})`);
        }
        
        console.log('Initial users seeded successfully!');
      } else {
        console.log(`Found ${existingUsers} existing users. Skipping seeding.`);
      }
    } catch (error) {
      console.error('Error seeding users:', error);
    }
  }

  create(createUserDto: CreateUserDto) {
    return 'This action adds a new user';
  }

  findAll() {
    return `This action returns all user`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
