import { FreeCompanySummaryDto } from '@app/shared/dto/fcs/free-company-summary.dto';
import type { FreeCompanyApplicationDto } from '@app/shared/dto/fcs/free-company-application.dto';
import { FreeCompanyMemberEditFlagDto } from '@app/shared/dto/fcs/free-company-member-edit-flag.dto';
import { FreeCompanyMemberPermissionDto } from '@app/shared/dto/fcs/free-company-member-permission.dto';
import { FreeCompanyDto } from '@app/shared/dto/fcs/free-company.dto';
import { MyFreeCompanySummaryDto } from '@app/shared/dto/fcs/my-free-company-summary.dto';
import APITransport from './api-transport';

export default class FreeCompaniesAPI {
  private readonly transport: APITransport;

  constructor(transport: APITransport) {
    this.transport = transport.atPath('free-companies');
  }

	async getMyFreeCompany(characterId: number): Promise<MyFreeCompanySummaryDto|null> {
		return this.transport.authGet('my-free-company', { characterId });
	}

	async setFCFromLodestone(characterId: number): Promise<MyFreeCompanySummaryDto|null> {
		return this.transport.authPost('my-free-company', { characterId });
	}

	async unsetFC(characterId: number): Promise<void> {
		return this.transport.authPost('my-free-company/unset', { characterId });
	}

	async getFreeCompanies(): Promise<FreeCompanySummaryDto[]> {
		return this.transport.get<FreeCompanySummaryDto[]>('');
	}

	async getFreeCompanyById(id: number, characterId?: number): Promise<FreeCompanyDto> {
		return this.transport.tokenGet<FreeCompanyDto>(`${id}`, characterId ? { characterId } : undefined);
	}

	async getFreeCompany(name: string, server: string, characterId?: number): Promise<FreeCompanyDto> {
		return this.transport.tokenGet<FreeCompanyDto>(`profile/${server}/${name}`, characterId ? { characterId } : undefined);
	}

	async saveFreeCompany(fc: FreeCompanyDto): Promise<void> {
		await this.transport.authPut<void>(`/${fc.id}`, fc);
	}

  async getMemberPermissions(id: number): Promise<FreeCompanyMemberPermissionDto[]> {
    return this.transport.authGet<FreeCompanyMemberPermissionDto[]>(`${id}/member-permissions`);
  }

  async setMemberEditPermission(id: number, characterId: number, flag: FreeCompanyMemberEditFlagDto): Promise<void> {
    return this.transport.authPut<void>(`${id}/members/${characterId}/edit-permission`, flag);
  }

  // ER2 round 2: applications ("Bewerben"). Pass characterId to getFreeCompany* to get canApply/myApplicationStatus.

  async apply(id: number, characterId: number, message?: string): Promise<void> {
    return this.transport.authPost<void>(`${id}/applications`, { characterId, message });
  }

  /** FC managers (leader or members with edit permission) only; newest first. */
  async getApplications(id: number): Promise<FreeCompanyApplicationDto[]> {
    return this.transport.authGet<FreeCompanyApplicationDto[]>(`${id}/applications`);
  }

  async acceptApplication(id: number, applicationId: number): Promise<void> {
    return this.transport.authPost<void>(`${id}/applications/${applicationId}/accept`, {});
  }

  async rejectApplication(id: number, applicationId: number): Promise<void> {
    return this.transport.authPost<void>(`${id}/applications/${applicationId}/reject`, {});
  }

  /** The applicant deletes their pending or accepted application. */
  async withdrawApplication(id: number, characterId: number): Promise<void> {
    return this.transport.authPost<void>(`${id}/applications/withdraw`, { characterId });
  }
}
