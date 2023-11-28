import { Controller, Get } from '@nestjs/common';
import { SigService } from './rabin/sig.service';
import { toBufferLE } from './utils';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@Controller()
export class AppController {
  constructor(private readonly sigService: SigService) {}

  @Get('/hello')
  @ApiTags('info')
  @ApiOperation({ summary: 'hello' })
  hello(): string {
    return 'Hello';
  }

  @Get('/info')
  @ApiTags('info')
  @ApiOperation({ summary: 'get server Rabin public key' })
  getInfo() {
    return {
      publicKey: toBufferLE(this.sigService.publicKey).toString('hex'),
    };
  }
}
