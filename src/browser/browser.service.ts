
// import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
// import { chromium, Browser } from 'playwright';

// /**
//  * A dedicated service responsible ONLY for managing the Playwright Browser lifecycle.
//  * It ensures that a single browser instance is launched, shared, and properly closed.
//  */
// @Injectable()
// export class BrowserService implements OnModuleInit, OnModuleDestroy {
//   private browser: Browser | null = null;
//   private readonly logger = new Logger(BrowserService.name);

//   async onModuleInit() {
//     const chromiumPath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
//     this.logger.log('Initializing shared Playwright browser instance...', chromiumPath);
//     try {
//       this.browser = await chromium.launch({
//         headless: true,
//         executablePath: chromiumPath,
//         // headless: true,
//         args: [
//           '--no-sandbox',
//           '--disable-setuid-sandbox',
//           '--disable-dev-shm-usage',
//           '--disable-gpu',
//           '--no-first-run',
//           '--no-zygote',
//           '--single-process',
//           '--disable-web-security'
//         ]
//       });
//       this.logger.log('Shared browser launched successfully.');
//     } catch (error) {
//       this.logger.error('Failed to launch shared browser:', error);
//     }
//   }

//   async onModuleDestroy() {
//     if (this.browser) {
//       this.logger.log('Closing shared browser...');
//       await this.browser.close();
//     }
//   }

//   /**
//    * Provides access to the shared browser instance.
//    * @returns The Playwright Browser instance.
//    */
//   getBrowser(): Browser {
//     if (!this.browser) {
//       throw new Error('Browser is not initialized. Check startup logs.');
//     }
//     return this.browser;
//   }
// }

// import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
// import { Browser, chromium } from 'playwright';

// @Injectable()
// export class BrowserService implements OnModuleInit, OnModuleDestroy {
//   private browser: Browser;

//   async onModuleInit() {
//     try {
//       // Connect to the browserless service
//       const wsEndpoint = process.env.BROWSER_WS_ENDPOINT || 'ws://localhost:3002';

//       this.browser = await chromium.connectOverCDP(wsEndpoint);
//       console.log('Connected to browser service successfully');
//     } catch (error) {
//       console.error('Failed to connect to browser service:', error);
//       throw error;
//     }
//   }

//   async onModuleDestroy() {
//     if (this.browser) {
//       await this.browser.close();
//     }
//   }

//   async getPage() {
//     const context = await this.browser.newContext({
//       viewport: { width: 1920, height: 1080 },
//       userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
//       bypassCSP: true, // Bypass Content Security Policy
//       ignoreHTTPSErrors: true,
//       javaScriptEnabled: true,
//       // Add these for Instagram
//       locale: 'en-US',
//       timezoneId: 'America/New_York',
//       permissions: ['geolocation'],
//       extraHTTPHeaders: {
//         'Accept-Language': 'en-US,en;q=0.9',
//       }
//     });
//     await context.route('**/*', route => route.continue());

//     return await context.newPage();
//   }

//   getBrowser(): Browser {
//     if (!this.browser) {
//       throw new Error('Browser is not initialized. Check startup logs.');
//     }
//     return this.browser;
//   }
// }


import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Browser, chromium, BrowserContext, Page } from 'playwright';

@Injectable()
export class BrowserService implements OnModuleInit, OnModuleDestroy {
  private browser: Browser | null = null;
  private readonly logger = new Logger(BrowserService.name);
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 3;
  private readonly wsEndpoint: string;
  private readonly browserlessUrl: string;

  constructor() {
    this.wsEndpoint = process.env.BROWSER_WS_ENDPOINT || 'ws://localhost:3002';
    // this.wsEndpoint = process.env.BROWSER_WS_ENDPOINT || 'ws://localhost:3002';
    this.browserlessUrl = process.env.BROWSERLESS_URL || 'http://localhost:3000';
  }

  async onModuleInit() {
    // await this.connectToBrowser();
    await this.connect()
  }

  async onModuleDestroy() {
    if (this.browser) {
      try {
        await this.browser.close();
      } catch (error) {
        this.logger.warn('Error closing browser during shutdown:', error.message);
      }
    }
  }

