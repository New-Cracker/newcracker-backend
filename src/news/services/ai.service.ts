import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AiService {
  constructor(private readonly configService: ConfigService) {}

  async generateText(prompt: string): Promise<string> {
    const apiKey = this.configService.get<string>('GROQ_API_KEY') ?? '';

    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          max_tokens: 1024,
          temperature: 0.7,
          messages: [{ role: 'user', content: prompt }],
        }),
      },
    );

    if (!response.ok) {
      const errorBody = await response.json();
      console.error('AI 응답 에러:', response.status, errorBody);
      throw new InternalServerErrorException('AI 응답 오류가 발생했습니다.');
    }

    const data = (await response.json()) as {
      choices: { message: { content: string } }[];
    };

    return data.choices[0]?.message?.content ?? '';
  }

  async generateJson<T>(prompt: string): Promise<T> {
    const text = await this.generateText(prompt);
    return JSON.parse(text.replace(/```json|```/g, '').trim()) as T;
  }
}
