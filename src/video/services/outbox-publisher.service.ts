// outbox-publisher.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Interval } from '@nestjs/schedule';
import { EVENT_TO_TOPIC } from '../../constants/kafka-topic-mapper';
import { KafkaService } from '../../kafka/kafka.service';

@Injectable()
export class OutboxPublisherService {
  private readonly logger = new Logger(OutboxPublisherService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly kafkaService: KafkaService,
    // @Inject('KAFKA_PRODUCER') private readonly producer: Producer,
  ) {}
  @Interval(5000) // Run every second
  async publishPendingEvents() {
    const maxRetries = 5;
    this.logger.log('publish outbox events');
    const events = await this.prisma.outboxEvent.findMany({
      where: { processed: false, retryCount: { lt: maxRetries } },
      orderBy: { createdAt: 'asc' },
      take: 10,
    });

    if (events.length === 0) return; // Early return if no events

    for (const event of events) {
      try {
        const kafkaTopic = EVENT_TO_TOPIC[event.eventType]; // 'video.jobs.created.v1'

        this.kafkaService.emitEvent({
          topic: kafkaTopic,
          payload: {
            key: event.jobId,
            value: JSON.stringify(event.payload),
          },
        });

        await this.prisma.outboxEvent.update({
          where: { id: event.id },
          data: { processed: true },
        });

        this.logger.log(
          `Published event ${event.eventType} for job ${event.jobId}`,
        );
      } catch (error) {
        this.logger.error(`Failed to publish event ${event.id}`, error);
        await this.prisma.outboxEvent.update({
          where: { id: event.id },
          data: { retryCount: { increment: 1 }, processed: false },
        });
      }
    }
  }
}
