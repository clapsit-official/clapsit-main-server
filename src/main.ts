import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import morgan = require('morgan');
import useragent = require('express-useragent');
import { $loggedForMorgan } from './assets/helpers/logHelpers';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable trust proxy for IP address resolution
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.getInstance().enable('trust proxy');

  // CORS Settings
  app.enableCors({
    origin: process.env.ACCEPTABLE_CORS_ORIGIN || '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      stopAtFirstError: true,
    })
  );

  // User Agent
  app.use(useragent.express());

  // Morgan Logging
  const customLogStream = {
    write: (message: string) => $loggedForMorgan(message),
  };
  app.use(morgan('combined', { stream: customLogStream }));

  // Global Prefix identical to original Express config
  app.setGlobalPrefix('api/v1', { exclude: ['cdn', '/'] });

  await app.listen(process.env.PORT ?? 3333);
}
bootstrap();
