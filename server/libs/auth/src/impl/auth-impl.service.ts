import { authConfiguration } from '@app/configuration';
import { Character, RefreshToken, User } from '@app/entity';
import { Role } from '@app/shared/enums/role.enum';
import { TelemetryConsentStatus } from '@app/shared/enums/telemetry-consent-status.enum';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as Sentry from '@sentry/nestjs';
import { Profile as DiscordProfile } from 'passport-discord-auth';
import { FindOptionsWhere, LessThan, Repository } from 'typeorm';
import { UserCharacterInfo } from '../model/user-character-info';
import { UserInfo } from '../model/user-info';
import { InjectRedis } from '@liaoliaots/nestjs-redis';
import { Redis } from 'ioredis';
import { createHash, randomBytes } from 'crypto';

// Simple duration parser for strings like '30d', '1h', '15m'
function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error(`Invalid duration format: ${duration}`);
  }
  const value = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return value * multipliers[unit];
}

type RefreshRejectionReason = 'not_found' | 'revoked' | 'expired';

interface RefreshValidationContext {
  userAgent: string | null;
  ipAddress: string | null;
}

@Injectable()
export class AuthImplService {
  private readonly USER_INFO_CACHE_SEC = 86400;
  private readonly TELEMETRY_CONSENT_VERSION = 1;

  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Character)
    private readonly characterRepo: Repository<Character>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
    @InjectRedis()
    private readonly redisService: Redis,
  ) {}

  async findOrCreateDiscordUser(profile: DiscordProfile): Promise<UserInfo> {
    const discordId = profile.id;
    const email = profile.email ?? null;
    const whereConditions: Array<FindOptionsWhere<User>> = [ { discordId } ];

    if (email) {
      whereConditions.push({ email });
    }

    let user = await this.userRepo.findOne({
      where: whereConditions,
    });

    if (!user) {
      user = await this.userRepo.save({
        discordId,
        email,
        passwordHash: null,
        role: Role.UNVERIFIED,
        verifiedAt: null,
        verificationCode: null,
        termsAcceptedAt: null,
        telemetryConsentStatus: TelemetryConsentStatus.UNKNOWN,
        telemetryConsentVersion: this.TELEMETRY_CONSENT_VERSION,
        telemetryConsentUpdatedAt: null,
      });
    } else if (user.discordId && user.discordId !== discordId) {
      throw new UnauthorizedException('Discord account already linked');
    } else if (!user.discordId) {
      user.discordId = discordId;
      if (user.role === Role.UNVERIFIED) {
        user.role = Role.USER;
      }
      if (!user.verifiedAt) {
        user.verifiedAt = new Date();
      }
      await this.userRepo.save(user);
    } else if (user.role === Role.UNVERIFIED || !user.verifiedAt) {
      user.role = Role.USER;
      user.verifiedAt = new Date();
      await this.userRepo.save(user);
    }

    if (!user) {
      throw new UnauthorizedException();
    }

    return this.getAndCacheUserInfo(user);
  }

  async getUserInfo(userId: number): Promise<UserInfo> {
    const cachedInfo = await this.redisService.get(`user_${userId}`);

    if (cachedInfo) {
      return JSON.parse(cachedInfo);
    }

    const user = await this.userRepo.findOneBy({ id: userId });

    if (!user) {
      throw new UnauthorizedException();
    }

    return this.getAndCacheUserInfo(user);
  }

  private async getAndCacheUserInfo(user: User): Promise<UserInfo> {
    const characters = await this.characterRepo.find({
      where: {
        user: {
          id: user.id,
        },
      },
      relations: [ 'server' ],
    });


    const result = new UserInfo({
      id: user.id,
      role: user.role as Role,
      termsAcceptedAt: user.termsAcceptedAt ? user.termsAcceptedAt.toISOString() : null,
      telemetryConsentStatus: this.getEffectiveTelemetryConsentStatus(user),
      telemetryConsentVersion: this.TELEMETRY_CONSENT_VERSION,
      telemetryConsentUpdatedAt: user.telemetryConsentUpdatedAt ? user.telemetryConsentUpdatedAt.toISOString() : null,
      characters: characters.map(character => new UserCharacterInfo({
        id: character.id,
        lodestoneId: character.lodestoneId,
        name: character.name,
        server: character.server.name,
        avatar: character.avatar,
        race: character.race,
        newsRole: character.newsRole,
        newsPseudonym: character.newsPseudonym,
        verified: character.verifiedAt !== null
      })),
    });

    void this.redisService.set(
      `user_${user.id}`,
      JSON.stringify(result),
      'EX',
      this.USER_INFO_CACHE_SEC,
    );
    return result;
  }

  private getEffectiveTelemetryConsentStatus(user: User): TelemetryConsentStatus {
    if (user.telemetryConsentVersion !== this.TELEMETRY_CONSENT_VERSION) {
      return TelemetryConsentStatus.UNKNOWN;
    }

    return user.telemetryConsentStatus || TelemetryConsentStatus.UNKNOWN;
  }

  async notifyUserChanged(userId: number): Promise<void> {
    try {
		  await this.redisService.del(`user_${userId}`);
    } catch (e) {
      // Do nothing
    }
	}

  async createRefreshToken(
    userId: number,
    userAgent: string | null,
    ipAddress: string | null,
  ): Promise<string> {
    const token = randomBytes(32).toString('hex');
    const expiryMs = parseDuration(authConfiguration.refreshTokenExpiry);
    const expiresAt = new Date(Date.now() + expiryMs);

    await this.refreshTokenRepo.save({
      token,
      userId,
      expiresAt,
      userAgent,
      ipAddress,
      revoked: false,
    });

    // Clean up expired tokens for this user
    await this.refreshTokenRepo.delete({
      userId,
      expiresAt: LessThan(new Date()),
    });

    return token;
  }

  async validateRefreshToken(
    token: string,
    context: RefreshValidationContext,
  ): Promise<RefreshToken | null> {
    const refreshToken = await this.refreshTokenRepo.findOne({
      where: { token },
      relations: ['user'],
    });

    if (!refreshToken) {
      this.captureRefreshTokenRejection('not_found', token, context);
      return null;
    }

    if (refreshToken.revoked) {
      this.captureRefreshTokenRejection('revoked', token, context, refreshToken.expiresAt);
      // Token reuse detected - revoke all tokens for this user as a security measure
      await this.revokeAllUserRefreshTokens(refreshToken.userId);
      return null;
    }

    if (refreshToken.expiresAt < new Date()) {
      this.captureRefreshTokenRejection('expired', token, context, refreshToken.expiresAt);
      return null;
    }

    return refreshToken;
  }

  private captureRefreshTokenRejection(
    reason: RefreshRejectionReason,
    token: string,
    context: RefreshValidationContext,
    expiresAt?: Date,
  ): void {
    const tokenFingerprint = this.hashForTelemetry(token);
    const ipFingerprint = context.ipAddress ? this.hashForTelemetry(context.ipAddress) : null;
    const userAgentFingerprint = context.userAgent ? this.hashForTelemetry(context.userAgent) : null;

    Sentry.withScope((scope) => {
      scope.setLevel('warning');
      scope.setTag('auth_flow', 'refresh_token');
      scope.setTag('refresh_rejection_reason', reason);
      scope.setFingerprint(['auth-refresh-token-rejected', reason]);
      scope.setContext('refresh_validation', {
        tokenFingerprint,
        ipFingerprint,
        userAgentFingerprint,
        expiresAt: expiresAt ? expiresAt.toISOString() : null,
        rejectedAt: new Date().toISOString(),
      });
      Sentry.captureMessage('Refresh token rejected');
    });
  }

  private hashForTelemetry(value: string): string {
    return createHash('sha256').update(value).digest('hex').slice(0, 16);
  }

  async revokeRefreshToken(token: string): Promise<void> {
    await this.refreshTokenRepo.update({ token }, { revoked: true });
  }

  async revokeAllUserRefreshTokens(userId: number): Promise<void> {
    await this.refreshTokenRepo.update({ userId, revoked: false }, { revoked: true });
  }
}
