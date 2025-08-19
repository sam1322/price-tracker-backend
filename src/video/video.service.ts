// import { BadRequestException, Injectable } from '@nestjs/common';
// import { LLMService } from './services/llm.service';
// import { AudioGenerationService } from './services/audio.service';
// import { ImageService } from './services/image.service';
// import { FFmpegService } from './services/ffmpeg.service';
// import * as fs from 'fs';
// import * as path from 'path';
// import { v4 as uuidv4 } from 'uuid';
// import { PrismaService } from '../prisma/prisma.service';
// // import { AzureStorageService } from '../services/azure-storage.service';
// // import { KafkaService } from '../services/kafka.service';
//
// export interface VideoJob {
//   id: string;
//   status: 'processing' | 'completed' | 'error';
//   progress: number;
//   filePath?: string;
//   error?: string;
// }
//
// @Injectable()
// export class VideoService {
//   private jobs: Map<string, VideoJob> = new Map();
//
//   constructor(
//     private llmService: LLMService,
//     private audioService: AudioGenerationService,
//     private imageService: ImageService,
//     private ffmpegService: FFmpegService,
//     // private prismaService: PrismaService,
//     // private azureStorage: AzureStorageService,
//     // private kafkaService: KafkaService,
//   ) {
//     // Ensure uploads directory exists
//     const uploadsDir = path.join(process.cwd(), 'uploads');
//     if (!fs.existsSync(uploadsDir)) {
//       fs.mkdirSync(uploadsDir, { recursive: true });
//     }
//   }
//
//   generateVideo(query: string): { jobId: string } {
//     const jobId = uuidv4();
//
//     this.jobs.set(jobId, {
//       id: jobId,
//       status: 'processing',
//       progress: 0,
//     });
//
//     // Process video generation asynchronously
//     this.processVideoGeneration(jobId, query).catch((error) => {
//       this.jobs.set(jobId, {
//         id: jobId,
//         status: 'error',
//         progress: 0,
//         error: error.message,
//       });
//     });
//
//     return { jobId };
//   }
//
//   public async generateScript(
//     query: string,
//   ): Promise<{ narration: string; visual_prompt: string[] }> {
//     try {
//       // Step 1: Generate script (20% progress)
//       const script = await this.llmService.generateScriptByGoogle(query);
//       // this.updateProgress(jobId, 20);
//
//       return this.parseScript(script);
//       // this.updateProgress(jobId, 20);
//     } catch (err) {
//       throw new BadRequestException(err.message);
//     }
//   }
//
//   private async processVideoGeneration(jobId: string, query: string) {
//     try {
//       const { narration, visual_prompt } = await this.generateScript(query);
//
//       // Step 2: Generate images IN PARALLEL
//       const imageGenerationPromises = visual_prompt.map((scene, index) =>
//         this.imageService.generateImageByGoogle(scene, jobId, index),
//       );
//       const imagePaths = await Promise.all(imageGenerationPromises);
//       this.updateProgress(jobId, 50); // Update progress after all images are done
//
//       // Step 3: Generate voiceover using the clean narration text
//       const audioPath = await this.audioService.generateAudioByGoogle(
//         narration,
//         jobId,
//       );
//       this.updateProgress(jobId, 70);
//
//       // Step 4: Combine into video (100% progress)
//       const videoPath = await this.ffmpegService.createVideo(
//         imagePaths,
//         audioPath,
//         jobId,
//       );
//       this.updateProgress(jobId, 100);
//
//       this.jobs.set(jobId, {
//         id: jobId,
//         status: 'completed',
//         progress: 100,
//         filePath: videoPath,
//       });
//     } catch (error) {
//       throw error;
//     }
//   }
//
//   async collectImagesByJobId(jobId: string): Promise<{
//     imagePaths: string[];
//     audioPath: string;
//   }> {
//     const uploadsDirectory = path.join(process.cwd(), 'uploads');
//
//     try {
//       // 1. Read all files from the directory
//       const allFiles = fs.readdirSync(uploadsDirectory);
//
//       // 2. Filter files to find those that include the jobId
//       const matchingFiles = allFiles.filter((file) => file.includes(jobId));
//       const filePaths = matchingFiles.map((file) =>
//         path.join(uploadsDirectory, file),
//       );
//       let audioPath = '';
//       const imagePaths = filePaths.filter((file) => {
//         if (file.split('.')[1] == 'wav') {
//           audioPath = file;
//           return false;
//         }
//         return true;
//       });
//
//       // 3. Create the full path for each matching file
//
//       // return filePaths;
//       return { imagePaths, audioPath };
//     } catch (error) {
//       console.error(`Error reading directory ${uploadsDirectory}:`, error);
//       return { imagePaths: [], audioPath: '' }; // Return an empty array on error
//     }
//   }
//
//   async generateCombinedVideo(jobId: string) {
//     // return await this.collectImagesByJobId(jobId)
//     const { imagePaths, audioPath } = await this.collectImagesByJobId(jobId);
//     const videoPath = await this.ffmpegService.createVideo(
//       imagePaths,
//       audioPath,
//       jobId,
//     );
//     return videoPath;
//   }
//
//   // A much better way to handle the script
//   private parseScript(scriptJson: string): {
//     narration: string;
//     visual_prompt: string[];
//   } {
//     try {
//       // The AI's output is now a JSON string
//       const parsedData = JSON.parse(scriptJson);
//
//       // Basic validation to ensure the structure is correct
//       if (!parsedData.narration || !Array.isArray(parsedData.visual_prompt)) {
//         throw new BadRequestException('Invalid script format from AI.');
//       }
//
//       return parsedData;
//     } catch (error) {
//       throw new BadRequestException('Failed to parse AI script JSON:', error);
//       // // Fallback if the AI messes up the JSON
//       // return {
//       //   narration: "Welcome to our video about making the perfect cup of coffee.",
//       //   visual_prompt: ["A cinematic shot of a coffee cup on a table."]
//       // };
//     }
//   }
//
//   private updateProgress(jobId: string, progress: number) {
//     const job = this.jobs.get(jobId);
//     if (job) {
//       job.progress = progress;
//       this.jobs.set(jobId, job);
//     }
//   }
//
//   getStatus(jobId: string): VideoJob | null {
//     return this.jobs.get(jobId) || null;
//   }
//
//   getVideoPath(jobId: string): string {
//     const job = this.jobs.get(jobId);
//     if (!job || !job.filePath) {
//       throw new Error('Video not found');
//     }
//     return job.filePath;
//   }
// }
// video.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventType, JobStatus, VideoJob } from '@prisma/client';

