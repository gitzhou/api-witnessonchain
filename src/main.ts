import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { RequestInterceptor } from './interceptors/request.interceptor';
import { ErrorInterceptor } from './interceptors/error.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const swaggerConfig = new DocumentBuilder()
    .setTitle('WitnessOnChain Service Document')
    .setDescription('An oracle service for blockchain smart contracts.')
    .setVersion('1.0.0')
    .setLicense('MIT License', 'https://opensource.org/licenses/MIT')
    .setContact('WitnessOnChain Support Team', '', 'hi@witnessonchain.com')
    .addServer('https://api.witnessonchain.com')
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('/', app, swaggerDocument, {
    // https://stackoverflow.com/a/76095075
    customCssUrl:
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.0.0/swagger-ui.min.css',
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.0.0/swagger-ui-bundle.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.0.0/swagger-ui-standalone-preset.js',
    ],
  });

  app.useGlobalInterceptors(new RequestInterceptor());
  app.useGlobalInterceptors(new ErrorInterceptor());

  app.enableCors();
  await app.listen(3000);
}
bootstrap();
