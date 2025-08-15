import { Module } from '@nestjs/common';
import { AzureController } from './azure.controller';
import { AzureService } from './azure.service';

@Module({
  controllers: [AzureController],
  providers: [AzureService],
})
export class AzureModule {}
