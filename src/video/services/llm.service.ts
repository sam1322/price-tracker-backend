// import { BadRequestException, Injectable } from '@nestjs/common';
//
// import { GoogleGenAI, Type } from '@google/genai';
//
// @Injectable()
// export class LLMService {
//   private ai: GoogleGenAI;
//
//   constructor() {
//     const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
//     this.ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
//   }
//
//   async generateScriptByGoogle(query: string): Promise<string> {
//     try {
//       const question = `Create a 30-second video script about: ${query}`;
//
//       const response = await this.ai.models.generateContent({
//         model: 'gemini-2.5-flash',
//         contents: question,
//         config: {
//           responseMimeType: 'application/json',
//           responseSchema: {
//             type: Type.OBJECT,
//             properties: {
//               narration: {
//                 type: Type.STRING,
//               },
//               visual_prompt: {
//                 type: Type.ARRAY,
//                 items: {
//                   type: Type.STRING,
//                 },
//               },
//             },
//             propertyOrdering: ['narration', 'visual_prompt'],
//           },
//         },
//       });
//
//       // The response structure is very similar to OpenAI's
//       return response.text || this.getDefaultScript();
//     } catch (error) {
//       // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
//       throw new BadRequestException('Gemini API error:', error);
//     }
//   }
//
//   private getDefaultScript(): string {
//     return 'Welcome to our video about making the perfect cup of coffee. First, we start with fresh coffee beans. Next, we grind them to the perfect consistency. Finally, we brew and enjoy our delicious coffee.';
//   }
// }

import { BadRequestException, Injectable } from '@nestjs/common';
import { GoogleGenAI, Type } from '@google/genai';

export interface ScriptSegment {
  description: string;
  visualPrompt: string;
  duration: number; // in seconds
}

export interface GeneratedScript {
  narration: string;
  scenes: ScriptSegment[];
  totalDuration: number;
}

@Injectable()
export class LLMService {
  private ai: GoogleGenAI;

  constructor() {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
    this.ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  }

  async generateScriptByGoogle(query: string): Promise<string> {
    try {
      // const question = `Create a 30-second video script about: ${query}.
      // Divide the narration into segments with their visual prompts and timing.
      // Each segment should have a duration in seconds.`;
      const question = `You are a video script writer. Generate a script with narration and scene descriptions. Each scene should have a duration in seconds. Create a 15-second video script about: ${query}.`;

      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: question,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              narration: {
                type: Type.STRING,
              },
              scenes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    description: { type: Type.STRING },
                    visualPrompt: { type: Type.STRING },
                    duration: { type: Type.NUMBER },
                  },
                },
              },
              totalDuration: {
                type: Type.NUMBER,
              },
            },
            propertyOrdering: ['narration', 'scenes', 'totalDuration'],
          },
        },
      });

      return response.text || this.getDefaultScript();
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      throw new BadRequestException('Gemini API error:', error);
    }
  }

  private getDefaultScript(): string {
    return JSON.stringify({
      narration:
        'Welcome to our video about making the perfect cup of coffee. First, we start with fresh coffee beans. Next, we grind them to the perfect consistency. Finally, we brew and enjoy our delicious coffee.',
      scenes: [
        {
          description:
            'Welcome to our video about making the perfect cup of coffee.',
          visualPrompt:
            'A steaming cup of coffee on a wooden table with coffee beans scattered around',
          duration: 5,
        },
        {
          description: 'First, we start with fresh coffee beans.',
          visualPrompt:
            'Close-up of fresh roasted coffee beans in a burlap sack',
          duration: 5,
        },
        {
          description: 'Next, we grind them to the perfect consistency.',
          visualPrompt: 'Coffee grinder in action with beans being ground',
          duration: 5,
        },
        {
          description: 'Finally, we brew and enjoy our delicious coffee.',
          visualPrompt: 'Hot coffee being poured into a white ceramic cup',
          duration: 5,
        },
      ],
      totalDuration: 20,
    });
  }
}

// llm.service.ts (continued)
// @Injectable()
// export class LLMService {
//   async generateScript(prompt: string): Promise<VideoScript> {
//     // Call to OpenAI/Gemini
//     const response = await this.callLLM(prompt);
//
//     return {
//       narration: response.narration,
//       scenes: response.scenes.map(scene => ({
//         description: scene.description,
//         visualPrompt: scene.visualPrompt,
//         duration: scene.duration,
//       })),
//     };
//   }
//
//   private async callLLM(prompt: string): Promise<any> {
//     // Example with OpenAI
//     const completion = await openai.chat.completions.create({
//       model: "gpt-4",
//       messages: [
//         {
//           role: "system",
//           content: "You are a video script writer. Generate a script with narration and scene descriptions."
//         },
//         {
//           role: "user",
//           content: `Create a 30-second video script about: ${prompt}.
//           Return JSON with format:
//           {
//             "narration": "full narration text",
//             "scenes": [
//               {
//                 "description": "what happens in this scene",
//                 "visualPrompt": "detailed prompt for image generation",
//                 "duration": 5
//               }
//             ]
//           }`
//         }
//       ],
//     });
//
//     return JSON.parse(completion.choices[0].message.content);
//   }
// }
//
// interface VideoScript {
//   narration: string;
//   scenes: Array<{
//     description: string;
//     visualPrompt: string;
//     duration: number;
//   }>;
// }
