import { Module, Global } from '@nestjs/common';
import { BrowserService } from './browser.service';

/**
 * This module provides the core BrowserService globally.
 * By making it @Global(), any other module in the application can inject
 * BrowserService without needing to import this module directly.
 * This is perfect for a shared resource like a browser instance.
 */
@Global()
@Module({
  providers: [BrowserService],
  exports: [BrowserService], // Export the service so other modules can use it
})
export class BrowserModule {}