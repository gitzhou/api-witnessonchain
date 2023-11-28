import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { SigService } from './rabin/sig.service';
import { V2Controller } from './v2/v2.controller';
import { V2Service } from './v2/v2.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot({})],
  controllers: [AppController, V2Controller],
  providers: [SigService, V2Service],
})
export class AppModule {}
