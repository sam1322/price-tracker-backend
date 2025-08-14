import { Module } from '@nestjs/common';
import { AzureController } from './azure.controller';
import { AzureStorageModule, AzureStorageOptions } from '@nestjs/azure-storage';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AzureService } from './azure.service';

@Module({
  imports: [
    // Use the async configuration to fetch connection string from .env
    AzureStorageModule.withConfigAsync({
      useFactory: (configService: ConfigService): AzureStorageOptions => ({
        // It's best practice to use environment variables for credentials
        accountName:
          configService.get<string>('AZURE_STORAGE_ACCOUNT_NAME') ?? '',
        sasKey: configService.get<string>('AZURE_STORAGE_SAS_KEY') ?? '',
        containerName:
          configService.get<string>('AZURE_STORAGE_CONTAINER_NAME') ?? '',
      }),
      inject: [ConfigService], // Inject ConfigService to use it in the factory
    }),
    ConfigModule.forRoot({
      isGlobal: true, // Make ConfigModule available globally
    }),
  ],
  controllers: [AzureController],
  providers: [AzureService],
})
export class AzureModule {}
