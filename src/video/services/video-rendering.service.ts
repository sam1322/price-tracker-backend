import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AzureService } from '../../azure/azure.service';
import { FFmpegService } from './ffmpeg.service';
import fs from 'fs';
import path from 'path';
import { JobAsset, JobStatus } from '@prisma/client';

// video-rendering.worker.ts
@Injectable()
export class VideoRenderingWorker {
  private readonly logger = new Logger(VideoRenderingWorker.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: AzureService,
    private readonly ffmpegService: FFmpegService,
  ) {}

  // @EventPattern('video.assets.generated')
  async handleAssetsGenerated(message: { jobId: string }) {
    const { jobId } = message;
    this.logger.log(`Processing video rendering for job ${jobId}`);

    // const tempDir = path.join('/tmp', jobId);
    const tempDir = path.join(process.cwd(), 'uploads');
    await fs.promises.mkdir(tempDir, { recursive: true });

    try {
      // Update status
      await this.prisma.videoJob.update({
        where: { id: jobId },
        data: { status: JobStatus.RENDERING_VIDEO },
      });

      // Fetch all assets
      const assets = await this.prisma.jobAsset.findMany({
        where: { jobId },
        orderBy: { createdAt: 'asc' },
      });

      // Download all assets locally
      const localAssets = await this.downloadAssets(assets, tempDir);

      // Render video using FFmpeg
      // const outputPath = path.join(tempDir, 'output.mp4');
      const outputPath = path.join(
        process.cwd(),
        'uploads',
        `${jobId}_final.mp4`,
      );
      await this.ffmpegService.createVideo(
        localAssets.images,
        localAssets.audio ?? '',
        outputPath,
      );
      // await this.ffmpegService.renderVideo(localAssets, outputPath);

      // Upload final video to Azure
      const videoBuffer = await fs.promises.readFile(outputPath);
      const blobName = `${jobId}/final_video.mp4`;
      const videoUrl = await this.storageService.uploadBuffer(
        videoBuffer,
        blobName,
      );

      // Update job as completed
      await this.prisma.videoJob.update({
        where: { id: jobId },
        data: {
          status: 'COMPLETED',
          videoUrl,
        },
      });

      // Cleanup temp files
      await fs.promises.rm(tempDir, { recursive: true, force: true });

      this.logger.log(`Video rendered successfully for job ${jobId}`);
    } catch (error) {
      await this.handleError(jobId, error);
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    }
  }

  private async downloadAssets(assets: JobAsset[], tempDir: string) {
    type LocalAssetsType = {
      images: { path: string; duration: number; index: number }[];
      audio: string;
    };
    const localAssets: LocalAssetsType = {
      images: [],
      audio: '',
    };

    for (const asset of assets) {
      const filename =
        asset.type === 'IMAGE'
          ? `image_${asset.metadata?.index}.png`
          : 'narration.wav';
      const localPath = path.join(tempDir, filename);

      await this.storageService.downloadToFile(asset.url, localPath);

      if (asset.type === 'IMAGE') {
        localAssets.images.push({
          path: localPath,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          duration: asset.duration || 5,
          index: asset.metadata?.index || 0,
          // duration: asset.metadata?.duration || 5,
        });
      } else {
        localAssets.audio = localPath;
      }
    }

    // Sort images by index
    localAssets.images.sort((a, b) => a.index - b.index);

    return localAssets;
  }

  private async handleError(jobId: string, error: any) {
    this.logger.error(`Video rendering failed for job ${jobId}`, error);

    await this.prisma.videoJob.update({
      where: { id: jobId },
      data: {
        status: JobStatus.FAILED,
        error: error.message,
      },
    });
  }
}
