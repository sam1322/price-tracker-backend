import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { chromium, Browser, Page } from 'playwright';
import * as path from 'path'; // Import path for saving screenshots

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

  async handlePopup(page:Page){
      // This looks for a button that contains the text "Not now" or a close button.
      const notNowButton = page.locator('text=Not now').or(page.locator('[aria-label="Close"]'));
      
      try {
        // Wait for the button for a short time and click it if it appears
        await notNowButton.first().waitFor({ timeout: 5000 });
        await notNowButton.first().click();
        console.log('Dismissed a login/notification pop-up.');
      } catch (e) {
        console.log('No pop-up detected, or it could not be dismissed. Continuing...');
      }
  }

  async extractVideoUrl(postUrl: string): Promise<string> {
    if (!this.browser) {
      throw new InternalServerErrorException('Browser is not initialized.');
    }
    const context = await this.browser.newContext({
      // Use a realistic user agent to avoid basic bot detection
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
    });
    const page: Page = await context.newPage();
    try {
      await page.goto(postUrl, { waitUntil: 'domcontentloaded' });

      // await this.handlePopup(page)

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
      // --- CRUCIAL DEBUGGING STEP ---
      // Save a screenshot of the page when an error occurs
      const screenshotPath = path.join(__dirname, `../../error-screenshot-${Date.now()}.png`);
      await page.screenshot({ path: screenshotPath });
      console.error(`Playwright scraping error. A screenshot has been saved to: ${screenshotPath}`);
      
      console.error(error); // Log the actual error
      throw new InternalServerErrorException('Failed to extract video.');
    } finally {
      await page.close();
    }
  }
}

