import { AuthInfo } from '@app/auth/model/auth-info';
import { TelemetryConsentStatus } from '@app/shared/enums/telemetry-consent-status.enum';
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import { Observable } from 'rxjs';

@Injectable()
export class SentryUserContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType<'http'>() !== 'http') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<{ user?: AuthInfo }>();
    const authInfo = request.user;
    const user = authInfo?.user;
    const consentStatus = user?.telemetryConsentStatus || TelemetryConsentStatus.UNKNOWN;
    const scope = Sentry.getIsolationScope();

    scope.setTag('telemetry_consent', consentStatus);

    if (consentStatus === TelemetryConsentStatus.GRANTED && user) {
      scope.setUser({ id: String(user.id) });
    } else {
      scope.setUser(null);
    }

    return next.handle();
  }
}
