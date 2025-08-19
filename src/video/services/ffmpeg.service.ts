import { Injectable, Logger } from '@nestjs/common';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import { ScriptSegment } from './llm.service';
import fs from 'fs';
type ImageType = { path: string; duration: number; index: number };

@Injectable()
export class FFmpegService {
  private readonly logger = new Logger(FFmpegService.name);
  // Helper function to get audio duration
  private getAudioDuration(audioPath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(audioPath, (err, metadata) => {
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        if (err) return reject(err);
        // @ts-expect-error type error
        resolve(metadata.format.duration);
      });
    });
  }
  async renderVideo(assets: any, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Create a text file for FFmpeg concat
      const concatFile = outputPath.replace('.mp4', '_concat.txt');
      const fileContent = assets.images
        .map((img) => {
          return `file '${img.path}'\nduration ${img.duration}`;
        })
        .join('\n');

      // Add last image again (FFmpeg concat requirement)
      const lastImage = assets.images[assets.images.length - 1];
      fs.writeFileSync(concatFile, fileContent + `\nfile '${lastImage.path}'`);

      // FFmpeg command with audio
      const ffmpegCommand = ffmpeg()
        .input(concatFile)
        .inputOptions(['-f concat', '-safe 0'])
        .input(assets.audio)
        .outputOptions([
          '-c:v libx264',
          '-pix_fmt yuv420p',
          '-c:a aac',
          '-shortest', // Stop when shortest input ends
          '-movflags +faststart', // Optimize for web streaming
        ])
        .output(outputPath);

      ffmpegCommand
        .on('start', (command) => {
          this.logger.log(`FFmpeg started: ${command}`);
        })
        // TODO: fix the progress.percent property - it is currently only showing 0%
        .on('progress', (progress) => {
          this.logger.log(`Processing: ${progress.percent}% done`);
        })
        .on('end', () => {
          fs.unlinkSync(concatFile); // Clean up concat file
          resolve();
        })
        .on('error', (err) => {
          fs.unlinkSync(concatFile); // Clean up concat file
          reject(err);
        })
        .run();
    });
  }

  async createVideo(
    // imagePaths: string[],
    imagePaths: ImageType[],
    audioPath: string,
    outputPath: string,
    // options?: {
    //   outputDir?: string;
    //   framerate?: number;
    //   preset?: string;
    // },
  ): Promise<string> {
    // const outputPath = path.join(
    //   process.cwd(),
    //   'uploads',
    //   `${jobId}_final.mp4`,
    // );

    // const {
    //   outputDir = path.join(process.cwd(), 'uploads'),
    //   framerate = 25,
    //   preset = 'fast',
    // } = options || {};

    // const outputPath = path.join(outputDir, `${jobId}_final.mp4`);
    const framerate = 25;
    return new Promise(async (resolve, reject) => {
      try {
        const command = ffmpeg();

        // If durations are provided, use them. Otherwise calculate equal distribution
        if (false && imagePaths.some((img) => img.duration)) {
          // Use provided durations
          imagePaths.forEach((image) => {
            command
              .input(image.path)
              .inputOptions([
                '-loop',
                '1',
                '-t',
                (image.duration || 1).toString(),
                '-r',
                framerate.toString(),
              ]);
          });
        } else {
          // Get the real audio duration first!
          const audioDuration = await this.getAudioDuration(audioPath);
          const durationPerImage = audioDuration / imagePaths.length;

          // Add each image as a separate input with loop and duration
          imagePaths.forEach((imagePath: ImageType) => {
            command.input(imagePath.path).inputOptions([
              '-loop',
              '1',
              '-t',
              durationPerImage.toString(),
              '-r',
              '25', // Set frame rate
            ]);
          });
        }

        // Add audio as the last input
        command.input(audioPath);

        // Build the filter chain
        const filterChain = this.buildFilterChain(imagePaths.length);

        command
          .complexFilter(filterChain)
          .outputOptions([
            '-map',
            '[outv]',
            '-map',
            `${imagePaths.length}:a`, // Audio is the last input
            '-c:v',
            'libx264',
            '-c:a',
            'aac',
            '-r',
            '25',
            '-pix_fmt',
            'yuv420p',
            '-shortest',
            '-preset',
            'fast',
            '-movflags',
            '+faststart', // Added for web optimization
          ])
          .on('start', (commandLine) => {
            this.logger.log(`FFmpeg started: ${commandLine}`);
          })
          .on('progress', (progress) => {
            this.logger.log(
              `Processing: ${Math.floor(progress.percent || 0)}% done`,
            );
          })
          .on('end', () => {
            this.logger.log(`Video created at ${outputPath}`);
            resolve(outputPath);
          })
          .on('error', (err, stdout, stderr) => {
            this.logger.error('FFmpeg error:', err.message);
            this.logger.error('FFmpeg stderr:', stderr);
            reject(new Error(`Video creation failed: ${err.message}`));
          })
          .save(outputPath);
      } catch (setupError) {
        reject(new Error(`Setup failed: ${setupError.message}`));
      }
    });
  }

  private buildFilterChain(imageCount: number): string[] {
    const outputWidth = 1080;
    const outputHeight = 1920;

    // This filter scales your 1024x1024 image to fit the 1080p width
    // and then adds black bars to the top and bottom to create a 9:16 video.
    const filter = `scale=${outputWidth}:-1,pad=${outputWidth}:${outputHeight}:(ow-iw)/2:(oh-ih)/2,setdar=9/16`;

    const filters: string[] = [];

    // Apply the filter to each input image
    for (let i = 0; i < imageCount; i++) {
      filters.push(`[${i}:v]${filter}[v${i}]`);
    }

    // Concatenate all the filtered videos
    const concatInputs = Array.from(
      { length: imageCount },
      (_, i) => `[v${i}]`,
    ).join('');
    filters.push(`${concatInputs}concat=n=${imageCount}:v=1:a=0[outv]`);

    return filters;
  }

  private createSubtitles(jobId: string, segments: ScriptSegment[]): string {
    const srtPath = path.join(
      process.cwd(),
      'uploads',
      `${jobId}_subtitles.srt`,
    );
    let srtContent = '';
    let currentTime = 0;

    segments.forEach((segment, index) => {
      const startTime = this.formatTime(currentTime);
      currentTime += segment.duration;
      const endTime = this.formatTime(currentTime);

      srtContent += `${index + 1}\n`;
      srtContent += `${startTime} --> ${endTime}\n`;
      srtContent += `${segment.text}\n\n`;
    });

    fs.writeFileSync(srtPath, srtContent);
    return srtPath;
  }

  private formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    const ms = Math.floor((secs % 1) * 1000);

    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${Math.floor(secs)
      .toString()
      .padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
  }
}
