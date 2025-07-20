import { Controller, Post, Body, Get, Query, Res, BadRequestException } from '@nestjs/common';
import { InstagramService } from './instagram.service';
import { Response } from 'express';
import axios from 'axios';

@Controller('instagram')
export class InstagramController {
  constructor(private readonly instagramService: InstagramService) { }

  // ENDPOINT 1: Extracts the direct .mp4 URL
  @Post('download')
  async getDownloadLink(@Body('url') postUrl: string) {
    if (!postUrl) {
      throw new BadRequestException('URL is required');
    }
    const videoUrl = await this.instagramService.extractVideoUrl(postUrl);
    return { videoUrl };
  }

  // ENDPOINT 2: The proxy/stream endpoint
  // TODO - fix the stream part of this endpoint
  @Get('stream')
  async streamVideo(@Query('url') videoUrl: string, @Res() res: Response) {
    // if (!postUrl) {
    //   throw new BadRequestException('URL is required');
    // }
    // const videoUrl = await this.instagramService.extractVideoUrl(postUrl);
    if (!videoUrl) {
      throw new BadRequestException('Video URL is required for streaming.');
    }

    try {
      // Make a request to the video URL with a streaming response type
      const response = await axios({
        method: 'get',
        url: videoUrl,
        responseType: 'stream',
      });

      // Set the proper headers to tell the browser it's a video file
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Content-Disposition', 'attachment; filename="instagram-video.mp4"');

      // Pipe the video stream from Instagram's server to our response
      response.data.pipe(res);
    } catch (error) {
      res.status(500).send('Failed to stream video.');
    }
  }
}