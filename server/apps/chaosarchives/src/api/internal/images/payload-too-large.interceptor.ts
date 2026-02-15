
import { CallHandler, ExecutionContext, HttpException, HttpStatus, NestInterceptor, PayloadTooLargeException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { getMaxUploadSizeMiBLabel } from '../../../common/image-requirements';

export class PayloadTooLargeInterceptor implements NestInterceptor {
	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle()
      .pipe(catchError((error => {
        if (error instanceof PayloadTooLargeException) {
					const maxSize = getMaxUploadSizeMiBLabel();
          throw new HttpException(
						`Image is too large. Maximum allowed size is ${maxSize} MiB. Allowed formats: JPG or PNG.`,
            HttpStatus.PAYLOAD_TOO_LARGE);
        } else {
          throw error;
        }
      })));
  }
}
