import { Body, Controller, Post } from "@nestjs/common";
import { ScraperService } from "./scraper.service";
import { AmazonScraperService } from "./services/amazon-scraper.service";
import { FlipkartScraperService } from "./services/flipkart-scraper.service";
import { IsNotEmpty } from "class-validator";

@Controller('scraper')
export class ScraperController {
    constructor(private scraperService: ScraperService,
        private amazonScraper: AmazonScraperService,
        private flipkartScraper: FlipkartScraperService,
    ) { }

    // TODO: add validations
    @Post("amazon/search")
    async searchAmazonProducts(@Body() body: {
        query: string, limit?: number
    }) {
        // return "hello"
        return await this.amazonScraper.search(body.query, body.limit);
    }


    @Post("amazon/search/url")
    async searchAmazonProductsUrl(@Body() body: { url: string }) {
        // return "hello"
        return await this.amazonScraper.scrapeProduct(body.url);
    }

    @Post("flipkart/search")
    async searchFlipkartProducts(@Body() body: { query: string, limit?: number }) {
        // return "hello"
        return await this.flipkartScraper.search(body.query, body.limit);
    }


    @Post("flipkart/search/url")
    async searchFlipkartProductsUrl(@Body() body: { url: string }) {
        // return "hello"
        return await this.flipkartScraper.scrapeProduct(body.url);
    }
}