// video.service.ts
@Injectable()
export class VideoService {
  constructor(private readonly prisma: PrismaService) {}

  async createVideoJob(
    userId: string,
    prompt: string,
  ): Promise<{ jobId: string }> {
    let createdJob: VideoJob;
    const result = await this.prisma.$transaction(async (tx) => {
      // Verify user exists (optional but good practice)
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      createdJob = await tx.videoJob.create({
        data: {
          userId, // 👈 Include userId
          prompt,
          status: JobStatus.PENDING,
        },
      });

      await tx.outboxEvent.create({
        data: {
          jobId: createdJob.id,
          eventType: EventType.VIDEO_JOB_CREATED, // ✅ Type-safe!
          payload: {
            jobId: createdJob.id,
            userId,
            prompt,
          },
        },
      });
      return { jobId: createdJob.id }; // Return from here
    });
    return result;
    // return { jobId: createdJob.id };
  }

  // Get job with user authorization check
  async getJobStatus(jobId: string, userId: string): Promise<VideoJob> {
    const job = await this.prisma.videoJob.findFirst({
      where: {
        id: jobId,
        userId, // 👈 Ensure user can only access their own jobs
      },
      include: {
        assets: true,
        // user: {
        //   select: { id: true, name: true, email: true }, // Include user info if needed
        // },
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    return job;
  }

  // Get all jobs for a user
  async getUserJobs(
    userId: string,
    options?: {
      status?: JobStatus;
      limit?: number;
      offset?: number;
    },
  ): Promise<VideoJob[]> {
    return this.prisma.videoJob.findMany({
      where: {
        userId,
        ...(options?.status && { status: options.status }),
      },
      include: { assets: true },
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    });
  }

  // Get all jobs for a user
  async getProcessingJobs(
    userId: string,
    options?: {
      status?: JobStatus;
      limit?: number;
      offset?: number;
    },
  ): Promise<VideoJob[]> {
    return this.prisma.videoJob.findMany({
      where: {
        userId,
        status: {
          notIn: ['COMPLETED', 'FAILED'], // Exclude these statuses
        },
      },
      include: { assets: true },
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    });
  }
}
