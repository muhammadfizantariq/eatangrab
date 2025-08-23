import { IsNotEmpty, IsString, IsOptional, IsNumber, IsBoolean, IsMongoId } from 'class-validator';

export class CreateMenuDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  desc?: string;

  @IsNotEmpty()
  @IsNumber()
  price: number;

  @IsOptional()
  @IsBoolean()
  combo?: boolean;

  @IsOptional()
  @IsString()
  imageBase64?: string; // This field is optional

  @IsNotEmpty()
  @IsMongoId()
  categoryId: string;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}