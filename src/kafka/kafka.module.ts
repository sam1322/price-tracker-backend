import { Module } from '@nestjs/common';
import { KafkaService } from './kafka.service';
import { KafkaController } from './kafka.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'VIDEO_SERVICE', // Injection token
        transport: Transport.KAFKA,
        options: {
          client: {
            brokers: [process.env.KAFKA_BROKERS || 'localhost:9092'],
          },
          // consumer: {
          //   // A unique consumer group ID for this client instance
          //   groupId: 'api-gateway-client',
          // },
        },
      },
    ]),
  ],
  providers: [KafkaService],
  controllers: [KafkaController],
})
export class KafkaModule {}
