import {
  Controller,
  Delete,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AzureService } from './azure.service';
import { Response } from 'express';

@Controller('azure')
export class AzureController {
  constructor(private readonly azureService: AzureService) {}

  @Post('upload/file')
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @UploadedFile(
      new ParseFilePipe({
        // validators: [new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 })], // 10MB limit
        validators: [new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 })], // 10MB limit
      }),
    )
    file: Express.Multer.File,
  ) {
    const upload = await this.azureService.uploadFile(file);
    return { upload, message: 'uploaded successfully' };
  }

  @Get('download/:filename')
  async downloadFile(
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    const fileStream = await this.azureService.downloadFile(filename);
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    // @ts-expect-error fix the type error later
    fileStream.pipe(res);
  }

  @Delete('delete/:filename')
  async deleteFile(@Param('filename') filename: string) {
    await this.azureService.deleteFile(filename);
    return { message: `File ${filename} deleted successfully.` };
  }

  @Get('signed-url/:filename')
  async getSignedUrl(@Param('filename') filename: string) {
    // Optionally, you could accept a query param for the expiry time
    return this.azureService.getSignedDownloadUrl(filename);
  }
}
