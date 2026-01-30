import { SessionDto } from '@app/shared/dto/user/session.dto';
import { TokenResponseDto } from '@app/shared/dto/user/token-response.dto';
import { VerificationStatusDto } from '@app/shared/dto/user/verification-status.dto';
import { VerifyCharacterDto } from '@app/shared/dto/user/verify-character.dto';
import APITransport from './api-transport';

// Client for the user management API.
export default class UserAPI {
  private readonly transport: APITransport;

  constructor(transport: APITransport) {
    this.transport = transport.atPath('user');
  }

  async getSession(): Promise<SessionDto> {
    return this.transport.authGet<SessionDto>('session');
  }

  async getVerificationStatus(characterId: number): Promise<VerificationStatusDto> {
    return this.transport.authGet<VerificationStatusDto>('verification-status', {
      characterId
    });
  }

  async verifyCharacter(characterData: VerifyCharacterDto): Promise<void> {
    await this.transport.authPost<void>('verify-character', characterData);
  }

  async acceptTerms(): Promise<void> {
    await this.transport.authPost<void>('accept-terms', {});
  }

  async logout(refreshToken: string): Promise<void> {
    await this.transport.authPost<void>('logout', { refreshToken });
  }

  async refreshToken(refreshToken: string): Promise<TokenResponseDto> {
    return this.transport.post<TokenResponseDto>('refresh', { refreshToken });
  }

  getDiscordLoginUrl(): string {
    return `${this.transport.prefix}login/discord`;
  }
}
