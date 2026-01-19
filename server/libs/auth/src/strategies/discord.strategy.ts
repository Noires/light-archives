import { authConfiguration } from '@app/configuration';
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile as DiscordProfile, Strategy as DiscordOAuthStrategy } from 'passport-discord-auth';
import { AuthImplService } from '../impl/auth-impl.service';
import { AuthInfo } from '../model/auth-info';

@Injectable()
export class DiscordStrategy extends PassportStrategy(DiscordOAuthStrategy, 'discord') {
  constructor(private authService: AuthImplService) {
    super({
      clientId: authConfiguration.discordClientId,
      clientSecret: authConfiguration.discordClientSecret,
      callbackUrl: authConfiguration.discordCallbackUrl,
      scope: ['identify', 'email'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: DiscordProfile,
  ): Promise<AuthInfo> {
    return {
      user: await this.authService.findOrCreateDiscordUser(profile),
      scope: null,
    };
  }
}

@Injectable()
export class DiscordRppStrategy extends PassportStrategy(DiscordOAuthStrategy, 'discord-rpp') {
  constructor(private authService: AuthImplService) {
    super({
      clientId: authConfiguration.discordClientId,
      clientSecret: authConfiguration.discordClientSecret,
      callbackUrl: authConfiguration.discordRppCallbackUrl,
      scope: ['identify', 'email'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: DiscordProfile,
  ): Promise<AuthInfo> {
    return {
      user: await this.authService.findOrCreateDiscordUser(profile),
      scope: null,
    };
  }
}
