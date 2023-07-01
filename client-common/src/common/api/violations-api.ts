import { ViolationReportDto } from '@app/shared/dto/violations/violation-report.dto';
import APITransport from './api-transport';
import { ViolationSummaryDto } from '@app/shared/dto/violations/violation-summary.dto';

export default class ViolationsAPI {
  private readonly transport: APITransport;

  constructor(transport: APITransport) {
    this.transport = transport.atPath('violations');
  }

	async getViolations(): Promise<ViolationSummaryDto[]> {
		return this.transport.authGet<ViolationSummaryDto[]>('');
	}

	async reportViolation(report: ViolationReportDto) {
		await this.transport.authPost('', report);
	}

  async deleteViolation(id: number): Promise<void> {
    return this.transport.authDelete<void>(`${id}`);
  }
}
