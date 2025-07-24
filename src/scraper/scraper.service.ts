import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AmazonScraperService } from './services/amazon-scraper.service';
import { FlipkartScraperService } from './services/flipkart-scraper.service';
import { ProductData, ScraperResult, PriceComparison } from './interfaces/scraper.interface';
// import { Prisma, Vendor } from 'generated/prisma';
import { Prisma, Vendor } from '@prisma/client';

@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);

  constructor(
    private prisma: PrismaService,
    private amazonScraper: AmazonScraperService,
    private flipkartScraper: FlipkartScraperService,
  ) { }

  async searchAndCompare(query: string, limit: number = 10): Promise<{
    amazonResults: ScraperResult;
    flipkartResults: ScraperResult;
    comparisons: PriceComparison[];
  }> {
    const startTime = Date.now();

    // Scrape both platforms in parallel
    const [amazonResults, flipkartResults] = await Promise.all([
      this.amazonScraper.search(query, limit),
      this.flipkartScraper.search(query, limit),
    ]);

    // Log scraping results
    await Promise.all([
      this.logScrapeResult(Vendor.AMAZON, amazonResults, startTime),
      this.logScrapeResult(Vendor.FLIPKART, flipkartResults, startTime),
    ]);

    // Generate price comparisons
    const comparisons = this.generateComparisons(
      amazonResults.products,
      flipkartResults.products
    );

    return {
      amazonResults,
      flipkartResults,
      comparisons,
    };
  }

  async scrapeTrackedItems(): Promise<void> {
    const activeItems = await this.prisma.trackedItem.findMany({
      where: { isActive: true },
      include: { products: true },
    });

    this.logger.log(`Starting scheduled scrape for ${activeItems.length} tracked items`);

    for (const trackedItem of activeItems) {
      try {
        await this.scrapeAndUpdateTrackedItem(trackedItem);
      } catch (error) {
        this.logger.error(`Error scraping tracked item ${trackedItem.id}: ${error.message}`);
      }
    }
  }

  private async scrapeAndUpdateTrackedItem(trackedItem: any): Promise<void> {
    // Get unique product URLs to scrape
    const productUrls = trackedItem.products.map(p => ({
      url: p.productUrl,
      vendor: p.vendor,
      productId: p.id,
    }));

    for (const { url, vendor, productId } of productUrls) {
      try {
        const productData = vendor === Vendor.AMAZON
          ? await this.amazonScraper.scrapeProduct(url)
          : await this.flipkartScraper.scrapeProduct(url);

        if (productData) {
          // Save price history
          const priceHistory = await this.prisma.priceHistory.create({
            data: {
              productId,
              price: productData.price,
              originalPrice: productData.originalPrice,
              availability: productData.availability,
              rating: productData.rating,
              reviewCount: productData.reviewCount,
              discount: productData.originalPrice && productData.originalPrice > productData.price
                ? Math.round(((productData.originalPrice - productData.price) / productData.originalPrice) * 100)
                : null,
            },
          });

          // Check for price drops and create alerts
          await this.checkPriceAlerts(trackedItem, productId, productData.price);
        }
      } catch (error) {
        this.logger.error(`Error scraping product ${url}: ${error.message}`);
      }
    }
  }

  private async checkPriceAlerts(trackedItem: any, productId: string, newPrice: number): Promise<void> {
    // Get the last price
    const lastPriceHistory = await this.prisma.priceHistory.findFirst({
      where: { productId },
      orderBy: { scrapedAt: 'desc' },
      skip: 1, // Skip the current one we just created
    });

    if (lastPriceHistory) {
      const oldPrice = lastPriceHistory.price.toNumber();
      const priceChange = newPrice - oldPrice;
      const priceChangePercent = (priceChange / oldPrice) * 100;

      // Create alert if price dropped significantly (more than 5%) or below target price
      if (priceChangePercent <= -5 ||
        (trackedItem.targetPrice && newPrice <= trackedItem.targetPrice.toNumber())) {
        await this.prisma.priceAlert.create({
          data: {
            trackedItemId: trackedItem.id,
            message: `Price dropped by ${Math.abs(priceChangePercent).toFixed(2)}%!`,
            priceChange,
            oldPrice,
            newPrice,
          },
        });
      }
    }
  }

  private generateComparisons(
    amazonProducts: ProductData[],
    flipkartProducts: ProductData[]
  ): PriceComparison[] {
    const comparisons: PriceComparison[] = [];

    // Simple comparison based on title similarity
    amazonProducts.forEach(amazonProduct => {
      const similarFlipkartProduct = flipkartProducts.find(fp =>
        this.calculateSimilarity(amazonProduct.title, fp.title) > 0.6
      );

      if (similarFlipkartProduct) {
        const priceDifference = amazonProduct.price - similarFlipkartProduct.price;
        comparisons.push({
          productTitle: amazonProduct.title,
          amazonProduct,
          flipkartProduct: similarFlipkartProduct,
          priceDifference: Math.abs(priceDifference),
          cheaperVendor: priceDifference > 0 ? 'FLIPKART' : 'AMAZON',
        });
      }
    });

    return comparisons;
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const words1 = str1.toLowerCase().split(/\s+/);
    const words2 = str2.toLowerCase().split(/\s+/);
    const commonWords = words1.filter(word => words2.includes(word));
    return commonWords.length / Math.max(words1.length, words2.length);
  }

  private async logScrapeResult(
    vendor: Vendor,
    result: ScraperResult,
    startTime: number
  ): Promise<void> {
    await this.prisma.scrapeLog.create({
      data: {
        vendor,
        status: result.success ? 'SUCCESS' : 'FAILED',
        itemsScraped: result.products.length,
        errorMessage: result.error,
        duration: Date.now() - startTime,
      },
    });
  }
}