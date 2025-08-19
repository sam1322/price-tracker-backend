import { Module } from '@nestjs/common';
import { VideoController } from './video.controller';
import { VideoService } from './video.service';
import { FFmpegService } from './services/ffmpeg.service';
import { ImageGenerationService } from './services/image-generation.service';
import { AudioGenerationService } from './services/audio-generation.service';
import { LLMService } from './services/llm.service';
import { PrismaModule } from '../prisma/prisma.module';
import { KafkaModule } from '../kafka/kafka.module';
import { OutboxPublisherService } from './services/outbox-publisher.service';
import { VideoRenderingWorker } from './services/video-rendering.service';
import { ScriptGenerationWorker } from './services/script-generation.service';
import { AssetGenerationWorker } from './services/asset-generation.service';
import { AzureModule } from '../azure/azure.module';
import { VideoConsumerController } from './video-consumer.controller';

@Module({
  imports: [PrismaModule, KafkaModule, AzureModule],
  controllers: [VideoController, VideoConsumerController],
  providers: [
    VideoService,
    FFmpegService,
    ImageGenerationService,
    AudioGenerationService,
    LLMService,
    OutboxPublisherService,
    VideoRenderingWorker,
    ScriptGenerationWorker,
    AssetGenerationWorker,
  ],
})
export class VideoModule {}
