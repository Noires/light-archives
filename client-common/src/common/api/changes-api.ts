import { PagingResultDto } from '@app/shared/dto/common/paging-result.dto';
import { ChangeItemDto } from '@app/shared/dto/changes/change-item.dto';
import { ChangesFilterDto } from '@app/shared/dto/changes/changes-filter.dto';
import APITransport, { QueryParams } from './api-transport';

export default class ChangesAPI {
  private readonly transport: APITransport;

  constructor(transport: APITransport) {
    this.transport = transport.atPath('changes');
  }

  async getChanges(filter?: ChangesFilterDto): Promise<PagingResultDto<ChangeItemDto>> {
    return this.transport.tokenGet<PagingResultDto<ChangeItemDto>>('', filter as QueryParams);
  }
}
