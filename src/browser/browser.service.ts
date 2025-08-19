import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Browser, chromium, Page } from 'playwright';

@Injectable()
export class BrowserService implements OnModuleInit, OnModuleDestroy {
  private browser: Browser | null = null;
  private readonly logger = new Logger(BrowserService.name);
  private readonly wsEndpoint: string;

  constructor() {
    this.wsEndpoint = process.env.BROWSER_WS_ENDPOINT || 'ws://localhost:3002';
  }

  async onModuleInit() {
    // await this.connectToBrowser();
    await this.connect();
  }

  async onModuleDestroy() {
    if (this.browser) {
      try {
        await this.browser.close();
      } catch (error) {
        this.logger.warn(
          'Error closing browser during shutdown:',
          error.message,
        );
      }
    }
  }

  private async connect(): Promise<Browser> {
    try {
      // Use ws:// and the URL builder for safety
      const baseWsEndpoint = this.wsEndpoint;
      const url = new URL(baseWsEndpoint);
      url.searchParams.append('--disable-cleanup', 'true');
      const finalWsEndpoint = url.toString();

      this.logger.log(`Attempting to connect to: ${finalWsEndpoint}`);

      this.browser = await chromium.connectOverCDP(finalWsEndpoint);

      // const browser = await chromium.connect(finalWsEndpoint, { timeout: 30000 });

      this.logger.log('Connection successful!');
      this.browser.on('disconnected', () => {
        this.logger.error('Browser disconnected!');
        this.browser = null;
      });
      return this.browser;
    } catch (error) {
      this.logger.error('Failed to connect to browser service.', error);
      throw error;
    }
  }

  async getBrowser(): Promise<Browser> {
    if (!this.browser || !this.browser.isConnected()) {
      this.browser = await this.connect();
    }
    return this.browser;
  }

  async usePage<T>(fn: (page: Page) => Promise<T>): Promise<T> {
    const browser = await this.getBrowser();
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      bypassCSP: true,
      ignoreHTTPSErrors: true,
      javaScriptEnabled: true,
      locale: 'en-US',
      timezoneId: 'America/New_York',
      permissions: ['geolocation'],
      extraHTTPHeaders: {
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    try {
      const page = await context.newPage();
      return await fn(page);
    } finally {
      // This guarantees the context is always closed.
      await context.close();
    }
  }
}
