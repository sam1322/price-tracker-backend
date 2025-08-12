import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { TrackerService } from './tracker.service';
import { CreateTrackedItemDto, UpdateTrackedItemDto } from './dto/tracker.dto';
import { JwtAuthGuard } from 'src/auth/jwt-authguard';

@Controller('tracker')
export class TrackerController {
  constructor(private trackerService: TrackerService) { }

  @UseGuards(JwtAuthGuard)
  @Post('search')
  async searchProducts(@Body() body: { query: string; limit?: number }) {
    return this.trackerService.searchAndCompare(body.query, body.limit);
  }

  @UseGuards(JwtAuthGuard)
  @Post('track')
  async createTrackedItem(@Body() dto: CreateTrackedItemDto,
  ) {
    return this.trackerService.createTrackedItem(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('items')
  async getTrackedItems(@Query('active') active?: boolean) {
    return this.trackerService.getTrackedItems(active);
  }

  // @UseGuards(JwtAuthGuard)
  // @Get('items/:id')
  // async getTrackedItem(@Param('id') id: string) {
  //   return this.trackerService.getTrackedItemDetails(id);
  // }

  // ✅ The ONLY endpoint you need to get item details and history
  @UseGuards(JwtAuthGuard)
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

  @UseGuards(JwtAuthGuard)
  @Delete('items/:id')
  async deleteTrackedItem(@Param('id') id: string) {
    return this.trackerService.deleteTrackedItem(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('alerts')
  async getAlerts(@Query('unread') unread?: boolean) {
    return this.trackerService.getAlerts(unread);
  }

  @UseGuards(JwtAuthGuard)
  @Post('alerts/:id/read')
  async markAlertAsRead(@Param('id') id: string) {
    return this.trackerService.markAlertAsRead(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('stats')
  async getStats() {
    return this.trackerService.getStatistics();
  }
}