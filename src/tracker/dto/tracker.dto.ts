import { IsString, IsNumber, IsOptional, IsArray, IsUrl } from 'class-validator';
import { ProductData } from 'src/scraper/interfaces/scraper.interface';

export class CreateTrackedItemDto {
  @IsString()
  name: string;

  @IsString()
  searchQuery: string;

  @IsNumber()
  @IsOptional()
  targetPrice?: number;

  // @IsOptional()
  @IsArray()
  productsToTrack: ProductData[]; // ✅ Array of full product objects
  // productUrls?: string[];
}

export class UpdateTrackedItemDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsOptional()
  targetPrice?: number;

  @IsOptional()
  isActive?: boolean;
}