import { Inject, Injectable } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';

@Injectable()
export class KafkaService {
  // export class KafkaService implements OnModuleInit {
  constructor(
    @Inject('VIDEO_SERVICE') private readonly kafkaClient: ClientKafka,
  ) {}

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
      'video.job.created', // Topic name
      message,
    );
  }
}
