import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ScraperService } from './scraper.service';

@Injectable()
export class ScraperScheduleService {
  private readonly logger = new Logger(ScraperScheduleService.name);

  constructor(private scraperService: ScraperService) { }

  // Run every 6 hours
  @Cron('15 */6 * * *')
  // @Cron('0 */3 * * * *')
  async handleCron() {
    this.logger.log('Starting scheduled price update...');
    try {
      await this.scraperService.scrapeTrackedItems();
      this.logger.log('Scheduled price update completed');
    } catch (error) {
      this.logger.error('Scheduled price update failed:', error);
    }
  }
}