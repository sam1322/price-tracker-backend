import { Module } from '@nestjs/common';
import { KafkaService } from './kafka.service';
import { KafkaController } from './kafka.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
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

          consumer: {
            groupId: 'video-workers-server',
            sessionTimeout: 45000, // 45 seconds (up from default 10s)
            heartbeatInterval: 15000, // 15 seconds
            rebalanceTimeout: 60000, // 60 seconds
            maxWaitTimeInMs: 5000, // Lower from default 5000 if needed
          },
        },
      },
    ]),
  ],
  providers: [KafkaService],
  controllers: [KafkaController],
  exports: [KafkaService], // 👈 Add this line
})
export class KafkaModule {}
