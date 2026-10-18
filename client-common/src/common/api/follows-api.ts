import { FollowDto, FollowStatusDto, FollowTargetType } from '@app/shared/dto/social/follow.dto';
import APITransport from './api-transport';

/**
 * ER2 social: follow characters, venues, story series (`${authorCharacterId}:${seriesTitle}`)
 * and story authors (character id). Not yet available on older API versions.
 */
export default class FollowsAPI {
  private readonly transport: APITransport;

  constructor(transport: APITransport) {
    this.transport = transport.atPath('follows');
  }

  async follow(targetType: FollowTargetType, targetKey: string): Promise<FollowStatusDto> {
    return this.transport.authPut<FollowStatusDto>('', { targetType, targetKey });
  }

  async unfollow(targetType: FollowTargetType, targetKey: string): Promise<void> {
    return this.transport.authDelete<void>(`${targetType}/${encodeURIComponent(targetKey)}`);
  }

  async getMyFollows(): Promise<FollowDto[]> {
    return this.transport.authGet<FollowDto[]>('');
  }

  async getFollowStatus(targetType: FollowTargetType, targetKey: string): Promise<FollowStatusDto> {
    return this.transport.authGet<FollowStatusDto>('status', { targetType, targetKey });
  }
}
