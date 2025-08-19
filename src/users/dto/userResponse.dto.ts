import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ description: "The user's unique identifier." })
  id: string;

  @ApiProperty({ description: "The user's name." })
  name: string;

  @ApiProperty({ description: "The user's email address." })
  email: string;
}
