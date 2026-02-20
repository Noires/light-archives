import { IsBoolean } from 'class-validator';

export class FreeCompanyMemberEditFlagDto {
  @IsBoolean()
  canEdit: boolean;
}
