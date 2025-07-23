import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { BrowserModule } from './browser/browser.module';
import { InstagramModule } from './instagram/instagram.module';
import { UsersModule } from './users/users.module';
// import { ScrapingModule } from './scraping/scraping.module';

// @Module({
//   imports: [UsersModule, AuthModule, InstagramModule, BrowserModule, ScrapingModule],
//   controllers: [AppController],
//   providers: [AppService],
// })
// export class AppModule {}

import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { ScraperModule } from './scraper/scraper.module';
import { TrackerModule } from './tracker/tracker.module';
// import { PrismaModule } from './modules/prisma/prisma.module';
// import { ScraperModule } from './modules/scraper/scraper.module';
// import { TrackerModule } from './modules/tracker/tracker.module';

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
        }
      ]
    }),
    UsersModule, AuthModule, InstagramModule,
    PrismaModule,
    BrowserModule,
    ScraperModule,
    TrackerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }