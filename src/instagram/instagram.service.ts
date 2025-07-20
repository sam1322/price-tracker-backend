import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { chromium, Browser, Page } from 'playwright';

@Injectable()
export class InstagramService {
  private browser: Browser | null = null;

  async onModuleInit() {
    // Launch the browser when the module starts
    console.log("starting the browser instance")
    this.browser = await chromium.launch();
  }

  async onModuleDestroy() {
    // Close the browser when the app shuts down
    console.log("closing the browser")
    await this.browser?.close();
  }

  async extractVideoUrl(postUrl: string): Promise<string> {
    if (!this.browser) {
      throw new InternalServerErrorException('Browser is not initialized.');
    }

    const page: Page = await this.browser.newPage();
    try {
      await page.goto(postUrl, { waitUntil: 'domcontentloaded' });

      // This is the key part: wait for a specific video element to appear on the page.
      // The selector might change, this is just an example.
      const videoSelector = 'video'; // You might need a more specific selector like 'main article video'
      
      // Wait for the video tag to exist and be visible
      await page.waitForSelector(videoSelector, { state: 'visible', timeout: 10000 });

      // Once it exists, get its 'src' attribute
      const videoUrl = await page.getAttribute(videoSelector, 'src');

      if (!videoUrl) {
        throw new NotFoundException('Could not find video source URL on the page.');
      }

      return videoUrl;

    } catch (error) {
      console.error('Playwright scraping error:', error);
      throw new InternalServerErrorException('Failed to extract video');
    } finally {
      await page.close();
    }
  }
}