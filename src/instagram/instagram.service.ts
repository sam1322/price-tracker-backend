import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { chromium, Browser, Page } from 'playwright';
import * as path from 'path'; // Import path for saving screenshots
import { BrowserService } from 'src/browser/browser.service';

@Injectable()
export class InstagramService {

  private readonly logger = new Logger(InstagramService.name);

  constructor(private browserService: BrowserService) { }

  // private browser: Browser | null = null;

  // async onModuleInit() {
  //   // Launch the browser when the module starts
  //   console.log("starting the browser instance")
  //   this.browser = await chromium.launch();
  // }

  // async onModuleDestroy() {
  //   // Close the browser when the app shuts down
  //   console.log("closing the browser")
  //   await this.browser?.close();
  // }

  async handlePopup(page: Page) {
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

  async extractVideoUrl1(postUrl: string): Promise<string> {
    // const browser = this.browserService.getBrowser();

    // if (!browser) {
    //   throw new InternalServerErrorException('Browser is not initialized.');
    // }
    // const context = await browser.newContext({
    //   // Use a realistic user agent to avoid basic bot detection
    //   userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
    // });
    // const page: Page = await context.newPage();
    const getPage1 = async (page: Page): Promise<string> => {
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
        this.logger.log('Instgram service successfull')
        const screenshotPath = path.join(__dirname, `../../success-screenshot-${Date.now()}.png`);
        await page.screenshot({ path: screenshotPath });
        return videoUrl;

      } catch (error) {
        // --- CRUCIAL DEBUGGING STEP ---
        // Save a screenshot of the page when an error occurs
        const screenshotPath = path.join(__dirname, `../../error-screenshot-${Date.now()}.png`);
        await page.screenshot({ path: screenshotPath });
        this.logger.error(`Playwright scraping error. A screenshot has been saved to: ${screenshotPath}`);

        this.logger.error(error); // Log the actual error
        throw new InternalServerErrorException('Failed to extract video.');
      } finally {
        // await page.close();
        // if (page) {
        //   await this.browserService.closePage(page);
        // }
      }
    }
    return this.browserService.usePage(getPage1)
  }


  async extractVideoUrl(postUrl: string): Promise<string> {

    // const page = await this.browserService.getPage()
    const getPage = async (page: Page): Promise<string> => {
      try {
        await page.goto(postUrl);

        // Instagram often puts structured data in a <script type="application/ld+json"> tag.
        // This is a common pattern for SEO and data sharing.
        const scriptLocator = page.locator('script[type="application/ld+json"]');

        // Wait for the script tag to appear on the page.
        await scriptLocator.waitFor({ state: 'attached', timeout: 10000 });

        const scriptContent = await scriptLocator.textContent();

        if (!scriptContent) {
          throw new Error('Could not find the JSON data script tag on the page.');
        }

        // Parse the text content of the script tag as JSON.
        const jsonData = JSON.parse(scriptContent);

        // Now, we just need to find the video URL within the JSON object.
        // The exact path might change, but it's often `video.contentUrl` or similar.
        const videoUrl = jsonData?.video?.contentUrl || jsonData?.contentUrl;

        if (!videoUrl) {
          throw new Error('Found the JSON data, but it did not contain a video URL.');
        }

        this.logger.log(`Successfully extracted video URL from page data: ${videoUrl}`);
        return videoUrl;

      } catch (error) {
        this.logger.error(`Failed to extract video URL using the JSON script method for ${postUrl}.`, error.message);
        throw new Error('Could not find the video URL. The site structure may have changed.');
      } finally {
        // await page.close();
        // if (page) {
        //   await this.browserService.closePage(page);
        // }
      }
    }

    return this.browserService.usePage(getPage)

  }


  async extractVideoUrl2(postUrl: string): Promise<string> {
    const getPage2 = async (page: Page): Promise<string> => {
      try {
        // 1. Start waiting for the video response BEFORE navigating.
        // This promise will resolve when a network response matching the criteria is found.
        const videoResponsePromise = page.waitForResponse(
          response => {
            // You can use either condition. Checking the URL is often sufficient.
            // Condition 1: Check if the URL is for an MP4 video file.
            return response.url().includes('.mp4') && response.status() === 200;

            // Condition 2 (more robust): Check the content-type header.
            // return response.headers()['content-type'] === 'video/mp4';
          },
          { timeout: 15000 } // Set a reasonable timeout for the video to load
        );

        // 2. Navigate to the page. This triggers the network requests.
        await page.goto(postUrl, { waitUntil: 'domcontentloaded' });

        // 3. Wait for the video response to be captured.
        const videoResponse = await videoResponsePromise;
        const videoUrl = videoResponse.url();

        if (!videoUrl) {
          throw new NotFoundException('Could not find video source URL via network interception.');
        }

        this.logger.log(`Successfully extracted video URL: ${videoUrl}`);

        // Optional: Save a success screenshot for verification
        const screenshotPath = path.join(__dirname, `../../success-screenshot-${Date.now()}.png`);
        await page.screenshot({ path: screenshotPath });

        return videoUrl;

      } catch (error) {
        const screenshotPath = path.join(__dirname, `../../error-screenshot-${Date.now()}.png`);
        await page.screenshot({ path: screenshotPath });
        this.logger.error(`Playwright scraping error. Screenshot saved to: ${screenshotPath}`);
        this.logger.error(error); // Log the actual error

        // if (error instanceof playwright.errors.TimeoutError) {
        //   this.logger.error('TimeoutError: The video network request was not detected in time.');
        //   throw new InternalServerErrorException('Failed to extract video: Timed out waiting for the video data.');
        // }

        this.logger.error(error);
        throw new InternalServerErrorException('Failed to extract video.');
      } finally {
        // 4. Close the page to free up resources.
        // await page.close();
      }
    }
    return this.browserService.usePage(getPage2)
  }
}

