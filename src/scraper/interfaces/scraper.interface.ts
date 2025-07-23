export interface ProductData {
  title: string;
  price: number;
  originalPrice?: number;
  currency: string;
  imageUrl: string;
  productUrl: string;
  vendor: 'AMAZON' | 'FLIPKART';
  availability: boolean;
  rating?: number;
  reviewCount?: number;
  asin?: string;
  flipkartId?: string;
}

export interface ScraperResult {
  success: boolean;
  products: ProductData[];
  vendor: 'AMAZON' | 'FLIPKART';
  searchQuery: string;
  error?: string;
}

export interface PriceComparison {
  productTitle: string;
  amazonProduct?: ProductData;
  flipkartProduct?: ProductData;
  priceDifference?: number;
  cheaperVendor?: 'AMAZON' | 'FLIPKART';
}