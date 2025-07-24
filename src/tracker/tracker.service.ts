import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ScraperService } from '../scraper/scraper.service';
import { CreateTrackedItemDto } from './dto/tracker.dto';
// import { Prisma } from '@prisma/client';
import { Prisma } from 'generated/prisma';
import { PriceComparison, ScraperResult } from 'src/scraper/interfaces/scraper.interface';

@Injectable()
export class TrackerService {
  constructor(
    private prisma: PrismaService,
    private scraperService: ScraperService,
  ) { }

  async searchAndCompare(query: string, limit: number = 100) {
    return this.scraperService.searchAndCompare(query, limit);
  }

  async createTrackedItem(dto: CreateTrackedItemDto) {
    // First, search for products
    // const searchResults = await this.scraperService.searchAndCompare(dto.searchQuery, 5);

    // Create tracked item
    const trackedItem = await this.prisma.trackedItem.create({
      data: {
        name: dto.name,
        searchQuery: dto.searchQuery,
        targetPrice: dto.targetPrice,
      },
    });

    // 2. ✅ Directly use the product data from the DTO
    for (const productData of dto.productsToTrack) {

      const { price, originalPrice, availability, rating, reviewCount, currency, ...restOfProductData } = productData
      await this.prisma.product.upsert({
        where: { productUrl: productData.productUrl },
        // Create the product if it doesn't exist
        create: {
          ...restOfProductData,
          trackedItems: {
            connect: { id: trackedItem.id },
          },
          priceHistory: {
            create: {
              price: price,
              originalPrice: originalPrice,
              availability: availability,
              rating: rating,
              reviewCount: reviewCount,
              currency: currency,
            },
          },
        },
        // If product already exists, just link it to the new tracked item
        update: {
          trackedItems: {
            connect: { id: trackedItem.id },
          },
        },
      });
    }

    // 3. Return the newly created item with its details
    return this.getTrackedItemDetails(trackedItem.id);
  }

