import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BlobSASPermissions,
  BlobServiceClient,
  BlockBlobUploadOptions,
  ContainerClient,
  SASProtocol,
} from '@azure/storage-blob';
import { v7 as uuid } from 'uuid';

@Injectable()
export class AzureService {
  private containerClient: ContainerClient;
  constructor(private readonly configService: ConfigService) {
    const containerName =
      configService.get<string>('AZURE_STORAGE_CONTAINER_NAME') ?? '';

    const connectionString = this.configService.get<string>(
      'AZURE_STORAGE_CONNECTION_STRING',
    );

    if (!connectionString) {
      throw new Error(
        'Azure Storage credentials are not configured in .env file.',
      );
    }

    // Instantiate a new BlobServiceClient
    const blobServiceClient =
      BlobServiceClient.fromConnectionString(connectionString);

    this.containerClient = blobServiceClient.getContainerClient(containerName);
  }

  // onModuleInit() {
  //   // console.log('hi');
  // }

  // Private helper method to get a client for a specific blob
  // private getBlobClient(imageName: string): BlockBlobClient {
  //   const containerClient = this.blobServiceClient.getContainerClient(
  //     this.containerName,
  //   );
  //   return containerClient.getBlockBlobClient(imageName);
  // }

  public async uploadFile(file: Express.Multer.File) {
    // this.containerName = containerName;
    const extension = file.originalname.split('.').pop();
    const file_name = uuid() + '.' + extension;
    const blockBlobClient = this.containerClient.getBlockBlobClient(file_name);
    const fileUrl = blockBlobClient.url;
    await blockBlobClient.uploadData(file.buffer);

    return fileUrl;
  }
  // ✅ Signature 1: For calls without contentType
  public async uploadBuffer(buffer: Buffer, blobName: string): Promise<string>;

  // ✅ Signature 2: For calls with contentType
  public async uploadBuffer(
    buffer: Buffer,
    blobName: string,
    contentType: string,
  ): Promise<string>;

  public async uploadBuffer(
    buffer: Buffer,
    blobName: string,
    contentType?: string,
  ): Promise<string> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);

    // Check if the optional contentType was provided
    if (contentType) {
      // Logic for the version WITH contentType
      const options: BlockBlobUploadOptions = {
        blobHTTPHeaders: {
          blobContentType: contentType,
        },
      };
      await blockBlobClient.upload(buffer, buffer.length, options);
    } else {
      // Logic for the version WITHOUT contentType
      await blockBlobClient.uploadData(buffer);
    }

    return blockBlobClient.url;
  }
  // Method to download a file
  public async downloadFile(fileName: string) {
    try {
      const blockBlobClient = this.containerClient.getBlockBlobClient(fileName);
      const downloadBlockBlobResponse = await blockBlobClient.download(0);

      // Return the readable stream
      return downloadBlockBlobResponse.readableStreamBody;
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (error?.statusCode === 404) {
        throw new NotFoundException('File not found');
      }
      throw new InternalServerErrorException(
        'Error downloading file from Azure Storage',
      );
    }
  }

  async downloadToFile(blobUrl: string, localPath: string): Promise<void> {
    // const blobName = blobUrl.split('/').pop();
    const url = new URL(blobUrl);
    const pathParts = url.pathname.split('/');
    const blobName = pathParts.slice(2).join('/');
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.downloadToFile(localPath);
  }

  async deleteFile(file_name: string) {
    try {
      const blockBlobClient =
        this.containerClient.getBlockBlobClient(file_name);
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
      const blockBlobClient = this.containerClient.getBlockBlobClient(fileName);

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
