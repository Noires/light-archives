import { IsBoolean } from 'class-validator';

export class VenueMemberFlagsDto {
  @IsBoolean()
  canEdit: boolean;

  @IsBoolean()
  canManageMembers: boolean;

  constructor(properties?: Readonly<VenueMemberFlagsDto>) {
    if (properties) {
      Object.assign(this, properties);
    }
  }
}
