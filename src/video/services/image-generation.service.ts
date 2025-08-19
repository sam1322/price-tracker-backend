import { BadRequestException, Injectable } from '@nestjs/common';
import { GoogleGenAI, Modality } from '@google/genai';
// import * as path from 'path';
// import * as fs from 'fs';
// import * as buffer from 'node:buffer';

@Injectable()
export class ImageGenerationService {
  private ai: GoogleGenAI;

  constructor() {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not defined in environment variables');
    }
    this.ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  }

  // async generateImageByGoogle(
  async generateImage(prompt: string): Promise<Buffer> {
    try {
      let imageBuffer: Buffer | null = null;

      // Set responseModalities to include "Image" so the model can generate  an image
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.0-flash-preview-image-generation',
        contents: prompt,
        config: {
          responseModalities: [Modality.TEXT, Modality.IMAGE],
        },
      });
      if (!response.candidates?.[0]?.content?.parts) {
        throw new BadRequestException('No valid response from Gemini API');
      }

      // console.log('response', response);
      for (const part of response.candidates[0].content.parts) {
        // Based on the part type, either show the text or save the image
        // if (part.text) {
        //   console.log(part.text);
        // }
        if (part.inlineData) {
          const imageData = part.inlineData.data;
          // @ts-expect-error string blob type error
          imageBuffer = Buffer.from(imageData, 'base64');
          break; // Assuming we only need the first image

          // imagePath = path.join(
          //   process.cwd(),
          //   'uploads',
          //   `gemini_${jobId}_image_${index}_${Date.now()}.png`,
          // );

          // fs.writeFileSync(imagePath, buffer);
          // console.log('Image saved as ' + imagePath);
        }
      }
      if (!imageBuffer) {
        throw new BadRequestException('No valid response from Gemini API');
      }
      return imageBuffer;
    } catch (error) {
      throw new BadRequestException(
        'Gemini image generation error',
        error instanceof Error ? error.message : String(error),
      );
    }
  }
}
