import { ApiProperty } from '@nestjs/swagger';
import { AssetType } from '@prisma/client'; // Import enum from Prisma

export class JobAssetResponseDto {
  @ApiProperty({ description: 'Unique identifier for the asset.' })
  id: string;

  @ApiProperty({
    description: 'The type of the asset.',
    enum: AssetType,
  })
  type: AssetType;

  @ApiProperty({ description: 'The URL where the asset is stored.' })
  url: string;
}
