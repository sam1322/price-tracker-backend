
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { chromium, Browser } from 'playwright';

/**
 * A dedicated service responsible ONLY for managing the Playwright Browser lifecycle.
 * It ensures that a single browser instance is launched, shared, and properly closed.
 */
@Injectable()
export class BrowserService implements OnModuleInit, OnModuleDestroy {
  private browser: Browser | null = null;
  private readonly logger = new Logger(BrowserService.name);

  async onModuleInit() {
    this.logger.log('Initializing shared Playwright browser instance...');
    try {
      this.browser = await chromium.launch({ headless: true });
      this.logger.log('Shared browser launched successfully.');
    } catch (error) {
      this.logger.error('Failed to launch shared browser:', error);
    }
  }

  async onModuleDestroy() {
    if (this.browser) {
      this.logger.log('Closing shared browser...');
      await this.browser.close();
    }
  }

  /**
   * Provides access to the shared browser instance.
   * @returns The Playwright Browser instance.
   */
  getBrowser(): Browser {
    if (!this.browser) {
      throw new Error('Browser is not initialized. Check startup logs.');
    }
    return this.browser;
  }
}