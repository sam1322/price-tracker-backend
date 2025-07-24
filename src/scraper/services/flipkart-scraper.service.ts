import { Injectable, Logger } from '@nestjs/common';
import { BrowserService } from '../../browser/browser.service';
import { Page } from 'playwright';
import { ProductData, ScraperResult } from '../interfaces/scraper.interface';

@Injectable()
export class FlipkartScraperService {
    private readonly logger = new Logger(FlipkartScraperService.name);
    private readonly baseUrl = 'https://www.flipkart.com';

    constructor(private browserService: BrowserService) { }

    async search(query: string, limit: number = 100): Promise<ScraperResult> {
        const browser = this.browserService.getBrowser();
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        });
        const page = await context.newPage();

        try {
            const searchUrl = `${this.baseUrl}/search?q=${encodeURIComponent(query)}`;
            await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });

            // Handle login popup if it appears
            try {
                await page.click('._2KpZ6l._2doB4z', { timeout: 3000 });
            } catch (e) {
                // Login popup might not appear
            }

            // Wait for products to load
            await page.waitForSelector('._75nlfW', { timeout: 10000 });

            const products = await this.extractProducts(page, limit);
            this.logger.log("flipkart products recieved", products.length)

            await page.screenshot({ path: `success-flipkart-${Date.now()}.png` });
            this.logger.debug(`Flikpart scraping success. A screenshot was saved.`);
            return {
                success: true,
                products,
                vendor: 'FLIPKART',
                searchQuery: query,
            };
        } catch (error) {
            this.logger.error(`Error searching Flipkart: ${error.message}`);
            // this.logger.error(`[Flipkart] Failed to scrape ${url}`, error.stack);
            await page.screenshot({ path: `error-flipkart-${Date.now()}.png` });
            // throw new Error(`Amazon scraping failed. A screenshot was saved.`);
            return {
                success: false,
                products: [],
                vendor: 'FLIPKART',
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

            // Handle login popup
            try {
                await page.click('._2KpZ6l._2doB4z', { timeout: 3000 });
            } catch (e) {
                // Login popup might not appear
            }

            const productData = await page.evaluate(() => {
                const getTextContent = (selector: string): string => {
                    const element = document.querySelector(selector);
                    return element?.textContent?.trim() || '';
                };

                const getPrice = (): number => {
                    const priceText = getTextContent('.Nx9bqj.CxhGGd');
                    if (priceText) {
                        const price = parseFloat(priceText.replace(/[^0-9]/g, ''));
                        return isNaN(price) ? 0 : price;
                    }
                    return 0;
                };

                const getOriginalPrice = (): number => {
                    const originalPriceText = getTextContent('.yRaY8j.A6\\+E6v');
                    console.log(originalPriceText, "originalPrice")
                    if (originalPriceText) {
                        const price = parseFloat(originalPriceText.replace(/[^0-9]/g, ''));
                        return isNaN(price) ? 0 : price;
                    }
                    return 0;
                };

                const getRating = (): number => {
                    const ratingText = getTextContent('.XQDdHH');
                    return ratingText ? parseFloat(ratingText) : 0;
                };

                const getProductId = (): string => {
                    const urlParams = new URLSearchParams(window.location.search);
                    return urlParams.get('pid') || '';
                };

                return {
                    title: getTextContent('.VU-ZEz'),
                    price: getPrice(),
                    originalPrice: getOriginalPrice(),
                    currency: 'INR',
                    imageUrl: document.querySelector('.DByuf4.IZexXJ.jLEJ7H')?.getAttribute('src') || '',
                    availability: !getTextContent('._16FRp0').includes('Sold Out'), // TODO : fix later
                    rating: getRating(),
                    flipkartId: getProductId(),
                };
            });

            return {
                ...productData,
                productUrl,
                vendor: 'FLIPKART',
            };
        } catch (error) {
            this.logger.error(`Error scraping Flipkart product: ${error.message}`);
            return null;
        } finally {
            await context.close();
        }
    }

    private async extractProducts(page: Page, limit: number): Promise<ProductData[]> {
        return page.evaluate((limit) => {
            const products: any[] = [];
            const items = document.querySelectorAll('._75nlfW');
            console.log("flipkart products  length", items.length)

            for (let i = 0; i < Math.min(items.length, limit); i++) {
                const item = items[i];

                const titleElement = item.querySelector('.wjcEIp') ?? item.querySelector('.KzDlHZ');
                const priceElement = item.querySelector('.Nx9bqj');
                const originalPriceElement = item.querySelector('.yRaY8j');
                const imageElement = item.querySelector('.DByuf4');
                const linkElement = item.querySelector('.wjcEIp') ?? item.querySelector('.CGtC98');
                const ratingElement = item.querySelector('.XQDdHH');
                const reviewCountElement = item.querySelector('.Wphh3N > span > span:first-child');


                // const reviewCount = item.querySelector('') 

                if (titleElement && linkElement) {
                    const price = priceElement ?
                        parseFloat(priceElement.textContent?.replace(/[^0-9]/g, '') || '0') : 0;

                    const originalPrice = originalPriceElement ?
                        parseFloat(originalPriceElement.textContent?.replace(/[^0-9]/g, '') || '0') : 0;

                    const rating = ratingElement ?
                        parseFloat(ratingElement.textContent || '0') : 0;


                    const reviewCount = reviewCountElement ?
                        parseFloat(reviewCountElement.textContent?.trim().replace(/,/g, '').match(/\d+/)?.[0] || '0') : 0;

                    // console.log('reviewCount',reviewCount,reviewCountElement?.textContent)

                    const href = linkElement.getAttribute('href');
                    const productUrl = href?.startsWith('http') ? href : 'https://www.flipkart.com' + href;

                    // Extract product ID from URL
                    const urlMatch = href?.match(/pid=([^&]+)/);
                    const flipkartId = urlMatch ? urlMatch[1] : '';

                    const titleName = titleElement?.getAttribute('title') ?? titleElement?.textContent ?? ""

                    products.push({
                        title: titleName.trim(),
                        price,
                        originalPrice,
                        currency: 'INR',
                        imageUrl: imageElement?.getAttribute('src') || '',
                        productUrl,
                        vendor: 'FLIPKART',
                        availability: true, // TODO: doubtfull
                        rating,
                        reviewCount,
                        flipkartId,
                    });
                }
            }

            return products;
        }, limit);
    }
}