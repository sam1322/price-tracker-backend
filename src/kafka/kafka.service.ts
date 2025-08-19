import { Inject, Injectable } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { KafkaTopics } from '../constants/kafka-topic-mapper';
import { Interval } from '@nestjs/schedule';

@Injectable()
export class KafkaService {
  // export class KafkaService implements OnModuleInit {
  constructor(
    @Inject('VIDEO_SERVICE') private readonly kafkaClient: ClientKafka,
  ) {}

  @Interval(10000)
  checkConsumerHealth() {
    const status = this.kafkaClient.emit('health-check', {
      timestamp: Date.now(),
    });
    console.log('Consumer health:', status);
  }

  // async onModuleInit() {
  //   // It's good practice to ensure the client is connected
  //   await this.kafkaClient.connect();
  // }

  // This would be called from your controller after the DB transaction
  generateVideoJob(jobId: string, prompt: string) {
    console.log(`Emitting event for job: ${jobId}`);
    const message = {
      key: jobId,
      value: JSON.stringify({ jobId, prompt, timestamp: new Date() }), // Message payload
    };
    this.kafkaClient.emit(
      KafkaTopics.VIDEO_JOB_FAILED.topic,
      // 'video.job.created', // Topic name
      message,
    );
  }

  emitEvent({
    topic,
    payload,
  }: {
    topic: string;
    payload: {
      key: string;
      value: string;
    };
  }) {
    this.kafkaClient.emit(topic, payload);
  }
}
