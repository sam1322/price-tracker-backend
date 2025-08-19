// script-generation.worker.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LLMService } from './llm.service';
import { EventPattern, Payload } from '@nestjs/microservices';
import { EventType, JobStatus } from '@prisma/client';
import { KafkaTopics } from '../../constants/kafka-topic-mapper';

@Injectable()
export class ScriptGenerationWorker {
  private readonly logger = new Logger(ScriptGenerationWorker.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly llmService: LLMService,
  ) {}

  async handleJobCreated(message: { jobId: string; prompt: string }) {
    const { jobId, prompt } = message;

    this.logger.log(`Processing script generation for job ${jobId}`);

    try {
      if (!jobId) throw new Error('jobId is either invalid or missing');
      if (!prompt) throw new Error('prompt is either invalid or missing');
      // Update status to generating script because currently we first have to generate script
      await this.prisma.videoJob.update({
        where: { id: jobId },
        data: { status: JobStatus.GENERATING_SCRIPT },
      });

      // Generate script using LLM
      const script = await this.llmService.generateScriptByGoogle(prompt);

      // Save script and publish next event
      await this.prisma.$transaction(async (tx) => {
        await tx.videoJob.update({
          where: { id: jobId },
          data: {
            status: JobStatus.SCRIPT_GENERATED,
            // scriptText: JSON.stringify(script),
            scriptText: script,
          },
        });

        await tx.outboxEvent.create({
          data: {
            jobId,
            eventType: EventType.VIDEO_SCRIPT_GENERATED,
            payload: { jobId },
          },
        });
      });

      this.logger.log(`Script generated for job ${jobId}`);
    } catch (error) {
      await this.handleError(jobId, error);
    }
  }

  private async handleError(jobId: string, error: any) {
    this.logger.error(`Script generation failed for job ${jobId}`, error);

    await this.prisma.videoJob.update({
      where: { id: jobId },
      data: {
        status: 'FAILED',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        error: error.message,
      },
    });
  }
}
