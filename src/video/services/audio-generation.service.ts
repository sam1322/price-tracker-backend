import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import { GoogleGenAI } from '@google/genai';
import * as wav from 'wav';

@Injectable()
export class AudioService {
  private ai: GoogleGenAI;
  constructor(private configService: ConfigService) {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    this.ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  }

  async saveWaveFile(
    filename: string,
    // pcmData: Buffer<ArrayBufferLike>,
    pcmData: Buffer,
    channels = 1,
    rate = 24000,
    sampleWidth = 2,
  ) {
    return new Promise((resolve, reject) => {
      const writer = new wav.FileWriter(filename, {
        channels,
        sampleRate: rate,
        bitDepth: sampleWidth * 8,
      });

      writer.on('finish', resolve);
      writer.on('error', reject);

      writer.write(pcmData);
      writer.end();
    });
  }

  async generateAudioByGoogle(text: string, jobId: string): Promise<string> {
    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-tts',
      contents: [
        {
          parts: [
            {
              text: `Narrate this with an engaging and excited tone, like a top YouTube creator unveiling a new product: ${text}`,
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Charon' },
          },
        },
      },
    });

    const data =
      response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    // @ts-expect-error type error
    const audioBuffer = Buffer.from(data, 'base64');
    console.log('response,', response);
    // const fileName = 'out.wav';
    const audioPath = path.join(
      process.cwd(),
      'uploads',
      `gemini_${jobId}_audio_${Date.now()}.wav`,
    );
    await this.saveWaveFile(audioPath, audioBuffer);
    return audioPath;
  }

}
