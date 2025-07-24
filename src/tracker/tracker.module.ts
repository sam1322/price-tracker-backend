import { Module } from '@nestjs/common';
import { TrackerController } from './tracker.controller';
import { TrackerService } from './tracker.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ScraperModule } from '../scraper/scraper.module';

@Module({
  imports: [PrismaModule, ScraperModule],
  controllers: [TrackerController],
  providers: [TrackerService],
})
export class TrackerModule {}