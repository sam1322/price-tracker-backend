import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { PrismaService } from '../../prisma/prisma.service';
import { KafkaTopics } from '../../constants/kafka-topic-mapper';
import { EventType, JobStatus } from '@prisma/client';
import { GeneratedScript } from './llm.service';
import { ImageGenerationService } from './image-generation.service';
import { AzureService } from '../../azure/azure.service';
import { AudioGenerationService } from './audio-generation.service';

// asset-generation.worker.ts
@Injectable()
export class AssetGenerationWorker {
  private readonly logger = new Logger(AssetGenerationWorker.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly imageService: ImageGenerationService,
    private readonly audioService: AudioGenerationService,
    private readonly storageService: AzureService,
    // @Inject('KAFKA_PRODUCER') private readonly producer: Producer,
  ) {}
  async handleScriptGenerated(message: { jobId: string }) {
    const { jobId } = message;
    this.logger.log(`Processing asset generation for job ${jobId}`);

    try {
      // Update status
      await this.prisma.videoJob.update({
        where: { id: jobId },
        // data: { status: 'GENERATING_ASSETS' },
        data: { status: JobStatus.GENERATING_ASSETS },
      });

      // Fetch the script
      const job = await this.prisma.videoJob.findUnique({
        where: { id: jobId },
      });
      if (!job || !job.scriptText) {
        throw new InternalServerErrorException(
          "Job or the script doesn't exist",
        );
      }
      const script: GeneratedScript = JSON.parse(
        job.scriptText,
      ) as GeneratedScript;

      // Generate all assets in parallel
      const assetPromises = [];

      // Generate images for each scene
      script.scenes.forEach((scene, index) => {
        // @ts-expect-error fix this later
        assetPromises.push(this.generateImage(jobId, scene, index));
      });

      // Generate audio narration
      // @ts-expect-error fix this later
      assetPromises.push(this.generateAudio(jobId, script.narration));

      // Wait for all assets
      // TODO: use Promise.allSettled instead
      await Promise.all(assetPromises);

      // Update status and trigger next step
      await this.prisma.$transaction(async (tx) => {
        await tx.videoJob.update({
          where: { id: jobId },
          data: { status: JobStatus.ASSETS_GENERATED },
        });

        await tx.outboxEvent.create({
          data: {
            jobId,
            // eventType: 'video.assets.generated',
            eventType: EventType.VIDEO_ASSETS_GENERATED,
            payload: { jobId },
          },
        });
      });

      this.logger.log(`Assets generated for job ${jobId}`);
    } catch (error) {
      await this.handleError(jobId, error);
    }
  }

  // TODO: implement retry mechanism here later
  private async generateImage(
    jobId: string,
    scene: { visualPrompt: string; description: string; duration: number },
    index: number,
  ) {
    // Generate image
    const imageBuffer = await this.imageService.generateImage(
      scene.visualPrompt,
    );

    // Upload to Azure
    const blobName = `${jobId}/image_${index}.png`;
    const url = await this.storageService.uploadBuffer(imageBuffer, blobName);

    // Save to database
    await this.prisma.jobAsset.create({
      data: {
        jobId,
        type: 'IMAGE',
        url,
        duration: scene.duration,
        metadata: {
          index,
          duration: scene.duration,
          description: scene.description,
        },
      },
    });
  }

  // TODO: add logs here
  private async generateAudio(jobId: string, narration: string) {
    // Generate audio
    const audioBuffer = await this.audioService.generateAudio(narration);

    // Upload to Azure
    const blobName = `${jobId}/narration.wav`;
    const url = await this.storageService.uploadBuffer(
      audioBuffer,
      blobName,
      'audio/wav',
    );
    // Save to database
    await this.prisma.jobAsset.create({
      data: {
        jobId,
        type: 'AUDIO',
        url,
        metadata: {
          text: narration,
        },
      },
    });
  }

  private async handleError(jobId: string, error: any) {
    this.logger.error(`Asset generation failed for job ${jobId}`, error);

    await this.prisma.videoJob.update({
      where: { id: jobId },
      data: {
        status: 'FAILED',
        error: error.message,
      },
    });
  }
}
