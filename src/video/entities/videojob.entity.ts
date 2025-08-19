import { ApiProperty } from '@nestjs/swagger';
import { JobStatus, VideoJob } from '@prisma/client';
import { JobAssetResponseDto } from '../dto/jobAssetResponse.dto';
import { UserResponseDto } from '../../users/dto/userResponse.dto';

export class VideoJobEntity implements VideoJob {
  constructor(partial: Partial<VideoJobEntity>) {
    Object.assign(this, partial);
  }

  userId: string;
  scriptText: string | null;
  updatedAt: Date;

  @ApiProperty({
    description: 'The unique identifier for the video job.',
    example: 'clvub3q6e000012ihf86a11aa',
  })
  id: string;

  //redundant field
  // @ApiProperty({
  //   description: 'The unique identifier for the user.',
  //   example: 'clvub3q6e000012ihf86a11aa',
  // })
  // userId: string;

  @ApiProperty({
    description: 'The creative prompt for the video generation.',
    example: 'A cinematic shot of a futuristic city at sunset',
  })
  prompt: string;

  @ApiProperty({
    description: 'The current status of the job.',
    enum: JobStatus,
    example: JobStatus.COMPLETED,
  })
  status: JobStatus;

  @ApiProperty({
    description: 'The final generated video URL.',
    example: 'https://storage.googleapis.com/videos/video.mp4',
    nullable: true,
  })
  videoUrl: string | null;

  @ApiProperty({
    description: 'Error message if the job failed.',
    nullable: true,
  })
  error: string | null;

  @ApiProperty({ description: 'The date and time the job was created.' })
  createdAt: Date;

  @ApiProperty({
    description: 'The user who initiated the job.',
    type: () => UserResponseDto, // ✅ Lazy resolver for the user relation
  })
  user: UserResponseDto;
  // @Exclude()
  // user: User;

  @ApiProperty({
    description: 'A list of assets associated with this job.',
    type: () => [JobAssetResponseDto], // ✅ Lazy resolver for the asset relation
  })
  assets: JobAssetResponseDto[];
}
