import { Module } from '@nestjs/common';
import { BrowserModule } from '../browser/browser.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ScraperService } from './scraper.service';
import { AmazonScraperService } from './services/amazon-scraper.service';
import { FlipkartScraperService } from './services/flipkart-scraper.service';
import { ScraperScheduleService } from './scraper-schedule.service';
import { ScraperController } from './scraper.controller';

@Module({
  imports: [BrowserModule, PrismaModule],
  providers: [
    ScraperService,
    AmazonScraperService,
    FlipkartScraperService,
    ScraperScheduleService,
  ],
  exports: [ScraperService],
  controllers:[ScraperController]
})
export class ScraperModule {}