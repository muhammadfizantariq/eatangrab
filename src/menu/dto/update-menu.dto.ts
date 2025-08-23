import { IsOptional, IsString, IsNumber, IsBoolean, IsMongoId } from 'class-validator';

export class UpdateMenuDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  desc?: string;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsBoolean()
  combo?: boolean;

  @IsOptional()
  @IsString()
  imageBase64?: string; // This field is optional

  @IsOptional()
  @IsMongoId()
  categoryId?: string;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}