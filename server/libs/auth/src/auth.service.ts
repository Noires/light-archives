import { authConfiguration } from '@app/configuration';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthImplService } from './impl/auth-impl.service';
import { AuthScope } from './model/auth-scope.enum';
import { TokenPair } from './model/token-pair';
import { UserInfo } from './model/user-info';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
		private authService: AuthImplService,
  ) {}

	createAccessToken(userId: number): string {
		return this.jwtService.sign({
			sub: userId
		});
	}

	createScopedAccessToken(userId: number, scope: AuthScope): string {
		return this.jwtService.sign({
			sub: userId,
			scope,
		}, {
			expiresIn: authConfiguration.scopedJwtExpiry,
		});
	}

	async createTokenPair(
		userId: number,
		userAgent: string | null,
		ipAddress: string | null,
	): Promise<TokenPair> {
		const accessToken = this.createAccessToken(userId);
		const refreshToken = await this.authService.createRefreshToken(userId, userAgent, ipAddress);
		return { accessToken, refreshToken };
	}

	async refreshTokens(
		refreshToken: string,
		userAgent: string | null,
		ipAddress: string | null,
	): Promise<TokenPair> {
		const tokenEntity = await this.authService.validateRefreshToken(refreshToken, {
			userAgent,
			ipAddress,
		});

		if (!tokenEntity) {
			throw new UnauthorizedException('Invalid or expired refresh token');
		}

		// Revoke the old refresh token (token rotation)
		await this.authService.revokeRefreshToken(refreshToken);

		// Create a new token pair
		return this.createTokenPair(tokenEntity.userId, userAgent, ipAddress);
	}

	async revokeRefreshToken(token: string): Promise<void> {
		await this.authService.revokeRefreshToken(token);
	}

	async revokeAllUserRefreshTokens(userId: number): Promise<void> {
		await this.authService.revokeAllUserRefreshTokens(userId);
	}

	getUserInfo(userId: number): Promise<UserInfo> {
		return this.authService.getUserInfo(userId);
	}

	async notifyUserChanged(userId: number): Promise<void> {
		await this.authService.notifyUserChanged(userId);
	}
}
