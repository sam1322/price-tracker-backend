import { BadRequestException, Injectable } from '@nestjs/common';
import { GoogleGenAI, Modality } from '@google/genai';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class ImageGenerationService {
  private ai: GoogleGenAI;

  constructor() {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    this.ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  }

  async generateImageByGoogle(
    prompt: string,
    jobId: string,
    index: number,
  ): Promise<string> {
    try {
      let imagePath = '';

      // Set responseModalities to include "Image" so the model can generate  an image
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.0-flash-preview-image-generation',
        contents: prompt,
        config: {
          responseModalities: [Modality.TEXT, Modality.IMAGE],
        },
      });
      console.log('response', response);
      // @ts-expect-error type error
      for (const part of response.candidates[0].content.parts) {
        // Based on the part type, either show the text or save the image
        if (part.text) {
          console.log(part.text);
        }
        if (part.inlineData) {
          const imageData = part.inlineData.data;
          // @ts-expect-error string blob type error
          const buffer = Buffer.from(imageData, 'base64');
          imagePath = path.join(
            process.cwd(),
            'uploads',
            `gemini_${jobId}_image_${index}_${Date.now()}.png`,
          );

          fs.writeFileSync(imagePath, buffer);
          console.log('Image saved as ' + imagePath);
        }
      }
      console.log(`Generating image for prompt: "${prompt}"`);

      return imagePath;
    } catch (error) {
      throw new BadRequestException(
        'Hugging Face image generation error:',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        error,
      );
    }
  }
}
