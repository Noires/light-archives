import { PagingResultDto } from '@app/shared/dto/common/paging-result.dto';
import { ChangeItemDto } from '@app/shared/dto/changes/change-item.dto';
import { ChangesFilterDto } from '@app/shared/dto/changes/changes-filter.dto';
import { Controller, Get, Query } from '@nestjs/common';
import { ChangesService } from './changes.service';

@Controller('changes')
export class ChangesController {
  constructor(private readonly changesService: ChangesService) {}

  @Get()
  async getChanges(@Query() filter: ChangesFilterDto): Promise<PagingResultDto<ChangeItemDto>> {
    return this.changesService.getChanges(filter);
  }
}
