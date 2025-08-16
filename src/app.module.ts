import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { BrowserModule } from './browser/browser.module';
import { InstagramModule } from './instagram/instagram.module';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { ScraperModule } from './scraper/scraper.module';
import { TrackerModule } from './tracker/tracker.module';
import { HealthModule } from './health/health.module';
import { VideoModule } from './video/video.module';
import { AzureModule } from './azure/azure.module';
import { KafkaModule } from './kafka/kafka.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 6000,
          limit: 10,
        },
      ],
    }),
    // ClientsModule.register([
    //   {
    //     name: 'VIDEO_SERVICE', // Injection token
    //     transport: Transport.KAFKA,
    //     options: {
    //       client: {
    //         brokers: [process.env.KAFKA_BROKERS || 'localhost:9092'],
    //       },
    //       // consumer: {
    //       //   // A unique consumer group ID for this client instance
    //       //   groupId: 'api-gateway-client',
    //       // },
    //     },
    //   },
    // ]),
    UsersModule,
    AuthModule,
    InstagramModule,
    PrismaModule,
    BrowserModule,
    ScraperModule,
    TrackerModule,
    HealthModule,
    VideoModule,
    AzureModule,
    KafkaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
