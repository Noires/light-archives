import { ViolationReportDto } from '@app/shared/dto/violations/violation-report.dto';
import APITransport, { QueryParams } from './api-transport';
import { ViolationSummaryDto } from '@app/shared/dto/violations/violation-summary.dto';
import { ViolationSummaryFilterDto } from '@app/shared/dto/violations/violation-summary-filter.dto';
import { PagingResultDto } from '@app/shared/dto/common/paging-result.dto';

export default class ViolationsAPI {
  private readonly transport: APITransport;

  constructor(transport: APITransport) {
    this.transport = transport.atPath('violations');
  }

	async getViolationList(filter?: ViolationSummaryFilterDto): Promise<PagingResultDto<ViolationSummaryDto>> {
    return this.transport.authGet<PagingResultDto<ViolationSummaryDto>>('', filter as QueryParams);
	}

	async reportViolation(report: ViolationReportDto) {
		await this.transport.authPost('', report);
	}

  async deleteViolation(id: number): Promise<void> {
    return this.transport.authDelete<void>(`${id}`);
  }
}
