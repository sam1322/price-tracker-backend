import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BlobSASPermissions,
  BlobServiceClient,
  BlockBlobClient,
  SASProtocol,
} from '@azure/storage-blob';
import { v4 as uuid } from 'uuid';

@Injectable()
export class AzureService implements OnModuleInit {
  private readonly containerName: string;
  private readonly blobServiceClient: BlobServiceClient;

  constructor(private readonly configService: ConfigService) {
    this.containerName =
      configService.get<string>('AZURE_STORAGE_CONTAINER_NAME') ?? '';

    const connectionString = this.configService.get<string>(
      'AZURE_STORAGE_CONNECTION_STRING',
    );

    if (!connectionString || !this.containerName) {
      throw new Error(
        'Azure Storage credentials are not configured in .env file.',
      );
    }

    // Instantiate a new BlobServiceClient
    this.blobServiceClient =
      BlobServiceClient.fromConnectionString(connectionString);
  }

  onModuleInit() {
    console.log('hi');
  }

  // Private helper method to get a client for a specific blob
  private getBlobClient(imageName: string): BlockBlobClient {
    const containerClient = this.blobServiceClient.getContainerClient(
      this.containerName,
    );
    return containerClient.getBlockBlobClient(imageName);
  }

  public async uploadFile(file: Express.Multer.File) {
    // this.containerName = containerName;
    const extension = file.originalname.split('.').pop();
    const file_name = uuid() + '.' + extension;
    const blockBlobClient = this.getBlobClient(file_name);
    const fileUrl = blockBlobClient.url;
    await blockBlobClient.uploadData(file.buffer);

    return fileUrl;
  }
  // Method to download a file
  public async downloadFile(fileName: string) {
    try {
      const blockBlobClient = this.getBlobClient(fileName);
      const downloadBlockBlobResponse = await blockBlobClient.download(0);

      // Return the readable stream
      return downloadBlockBlobResponse.readableStreamBody;
    } catch (error) {
      if (error?.statusCode === 404) {
        throw new NotFoundException('File not found');
      }
      throw new InternalServerErrorException(
        'Error downloading file from Azure Storage',
      );
    }
  }

  async deleteFile(file_name: string) {
    try {
      const blockBlobClient = this.getBlobClient(file_name);
      await blockBlobClient.deleteIfExists();
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        'Error deleting file from Azure Blob Storage',
      );
    }
  }

  // 2. Add this new method to your service
  public async getSignedDownloadUrl(fileName: string, expiryInMinutes = 60) {
    try {
      const blockBlobClient = this.getBlobClient(fileName);

      // Check if the blob exists before generating a URL
      if (!(await blockBlobClient.exists())) {
        throw new BadRequestException('File not found');
      }

      const sasOptions = {
        // The container and blob names are implicit
        permissions: BlobSASPermissions.parse('r'), // "r" for read access
        startsOn: new Date(), // URL is valid from now
        expiresOn: new Date(new Date().valueOf() + expiryInMinutes * 60 * 1000), // e.g., 60 minutes from now
        protocol: SASProtocol.Https, // Enforce HTTPS
      };

      const sasUrl = await blockBlobClient.generateSasUrl(sasOptions);
      return { url: sasUrl };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Error generating signed URL');
    }
  }

  // private streamToBuffer(readableStream) {
  //   return new Promise((resolve, reject) => {
  //     const chunks = [];
  //     // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  //     readableStream.on('data', (data) => {
  //       return chunks.push(data instanceof Buffer ? data : Buffer.from(data));
  //     });
  //     // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  //     readableStream.on('end', () => {
  //       resolve(Buffer.concat(chunks));
  //     });
  //     // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  //     readableStream.on('error', reject);
  //   });
  // }
}
