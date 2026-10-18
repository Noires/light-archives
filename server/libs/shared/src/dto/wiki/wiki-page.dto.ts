import { EditPermission } from "@app/shared/enums/edit-permission.enum";
import { Type } from "class-transformer";
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString } from "class-validator";

export class WikiPageDto {
	@IsNumber()
	@IsOptional()
	id?: number;

	@IsBoolean()
	@IsOptional()
	mine: boolean;

	@Type(() => Number)
	@IsNumber()
	@IsOptional()
	characterId?: number;

	@IsString()
	@IsOptional()
	author?: string;

	@IsString()
	@IsOptional()
	authorServer?: string;

	@IsNumber()
	@IsOptional()
	createdAt: number;

	// ER2-607: read only (epoch millis), feeds "Zuletzt bearbeitet". Ignored on
	// create and edit.
	@IsNumber()
	@IsOptional()
	updatedAt?: number;

	@IsString()
	title: string;

	@IsString()
	content: string;

	@IsEnum(EditPermission)
	editPermission: EditPermission;

	// ER2-810: draft flag. Defaults to true on create; omit to keep on edit.
	@IsBoolean()
	@IsOptional()
	published?: boolean;

	constructor(properties?: Readonly<WikiPageDto>) {
    if (properties) {
      Object.assign(this, properties);
    }
  }
}
