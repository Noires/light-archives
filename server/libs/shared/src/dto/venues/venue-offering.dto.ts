import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

export class VenueOfferingDto {
  @IsNumber()
  @IsOptional()
  id?: number;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  price?: string;

  @IsNumber()
  @IsOptional()
  imageId?: number;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsNumber()
  sortOrder: number;
}

export class VenueOfferingCategoryDto {
  @IsNumber()
  @IsOptional()
  id?: number;

  @IsString()
  name: string;

  @IsNumber()
  sortOrder: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VenueOfferingCategoryDto)
  @IsOptional()
  subcategories?: VenueOfferingCategoryDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VenueOfferingDto)
  @IsOptional()
  offerings?: VenueOfferingDto[];
}

export class VenueOfferingsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VenueOfferingCategoryDto)
  categories: VenueOfferingCategoryDto[];
}
