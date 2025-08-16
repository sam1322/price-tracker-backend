import { Body, Controller, Post } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { KafkaService } from './kafka.service';
import { VideoJobCreated } from './dto/kafka-message.interface';

@Controller('kafka')
export class KafkaController {
  constructor(private readonly kafkaService: KafkaService) {}
  @EventPattern('video.job.created')
  handleVideoJobCreated(@Payload() message: VideoJobCreated) {
    // The message payload is already parsed from JSON
    const { jobId, prompt, timestamp } = message;
    try {
      console.log(
        `Processing job ${jobId} with prompt: ${prompt} at ${timestamp}`,
      );
    } catch (error) {
      console.error(`Failed to process job ${jobId}:`, error);
    }
  }

  @Post('/producer')
  kafkaProducer(@Body() body: { jobId: string; prompt: string }) {
    this.kafkaService.generateVideoJob(body.jobId, body.prompt);
    return {
      message: 'message sent successfully',
    };
  }
}
