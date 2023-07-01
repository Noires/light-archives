import { IsOptional, IsBoolean, IsString } from "class-validator";
import { PagingDto } from "../common/paging.dto";

export class ViolationSummaryFilterDto extends PagingDto {
	@IsString()
	@IsOptional()
	searchQuery?: string;

    @IsBoolean()
    @IsOptional()
    open: boolean;
}
