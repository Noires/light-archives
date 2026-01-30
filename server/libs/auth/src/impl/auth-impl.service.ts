import { authConfiguration } from '@app/configuration';
import { Character, RefreshToken, User } from '@app/entity';
import { Role } from '@app/shared/enums/role.enum';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Profile as DiscordProfile } from 'passport-discord-auth';
import { FindOptionsWhere, LessThan, Repository } from 'typeorm';
import { UserCharacterInfo } from '../model/user-character-info';
import { UserInfo } from '../model/user-info';
import { InjectRedis } from '@liaoliaots/nestjs-redis';
import { Redis } from 'ioredis';
import { randomBytes } from 'crypto';

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

@Injectable()
export class AuthImplService {
  private readonly USER_INFO_CACHE_SEC = 86400;

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

  async validateRefreshToken(token: string): Promise<RefreshToken | null> {
    const refreshToken = await this.refreshTokenRepo.findOne({
      where: { token },
      relations: ['user'],
    });

    if (!refreshToken) {
      return null;
    }

    if (refreshToken.revoked) {
      // Token reuse detected - revoke all tokens for this user as a security measure
      await this.revokeAllUserRefreshTokens(refreshToken.userId);
      return null;
    }

    if (refreshToken.expiresAt < new Date()) {
      return null;
    }

    return refreshToken;
  }

  async revokeRefreshToken(token: string): Promise<void> {
    await this.refreshTokenRepo.update({ token }, { revoked: true });
  }

  async revokeAllUserRefreshTokens(userId: number): Promise<void> {
    await this.refreshTokenRepo.update({ userId, revoked: false }, { revoked: true });
  }
}
