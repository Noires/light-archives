import { AuthService } from '@app/auth/auth.service';
import { CurrentUser } from '@app/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@app/auth/guards/jwt-auth.guard';
import { UserInfo } from '@app/auth/model/user-info';
import { serverConfiguration } from '@app/configuration';
import { RefreshTokenRequestDto } from '@app/shared/dto/user/refresh-token-request.dto';
import { SetTelemetryConsentDto } from '@app/shared/dto/user/set-telemetry-consent.dto';
import { SessionDto } from '@app/shared/dto/user/session.dto';
import { TokenResponseDto } from '@app/shared/dto/user/token-response.dto';
import { VerificationStatusDto } from '@app/shared/dto/user/verification-status.dto';
import { VerifyCharacterDto } from '@app/shared/dto/user/verify-character.dto';
import {
  Body,
  Controller,
  ExecutionContext,
  Get,
  Headers,
  Injectable,
  Ip,
  ParseIntPipe,
  Post,
  Query,
  Req,
  Res,
  UseGuards
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { UserService } from './user.service';

const DEV_ALLOWED_ORIGINS = new Set([
  'http://localhost:8080',
  'http://127.0.0.1:8080',
]);

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function trimTrailingSlash(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

function getConfiguredFrontendOrigin(): string | null {
  try {
    return new URL(serverConfiguration.frontendRoot).origin;
  } catch {
    return null;
  }
}

function getAllowedReturnUrl(value: unknown): string | null {
  const returnUrl = asString(value);
  if (!returnUrl) {
    return null;
  }

  try {
    const url = new URL(returnUrl);
    const configuredOrigin = getConfiguredFrontendOrigin();
    if (configuredOrigin && url.origin === configuredOrigin) {
      return returnUrl;
    }

    if (DEV_ALLOWED_ORIGINS.has(url.origin)) {
      return returnUrl;
    }
  } catch {
    return null;
  }

  return null;
}

function getFrontendRootForRedirect(returnUrl: string | null): string {
  if (!returnUrl) {
    return trimTrailingSlash(serverConfiguration.frontendRoot);
  }

  try {
    const url = new URL(returnUrl);
    return url.origin;
  } catch {
    return trimTrailingSlash(serverConfiguration.frontendRoot);
  }
}

@Injectable()
class DiscordLoginGuard extends AuthGuard('discord') {
  getAuthenticateOptions(context: ExecutionContext): { state?: string } {
    const request = context.switchToHttp().getRequest<Request>();
    const allowedReturnUrl = getAllowedReturnUrl(request.query.returnUrl);
    return allowedReturnUrl ? { state: allowedReturnUrl } : {};
  }
}

@Controller('user')
export class UserController {
  constructor(
    private userService: UserService,
    private publicAuthService: AuthService,
  ) {}

  @Get('login/discord')
  @UseGuards(DiscordLoginGuard)
  async loginWithDiscord(): Promise<void> {
    return;
  }

  @Get('login/discord/callback')
  @UseGuards(AuthGuard('discord'))
  async discordCallback(
    @CurrentUser() user: UserInfo,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    const userAgent = request.headers['user-agent'] || null;
    const ipAddress = request.ip || null;
    const tokenPair = await this.publicAuthService.createTokenPair(user.id, userAgent, ipAddress);
    const allowedReturnUrl = getAllowedReturnUrl(request.query.state);
    const frontendRoot = getFrontendRootForRedirect(allowedReturnUrl);
    const redirectUrl = `${frontendRoot}/login?token=${encodeURIComponent(tokenPair.accessToken)}&refreshToken=${encodeURIComponent(tokenPair.refreshToken)}`;
    response.redirect(redirectUrl);
  }

  @UseGuards(JwtAuthGuard)
  @Get('session')
  async getSession(@CurrentUser() user: UserInfo): Promise<SessionDto> {
    return this.userService.toSession(user);
  }

  @Post('refresh')
  async refreshToken(
    @Body() body: RefreshTokenRequestDto,
    @Req() request: Request,
  ): Promise<TokenResponseDto> {
    const userAgent = request.headers['user-agent'] || null;
    const ipAddress = request.ip || null;
    return this.publicAuthService.refreshTokens(body.refreshToken, userAgent, ipAddress);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(
    @CurrentUser() user: UserInfo,
    @Body() body: RefreshTokenRequestDto,
  ): Promise<void> {
    await this.publicAuthService.revokeRefreshToken(body.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('accept-terms')
  async acceptTerms(@CurrentUser() user: UserInfo): Promise<void> {
    await this.userService.acceptTerms(user);
    await this.publicAuthService.notifyUserChanged(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('telemetry-consent')
  async setTelemetryConsent(
    @CurrentUser() user: UserInfo,
    @Body() body: SetTelemetryConsentDto,
  ): Promise<void> {
    await this.userService.setTelemetryConsent(user, body.status);
    await this.publicAuthService.notifyUserChanged(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('verification-status')
  async getVerificationStatus(
    @CurrentUser() user: UserInfo,
    @Query('characterId', ParseIntPipe) characterId: number,
  ): Promise<VerificationStatusDto> {
    return this.userService.getVerificationStatus(user, characterId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('verify-character')
  async verifyCharacter(
    @CurrentUser() user: UserInfo,
    @Body() verifyData: VerifyCharacterDto,
  ): Promise<void> {
    await this.userService.verifyCharacter(user, verifyData);
    await this.publicAuthService.notifyUserChanged(user.id);
  }
}
