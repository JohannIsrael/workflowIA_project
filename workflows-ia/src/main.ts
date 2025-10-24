import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const corsOptions = {
    origin: [
      "http://localhost:5173"
    ],
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Set-Cookie', 'Access-Control-Expose-Headers'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  };

  const configService = app.get(ConfigService);
  
  const jwtAuthGuard = app.get(JwtAuthGuard);
  app.useGlobalGuards(jwtAuthGuard);

  const port = configService.get<number>('PORT') ?? 4000;
  console.log(`Starting server on port ${port}`);
  app.enableCors(corsOptions);
  await app.listen(port);
}
bootstrap();
