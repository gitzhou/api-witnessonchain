import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';

function validateNonce(nonce: string) {
  if (nonce === undefined) {
    return;
  }
  if (!/^([0-9a-fA-F]{2})*$/.test(nonce)) {
    throw new HttpException(
      'bad parameter, nonce should be a hexadecimal string',
      HttpStatus.BAD_REQUEST,
    );
  }
  if (nonce.length > 40) {
    throw new HttpException(
      'bad parameter, nonce exceeds the length limit',
      HttpStatus.BAD_REQUEST,
    );
  }
}

@Injectable()
export class RequestInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    validateNonce(request.query.nonce);
    return next.handle();
  }
}
