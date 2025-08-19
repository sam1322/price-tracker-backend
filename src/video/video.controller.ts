// import {
//   Body,
//   Controller,
//   Get,
//   InternalServerErrorException,
//   Param,
//   Post,
// } from '@nestjs/common';
// import { VideoService } from './video.service';
// import { ImageService } from './services/image.service';
// import { AudioGenerationService } from './services/audio.service';
//
// @Controller('video')
// export class VideoController {
//   constructor(
//     private readonly videoService: VideoService,
//     private readonly imageService: ImageService,
//     private readonly audioService: AudioGenerationService,
//   ) {}
//
//   @Post('generate')
//   async generateVideo(@Body() body: { query: string }) {
//     return await this.videoService.generateVideo(body.query);
//   }
//   @Post('generate/script')
//   async generateScript(@Body() body: { query: string }) {
//     const script = await this.videoService.generateScript(body.query);
//     return { script: script };
//   }
//
//   @Post('generate/image')
//   async generateImage(@Body() body: { query: string }) {
//     const image = await this.imageService.generateImageByGoogle(
//       body.query,
//       '123',
//       1,
//     );
//     return { image: image };
//   }
//
//   @Post('generate/audio')
//   async generateAudio(@Body() body: { query: string }) {
//     const audio = await this.audioService.generateAudioByGoogle(
//       body.query,
//       '123',
//     );
//     return { audio: audio };
//   }
//
//   @Post('generate/video')
//   async generateVideo2(@Body() body: { jobId: string }) {
//     const video = await this.videoService.generateCombinedVideo(body.jobId);
//     return { video: video };
//   }
//
//   @Get('status/:jobId')
//   async getStatus(@Param('jobId') jobId: string) {
//     return await this.videoService.getStatus(jobId);
//   }
//
//   // @Get('download/:jobId')
//   // async downloadVideo(@Param('jobId') jobId: string, @Res() res: Response) {
//   //   const filePath = await this.videoService.getVideoPath(jobId);
//   //   // eslint-disable-next-line @typescript-eslint/no-unsafe-call
//   //   res.download(filePath);
//   // }
//
//   @Get('/debug-sentry')
//   getError() {
//     throw new InternalServerErrorException('My second Sentry error!');
//   }
// }

// video.controller.ts

import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-authguard';
import { VideoService } from './video.service';
import { JobStatus } from '@prisma/client';
import { RequestDto } from '../dto/request.dto';
import { ApiOkResponse } from '@nestjs/swagger';
import { VideoJobEntity } from './entities/videojob.entity';
import { AudioGenerationService } from './services/audio-generation.service';

@Controller('video')
export class VideoController {
  constructor(
    private readonly videoService: VideoService,
    private readonly audioService: AudioGenerationService,
  ) {}

  @Post('jobs')
  @UseGuards(JwtAuthGuard) // Assuming you have JWT auth
  async createVideoJob(
    @Request() req: RequestDto,
    @Body() createJobDto: { prompt: string },
  ) {
    const userId = req.user.userId; // From JWT payload
    console.log('req', req.user);
    return this.videoService.createVideoJob(userId, createJobDto.prompt);
  }

  @Get('jobs/:jobId')
  @UseGuards(JwtAuthGuard)
  async getJobStatus(
    @Request() req: RequestDto,
    @Param('jobId') jobId: string,
  ) {
    const userId = req.user.userId;
    return this.videoService.getJobStatus(jobId, userId);
  }

  @Get('jobs')
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ type: VideoJobEntity })
  async getUserJobs(
    @Request() req: RequestDto,
    @Query('status') status?: JobStatus,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const userId = req.user.userId;
    return this.videoService.getUserJobs(userId, {
      status,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });
  }

  @Get('processing')
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ type: VideoJobEntity })
  async getProcessingVideos(
    @Request() req: RequestDto,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const userId = req.user.userId;
    return this.videoService.getProcessingJobs(userId, {
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });
  }

  // @Post('audio')
  // @UseGuards(JwtAuthGuard)
  // async reuploadAudio(@Body() { url }: { url: string }) {
  //   const result = await this.audioService.convertPcmToWav(url);
  //   return {
  //     success: true,
  //     originalUrl: url,
  //     newUrl: result.newUrl,
  //     assetId: result.assetId,
  //   };
  // }
}
