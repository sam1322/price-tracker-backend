import { Injectable, Logger } from '@nestjs/common';
import { BrowserService } from '../../browser/browser.service';
import { Page } from 'playwright';
import { ProductData, ScraperResult } from '../interfaces/scraper.interface';

@Injectable()
export class AmazonScraperService {
  private readonly logger = new Logger(AmazonScraperService.name);
  private readonly baseUrl = 'https://www.amazon.in';

  constructor(private browserService: BrowserService) { }

  async search(query: string, limit: number = 100): Promise<ScraperResult> {
    const browser = this.browserService.getBrowser();
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    });
    const page = await context.newPage();

    try {
      const searchUrl = `${this.baseUrl}/s?k=${encodeURIComponent(query)}`;
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });

      // Wait for search results
      await page.waitForSelector('[data-component-type="s-search-result"]', { timeout: 10000 });

      const products = await this.extractProducts(page, limit);
      this.logger.log("amazon products recieved", products.length)

      // await page.screenshot({ path: `success-amazon-${Date.now()}.png` });
      this.logger.debug(`Amazon scraping success. A screenshot was saved.`);

      return {
        success: true,
        products,
        vendor: 'AMAZON',
        searchQuery: query,
      };
    } catch (error) {

      this.logger.error(`Error searching Amazon: ${error.message}`);
      // this.logger.error(`[Flipkart] Failed to scrape ${url}`, error.stack);
      await page.screenshot({ path: `error-amazon-${Date.now()}.png` });
      // throw new Error(`Amazon scraping failed. A screenshot was saved.`);
      return {
        success: false,
        products: [],
        vendor: 'AMAZON',
        searchQuery: query,
        error: error.message,
      };
    } finally {
      await context.close();
    }
  }

  async scrapeProduct(productUrl: string): Promise<ProductData | null> {
    const browser = this.browserService.getBrowser();
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    });
    const page = await context.newPage();

    try {
      await page.goto(productUrl, { waitUntil: 'domcontentloaded' });

      // Extract detailed product information
      const productData = await page.evaluate(() => {
        const getTextContent = (selector: string): string => {
          const element = document.querySelector(selector);
          return element?.textContent?.trim() || '';
        };

        const getPrice = (): number => {
          // Try multiple price selectors
          const priceSelectors = [
            '.a-price-whole',
            '.a-price.a-text-price.a-size-medium.apexPriceToPay',
            '.a-price-range',
            '#priceblock_dealprice',
            '#priceblock_ourprice',
          ];


          for (const selector of priceSelectors) {
            const priceText = getTextContent(selector);
            if (priceText) {
              const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
              if (!isNaN(price)) return price;
            }
          }
          return 0;
        };

        const getOriginalPrice = (): number => {
          const originalPriceText = getTextContent('.a-price.a-text-price .a-offscreen');
          if (originalPriceText) {
            const price = parseFloat(originalPriceText.replace(/[^0-9.]/g, ''));
            return isNaN(price) ? 0 : price;
          }
          return 0;
        };

        const getRating = (): number => {
          const ratingText = getTextContent('.a-icon-star .a-icon-alt');
          const match = ratingText.match(/(\d+\.?\d*)/);
          return match ? parseFloat(match[1]) : 0;
        };

        const getReviewCount = (): number => {
          const reviewText = getTextContent('#acrCustomerReviewText');
          const match = reviewText.match(/(\d+)/);
          return match ? parseInt(match[1]) : 0;
        };

        const getASIN = (): string => {
          const asinElement = document.querySelector('[data-asin]');
          return asinElement?.getAttribute('data-asin') || '';
        };

        return {
          title: getTextContent('#productTitle'),
          price: getPrice(),
          originalPrice: getOriginalPrice(),
          currency: 'INR',
          imageUrl: document.querySelector('#landingImage')?.getAttribute('src') || '',
          availability: !getTextContent('#availability').includes('Currently unavailable'),
          rating: getRating(),
          reviewCount: getReviewCount(),
          asin: getASIN(),
        };
      });

      return {
        ...productData,
        productUrl,
        vendor: 'AMAZON',
      };
    } catch (error) {
      this.logger.error(`Error scraping Amazon product: ${error.message}`);
      return null;
    } finally {
      await context.close();
    }
  }

  private async extractProducts(page: Page, limit: number): Promise<ProductData[]> {
    return page.evaluate((limit) => {
      const products: any[] = [];
      const items = document.querySelectorAll('[data-component-type="s-search-result"]');
      console.log("items", items.length)

      for (let i = 0; i < Math.min(items.length, limit); i++) {
        const item = items[i];
        const titleSelector = 'div[data-cy="title-recipe"] h2.a-text-normal';
        const linkSelector = 'div[data-cy="title-recipe"] > .a-link-normal';

        const titleElement = item?.querySelector(titleSelector)?.getAttribute("aria-label");
        const priceElement = item.querySelector('.a-price-whole');
        const originalPriceElement = item.querySelector('.a-price.a-text-price .a-offscreen')

        const priceSymbol = item.querySelector('.a-price-symbol')?.textContent?.trim();
        const imageElement = item.querySelector('img.s-image')?.getAttribute('src') || "";
        const linkElement = item.querySelector(linkSelector);
        const ratingElement = item.querySelector('.a-icon-star-small .a-icon-alt');
        const reviewCountElement = item.querySelector('.a-link-normal.s-underline-text.s-underline-link-text.s-link-style');
        const asinElement = item
        // console.log('title', titleElement)
        // console.log('price', priceElement, priceSymbol)
        // console.log('imageElement', imageElement)
        // console.log('link', linkElement)
        // console.log('rating', ratingElement)
        // console.log('asin', asinElement)

        if (titleElement != "" && linkElement) {
          const price = priceElement ?
            parseFloat(priceElement.textContent?.replace(/[^0-9.]/g, '') || '0') : 0;

          const originalPrice = originalPriceElement ?
            parseFloat(originalPriceElement.textContent?.replace(/[^0-9.]/g, '') || '0') : 0;

          const rating = ratingElement ?
            parseFloat(ratingElement.textContent?.match(/(\d+\.?\d*)/)?.[1] || '0') : 0;
          

          const reviewCount = reviewCountElement ?
            parseFloat(reviewCountElement.textContent?.match(/(\d+\.?\d*)/)?.[1] || '0') : 0;

          products.push({
            title: titleElement || '',
            price,
            originalPrice,
            currency: priceSymbol === '₹' ? 'INR' : 'NA',
            imageUrl: imageElement,
            productUrl: 'https://www.amazon.in' + linkElement.getAttribute('href'),
            vendor: 'AMAZON',
            availability: true,
            rating,
            reviewCount,
            asin: asinElement?.getAttribute('data-asin') || '',
          });
        }
      }

      return products;
    }, limit);
  }
}