import { Controller, Get, Post, Delete, Body, Param, Query } from '@nestjs/common';
import { TrackerService } from './tracker.service';
import { CreateTrackedItemDto, UpdateTrackedItemDto } from './dto/tracker.dto';

@Controller('tracker')
export class TrackerController {
  constructor(private trackerService: TrackerService) {}

  @Post('search')
  async searchProducts(@Body() body: { query: string; limit?: number }) {
    return this.trackerService.searchAndCompare(body.query, body.limit);
  }

  @Post('track')
  async createTrackedItem(@Body() dto: CreateTrackedItemDto , 
  
) {
    return this.trackerService.createTrackedItem(dto);
  }

  @Get('items')
  async getTrackedItems(@Query('active') active?: boolean) {
    return this.trackerService.getTrackedItems(active);
  }

  // @Get('items/:id')
  // async getTrackedItem(@Param('id') id: string) {
  //   return this.trackerService.getTrackedItemDetails(id);
  // }

  // ✅ The ONLY endpoint you need to get item details and history
  @Get('items/:id')
  async getTrackedItemWithHistory(
    @Param('id') id: string,
    @Query('days') days?: string, // Receive as string to parse
  ) {
    // Parse 'days' to a number, with a default value
    const daysNumber = days ? parseInt(days, 10) : 30;
    return this.trackerService.getTrackedItemWithHistory(id, daysNumber);
  }
  // @Get('items/:id/history')
  // async getPriceHistory(
  //   @Param('id') id: string,
  //   @Query('days') days: number = 30,
  // ) {
  //   return this.trackerService.getPriceHistory(id, days);
  // }

  @Delete('items/:id')
  async deleteTrackedItem(@Param('id') id: string) {
    return this.trackerService.deleteTrackedItem(id);
  }

  @Get('alerts')
  async getAlerts(@Query('unread') unread?: boolean) {
    return this.trackerService.getAlerts(unread);
  }

  @Post('alerts/:id/read')
  async markAlertAsRead(@Param('id') id: string) {
    return this.trackerService.markAlertAsRead(id);
  }

  @Get('stats')
  async getStats() {
    return this.trackerService.getStatistics();
  }
}