  async getTrackedItems(activeOnly?: boolean) {
    const where: Prisma.TrackedItemWhereInput = {};
    if (activeOnly !== undefined) {
      where.isActive = activeOnly;
    }

    const items = await this.prisma.trackedItem.findMany({
      where,
      include: {
        products: {
          include: {
            priceHistory: {
              orderBy: { scrapedAt: 'desc' },
              take: 1,
            },
          },
        },
        alerts: {
          where: { isRead: false },
        },
        _count: {
          select: { products: true, alerts: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return items.map(item => ({
      ...item,
      currentLowestPrice: this.getLowestPrice(item.products),
      unreadAlerts: item.alerts.length,
    }));
  }

  // In tracker.service.ts

  async getTrackedItemWithHistory(trackedItemId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // 1. --- A single, powerful database query ---
    // Fetch the item, its products, recent alerts, AND the relevant price history in one go.
    const trackedItem = await this.prisma.trackedItem.findUnique({
      where: { id: trackedItemId },
      include: {
        alerts: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        products: {
          include: {
            priceHistory: {
              where: {
                scrapedAt: { gte: startDate },
              },
              orderBy: { scrapedAt: 'asc' }, // Get history in ascending order for charts
            },
          },
        },
      },
    });

    if (!trackedItem) {
      throw new NotFoundException('Tracked item not found');
    }

    // 2. --- Process all data in one place ---

    // ✅ Get current prices and calculate trends from the fetched history
    const currentPrices = this.getCurrentPricesFromPriceHistory(trackedItem.products);
    const priceTrends = this.calculatePriceTrends(trackedItem.products); // Assumes this logic exists

    // ✅ Format data for charts
    const chartData = this.formatChartData(trackedItem.products); // Assumes this logic exists

    // 3. --- Return a complete, unified payload ---
    return {
      ...trackedItem,
      // products: undefined, // Remove the original products array to avoid duplication
      products: trackedItem.products.map(p => ({
        id: p.id,
        title: p.title,
        vendor: p.vendor,
        imageUrl: p.imageUrl,
        productUrl: p.productUrl
      })),
      currentPrices,
      priceTrends,
      chartData,
    };
  }

  /**
   * Helper to get the most recent price for each product.
   * Assumes product.priceHistory is sorted ascendingly.
   */
  private getCurrentPricesFromPriceHistory(products: any[]) {
    return products.map(p => {
      const lastHistory = p.priceHistory[p.priceHistory.length - 1];
      return {
        productId: p.id,
        title: p.title,
        vendor: p.vendor,
        imageUrl: p.imageUrl,
        productUrl: p.productUrl,
        currentPrice: lastHistory?.price,
        lastUpdated: lastHistory?.scrapedAt,
      };
    });
  }

  private getCurrentPrices(products: any[]) {
    return products.map(product => ({
      productId: product.id,
      title: product.title,
      vendor: product.vendor,
      currentPrice: product.priceHistory[0]?.price || null,
      availability: product.priceHistory[0]?.availability || false,
      lastUpdated: product.priceHistory[0]?.scrapedAt || null,
    }));
  }

  // You would keep your calculatePriceTrends and formatChartData methods as they are.

  async getTrackedItemDetails(id: string) {
    const item = await this.prisma.trackedItem.findUnique({
      where: { id },
      include: {
        products: {
          include: {
            priceHistory: {
              orderBy: { scrapedAt: 'desc' },
              take: 10,
            },
          },
        },
        alerts: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Tracked item not found');
    }

    // Calculate price trends
    const priceTrends = await this.calculatePriceTrends(item.products);

    return {
      ...item,
      priceTrends,
      currentPrices: this.getCurrentPrices(item.products),
    };
  }



  async deleteTrackedItem(id: string) {
    const item = await this.prisma.trackedItem.findUnique({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException('Tracked item not found');
    }

    await this.prisma.trackedItem.delete({
      where: { id },
    });

    return { success: true, message: 'Tracked item deleted successfully' };
  }

  async getAlerts(unreadOnly?: boolean) {
    const where: Prisma.PriceAlertWhereInput = {};
    if (unreadOnly) {
      where.isRead = false;
    }

    return this.prisma.priceAlert.findMany({
      where,
      include: {
        trackedItem: {
          include: {
            products: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markAlertAsRead(id: string) {
    return this.prisma.priceAlert.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async getStatistics() {
    const [
      totalTrackedItems,
      activeTrackedItems,
      totalProducts,
      totalPriceChecks,
      totalAlerts,
      recentScrapes,
    ] = await Promise.all([
      this.prisma.trackedItem.count(),
      this.prisma.trackedItem.count({ where: { isActive: true } }),
      this.prisma.product.count(),
      this.prisma.priceHistory.count(),
      this.prisma.priceAlert.count(),
      this.prisma.scrapeLog.findMany({
        orderBy: { createdAt: 'desc' },
        // take: 10,  
      }),
    ]);

    // Calculate average price drop
    const priceDrops = await this.prisma.priceAlert.findMany({
      select: { priceChange: true },
      where: { priceChange: { lt: 0 } },
    });

    const avgPriceDrop = priceDrops.length > 0
      ? priceDrops.reduce((sum, alert) => sum + Math.abs(alert.priceChange.toNumber()), 0) / priceDrops.length
      : 0;

    return {
      overview: {
        totalTrackedItems,
        activeTrackedItems,
        totalProducts,
        totalPriceChecks,
        totalAlerts,
        avgPriceDrop,
      },
      recentScrapes,
      vendorStats: await this.getVendorStats(),
    };
  }

  private async getVendorStats() {
    const amazonProducts = await this.prisma.product.count({ where: { vendor: 'AMAZON' } });
    const flipkartProducts = await this.prisma.product.count({ where: { vendor: 'FLIPKART' } });

    return {
      amazon: {
        productCount: amazonProducts,
        successRate: await this.calculateSuccessRate('AMAZON'),
      },
      flipkart: {
        productCount: flipkartProducts,
        successRate: await this.calculateSuccessRate('FLIPKART'),
      },
    };
  }

  private async calculateSuccessRate(vendor: 'AMAZON' | 'FLIPKART') {
    const logs = await this.prisma.scrapeLog.findMany({
      where: { vendor },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    if (logs.length === 0) return 0;

    const successCount = logs.filter(log => log.status === 'SUCCESS').length;
    return (successCount / logs.length) * 100;
  }

  private getLowestPrice(products: any[]) {
    let lowestPrice = Infinity;

    products.forEach(product => {
      if (product.priceHistory.length > 0) {
        const currentPrice = product.priceHistory[0].price.toNumber();
        if (currentPrice < lowestPrice) {
          lowestPrice = currentPrice;
        }
      }
    });

    return lowestPrice === Infinity ? null : lowestPrice;
  }

  private calculatePriceTrends(products: any[]) {
    return products.map(product => {
      const history = product.priceHistory;
      if (history.length < 2) {
        return {
          productId: product.id,
          direction: 'stable',
          changePercent: 0,
        };
      }

      const currentPrice = history[0].price.toNumber();
      const previousPrice = history[1].price.toNumber();
      const changePercent = ((currentPrice - previousPrice) / previousPrice) * 100;

      return {
        productId: product.id,
        direction: changePercent > 0 ? 'up' : changePercent < 0 ? 'down' : 'stable',
        changePercent: Math.abs(changePercent),
      };
    });
  }

  // private calculatePriceChange(priceHistory: any[]) {
  //   if (priceHistory.length < 2) return 0;

  //   const current = priceHistory[0].price.toNumber();
  //   const previous = priceHistory[1].price.toNumber();

  //   return ((current - previous) / previous) * 100;
  // }

  // private formatChartData(products: any[]) {
  //   const dataPoints: any[] = [];

  //   products.forEach(product => {
  //     product.priceHistory.forEach(history => {
  //       dataPoints.push({
  //         timestamp: history.scrapedAt,
  //         vendor: product.vendor,
  //         productId: product.id,
  //         productTitle: product.title,
  //         price: history.price.toNumber(),
  //         originalPrice: history.originalPrice?.toNumber(),
  //         discount: history.discount,
  //       });
  //     });
  //   });

  //   // Group by timestamp for line chart
  //   const groupedData = dataPoints.reduce((acc, point) => {
  //     const key = point.timestamp.toISOString();
  //     if (!acc[key]) {
  //       acc[key] = {
  //         timestamp: point.timestamp,
  //         amazon: [],
  //         flipkart: [],
  //       };
  //     }

  //     const vendor = point.vendor.toLowerCase();
  //     acc[key][vendor].push({
  //       productId: point.productId,
  //       productTitle: point.productTitle,
  //       price: point.price,
  //       discount: point.discount,
  //     });

  //     return acc;
  //   }, {});

  //   return Object.values(groupedData);
  // }

  private formatChartData(products: any[]) {
    type DatasetType = {
      label: string;
      data: (number | null)[];
      productId: string;
      borderColor: string;
      tension: number;
      priceMap?: Map<string, number>;
    }
    const datasets: DatasetType[] = [];
    const allDates = new Set<string>();

    // Step 1: Prepare a dataset for each product and collect all unique dates.
    for (const product of products) {
      const priceMap = new Map<string, number>();

      for (const history of product.priceHistory) {
        // Group by day, not by exact timestamp
        const dateKey = history.scrapedAt.toISOString().split('T')[0];
        allDates.add(dateKey);
        // Use a Map to only store the last price for a given day
        priceMap.set(dateKey, history.price.toNumber());
      }

      datasets.push({
        label: `${product.title} (${product.vendor})`,
        data: [], // Data will be populated in the next step
        productId: product.id,
        // You can add styling hints for the frontend here
        borderColor: product.vendor === 'AMAZON' ? 'rgb(255, 159, 64)' : 'rgb(54, 162, 235)',
        tension: 0.1,
        priceMap: priceMap, // Temporarily store the map
      });
    }

    // Step 2: Create a sorted list of labels for the X-axis.
    const sortedLabels = Array.from(allDates).sort();

    // Step 3: Populate each dataset with prices, using null for missing data points.
    for (const dataset of datasets) {
      const priceMap = dataset.priceMap;
      for (const label of sortedLabels) {
        // If the product has a price for that day, use it. Otherwise, use null.
        // Null values create the desired gaps in a line chart.
        dataset.data.push(priceMap?.get(label) ?? null);
      }
      delete dataset.priceMap; // Clean up the temporary map
    }

    return {
      labels: sortedLabels,
      datasets: datasets,
    };
  }
}