  private async connectToBrowser(): Promise<void> {
    try {
      const wsEndpoint = this.wsEndpoint + "?--disable-cleanup"
      this.logger.log('Attempting to connect to browser service', wsEndpoint);
      this.browser = await chromium.connectOverCDP(this.wsEndpoint);
      // this.browser = await chromium.connect(this.wsEndpoint, {
      //   // timeout: 60000, // Optional: Set a connection timeout
      // });

      // Listen for browser disconnect events
      this.browser.on('disconnected', () => {
        this.logger.warn('Browser disconnected, will reconnect on next request');
        this.browser = null;
        this.reconnectAttempts = 0;
      });

      this.logger.log('Connected to browser service successfully');
      this.reconnectAttempts = 0;
    } catch (error) {
      this.logger.error('Failed to connect to browser service:', error.message);
      throw error;
    }
  }

  private async ensureBrowserConnection(): Promise<Browser> {
    if (!this.browser || !this.browser.isConnected()) {
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        throw new Error('Max reconnection attempts reached. Browser service may be down.');
      }

      this.logger.log('Reconnecting to browser service...');
      this.reconnectAttempts++;

      try {
        await this.connectToBrowser();
      } catch (error) {
        this.logger.error(`Reconnection attempt ${this.reconnectAttempts} failed:`, error.message);
        throw error;
      }
    }
    // @ts-expect-error type error
    return this.browser;
  }

  async getPage(): Promise<Page> {
    const browser = await this.ensureBrowserConnection();
    // const browser = this.connectToBrowser()

    try {
      const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        bypassCSP: true,
        ignoreHTTPSErrors: true,
        javaScriptEnabled: true,
        locale: 'en-US',
        timezoneId: 'America/New_York',
        permissions: ['geolocation'],
        extraHTTPHeaders: {
          'Accept-Language': 'en-US,en;q=0.9',
        }
      });

      // Set up route handling
      await context.route('**/*', route => route.continue());

      const page = await context.newPage();

      // Add error handling for page close events
      page.on('close', () => {
        this.logger.debug('Page closed');
      });

      return page;
    } catch (error) {
      this.logger.error('Error creating new page:', error.message);

      // If context creation fails, mark browser as disconnected for reconnection
      if (error.message.includes('closed') || error.message.includes('disconnected')) {
        this.browser = null;
      }

      throw error;
    }
  }

  // async getBrowser(): Promise<Browser> {
  //   return await this.ensureBrowserConnection();
  // }


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


  // Helper method to safely close page and context
  async closePage1(page: Page): Promise<void> {
    try {
      const context = page.context();
      await page.close();
      await context.close();
    } catch (error) {
      this.logger.warn('Error closing page/context:', error.message);
    }
  }

  async getPage1(): Promise<Page> {
    try {
      // Connect to a fresh browser session each time
      const wsEndpoint = `${this.browserlessUrl.replace('http', 'ws')}/chrome?stealth&--no-sandbox&--disable-setuid-sandbox`;

      this.logger.debug(`Connecting to: ${wsEndpoint}`);

      const browser = await chromium.connectOverCDP(wsEndpoint);

      const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        bypassCSP: true,
        ignoreHTTPSErrors: true,
        javaScriptEnabled: true,
        locale: 'en-US',
        timezoneId: 'America/New_York',
        permissions: ['geolocation'],
        extraHTTPHeaders: {
          'Accept-Language': 'en-US,en;q=0.9',
        }
      });

      const page = await context.newPage();

      // Store browser reference on page for cleanup
      (page as any)._browser = browser;

      return page;

    } catch (error) {
      this.logger.error('Error creating new page:', error.message);
      throw error;
    }
  }

  async closePage(page: Page): Promise<void> {
    try {
      const browser = (page as any)._browser;
      const context = page.context();

      await page.close();
      await context.close();

      if (browser) {
        await browser.close();
      }
    } catch (error) {
      this.logger.warn('Error closing page/context:', error.message);
    }
  }

  async usePage<T>(fn: (page: Page) => Promise<T>): Promise<T> {
    const browser = await this.getBrowser();
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      bypassCSP: true,
      ignoreHTTPSErrors: true,
      javaScriptEnabled: true,
      locale: 'en-US',
      timezoneId: 'America/New_York',
      permissions: ['geolocation'],
      extraHTTPHeaders: {
        'Accept-Language': 'en-US,en;q=0.9',
      }
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