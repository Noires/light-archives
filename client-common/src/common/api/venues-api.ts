import { IdWrapper } from '@app/shared/dto/common/id-wrapper.dto';
import { VenueMemberDto } from '@app/shared/dto/venues/venue-member.dto';
import { VenueMemberFlagsDto } from '@app/shared/dto/venues/venue-member-flags.dto';
import { VenueOfferingsDto } from '@app/shared/dto/venues/venue-offering.dto';
import { VenueSummaryDto } from '@app/shared/dto/venues/venue-summary.dto';
import { VenueDto } from '@app/shared/dto/venues/venue.dto';
import APITransport, { QueryParams } from './api-transport';

export default class VenuesAPI {
  private readonly transport: APITransport;

  constructor(transport: APITransport) {
    this.transport = transport.atPath('venues');
  }

	async getVenues(filter?: { characterId?: number }): Promise<VenueSummaryDto[]> {
		return this.transport.get<VenueSummaryDto[]>('', filter);
	}

  async getEditableVenues(): Promise<VenueSummaryDto[]> {
    return this.transport.authGet<VenueSummaryDto[]>('my-editable');
  }

  async searchVenues(query: string, server?: string): Promise<VenueSummaryDto[]> {
    const params: QueryParams = server ? { query, server } : { query };
    return this.transport.get<VenueSummaryDto[]>('search', params);
  }

	async getVenue(id: number, characterId?: number): Promise<VenueDto> {
		return this.transport.tokenGet<VenueDto>(`${id}`, characterId ? { characterId } : undefined);
	}

	async getVenueByName(name: string, server: string, characterId?: number): Promise<VenueDto> {
		return this.transport.tokenGet<VenueDto>(`${server}/${name}`, characterId ? { characterId } : undefined);
	}

	async createVenue(venue: VenueDto): Promise<IdWrapper> {
		return this.transport.authPost<IdWrapper>('', venue);
	}

	async editVenue(venue: VenueDto): Promise<void> {
		await this.transport.authPut<void>(`${venue.id}`, venue);
	}

	async deleteVenue(id: number): Promise<void> {
		return this.transport.authDelete<void>(`${id}`);
	}

  async applyForMembership(id: number, characterId: number): Promise<void> {
    return this.transport.authPost(`${id}/members/apply`, { characterId });
  }

  async getMembers(id: number): Promise<VenueMemberDto[]> {
    return this.transport.authGet(`${id}/members`);
  }

  async approveMember(id: number, characterId: number): Promise<void> {
    return this.transport.authPost(`${id}/members/approve`, { characterId });
  }

  async rejectMember(id: number, characterId: number): Promise<void> {
    return this.transport.authPost(`${id}/members/reject`, { characterId });
  }

  async setMemberFlags(id: number, characterId: number, flags: VenueMemberFlagsDto): Promise<void> {
    return this.transport.authPut(`${id}/members/${characterId}/flags`, flags);
  }

  // ─── Offerings ──────────────────────────────────────────────────────────────

  async getOfferings(venueId: number): Promise<VenueOfferingsDto> {
    return this.transport.get<VenueOfferingsDto>(`${venueId}/offerings`);
  }

  async saveOfferings(venueId: number, offerings: VenueOfferingsDto): Promise<void> {
    await this.transport.authPut<void>(`${venueId}/offerings`, offerings);
  }

  async uploadOfferingImage(venueId: number, characterId: number, file: File): Promise<{ id: number; url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('characterId', characterId.toString());
    return this.transport.authPost<{ id: number; url: string }>(`${venueId}/offerings/image`, formData);
  }

  async deleteOfferingImage(venueId: number, imageId: number): Promise<void> {
    await this.transport.authDelete<void>(`${venueId}/offerings/image/${imageId}`);
  }
}
