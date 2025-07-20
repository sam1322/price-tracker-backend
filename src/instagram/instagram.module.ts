import { Module } from '@nestjs/common';
import { InstagramService } from './instagram.service';
import { InstagramController } from './instagram.controller';

@Module({
  providers: [InstagramService],
  controllers: [InstagramController]
})
export class InstagramModule {}
