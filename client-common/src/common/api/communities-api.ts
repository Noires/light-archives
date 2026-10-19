import { IdWrapper } from '@app/shared/dto/common/id-wrapper.dto';
import { CommunityMemberDto } from '@app/shared/dto/communities/community-member.dto';
import { CommunitySummaryDto } from '@app/shared/dto/communities/community-summary.dto';
import { CommunityDto } from '@app/shared/dto/communities/community.dto';
import { MemberFlagsDto } from '@app/shared/dto/communities/member-flags.dto';
import { MyCommunitySummaryDto } from '@app/shared/dto/communities/my-community-summary.dto';
import type { EventSummaryDto } from '@app/shared/dto/events/event-summary.dto';
import type { GroupEventsFilterDto } from '@app/shared/dto/events/group-events-filter.dto';
import APITransport from './api-transport';

export default class CommunitiesAPI {
  private readonly transport: APITransport;

  constructor(transport: APITransport) {
    this.transport = transport.atPath('communities');
  }

  async getMyCommunities(characterId: number): Promise<MyCommunitySummaryDto[]> {
    return this.transport.authGet('my-communities', { characterId: characterId.toString() });
  }

  async getCommunities(): Promise<CommunitySummaryDto[]> {
    return this.transport.get('');
  }

  async getCommunity(id: number, characterId: number): Promise<CommunityDto> {
    return this.transport.tokenGet(`${id}`, { characterId });
  }

  async getCommunityByName(name: string, characterId: number): Promise<CommunityDto> {
    return this.transport.tokenGet(`by-name/${name}`, { characterId });
  }

  async createCommunity(community: CommunityDto): Promise<IdWrapper> {
    return this.transport.authPost('', community);
  }

  async editCommunity(community: CommunityDto): Promise<void> {
    return this.transport.authPut(`${community.id}`, community);
  }

  async deleteCommunity(id: number): Promise<void> {
    return this.transport.authDelete(`${id}`);
  }

  async applyForMembership(id: number, characterId: number): Promise<void> {
    return this.transport.authPost(`${id}/members/apply`, { characterId });
  }

  async getMembers(id: number): Promise<CommunityMemberDto[]> {
    return this.transport.authGet(`${id}/members`);
  }

  async approveMember(id: number, characterId: number): Promise<void> {
    return this.transport.authPost(`${id}/members/approve`, { characterId });
  }

  async rejectMember(id: number, characterId: number): Promise<void> {
    return this.transport.authPost(`${id}/members/reject`, { characterId });
  }

  async setMemberFlags(id: number, characterId: number, flags: MemberFlagsDto): Promise<void> {
    return this.transport.authPut(`${id}/members/${characterId}/flags`, flags);
  }

  /**
   * ER2: events owned by members of the group. upcoming (default): from now, ascending;
   * upcoming=false: last 90 days, descending. Not available on older API versions.
   */
  async getEvents(id: number, options: GroupEventsFilterDto = {}): Promise<EventSummaryDto[]> {
    const params: Record<string, string> = {};
    if (options.upcoming !== undefined) {
      params.upcoming = String(options.upcoming);
    }
    if (options.limit !== undefined) {
      params.limit = String(options.limit);
    }
    return this.transport.get<EventSummaryDto[]>(`${id}/events`, params);
  }
}
