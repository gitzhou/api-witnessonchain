import { Module } from '@nestjs/common';
import { SigService } from '../rabin/sig.service';
import { ConfigModule } from '@nestjs/config';
import { V2Service } from './v2.service';
import { V2Controller } from './v2.controller';

@Module({
  imports: [ConfigModule.forRoot({})],
  controllers: [V2Controller],
  providers: [V2Service, SigService],
})
export class V2Module {}
