import { Controller } from '@nestjs/common';
import { ScriptGenerationWorker } from './services/script-generation.service';
import { VideoRenderingWorker } from './services/video-rendering.service';
import { AssetGenerationWorker } from './services/asset-generation.service';
import { EventPattern, Payload } from '@nestjs/microservices';
import { KafkaTopics } from '../constants/kafka-topic-mapper';

@Controller()
export class VideoConsumerController {
  constructor(
    private readonly scriptService: ScriptGenerationWorker,
    private readonly videoRenderingService: VideoRenderingWorker,
    private readonly assetGenerationService: AssetGenerationWorker,
  ) {}
  @EventPattern(KafkaTopics.VIDEO_JOB_CREATED.topic)
  async handleJobCreated(
    @Payload() message: { jobId: string; prompt: string },
  ) {
    await this.scriptService.handleJobCreated(message);
  }

  @EventPattern(KafkaTopics.VIDEO_SCRIPT_GENERATED.topic)
  async handleScriptGenerated(
    @Payload() message: { jobId: string; prompt: string },
  ) {
    await this.assetGenerationService.handleScriptGenerated(message);
  }

  @EventPattern(KafkaTopics.VIDEO_ASSETS_GENERATED.topic)
  async handleAssetsGenerated(
    @Payload() message: { jobId: string; prompt: string },
  ) {
    await this.videoRenderingService.handleAssetsGenerated(message);
  }
}
