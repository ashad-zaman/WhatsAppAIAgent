import OpenAI from 'openai';
import { config } from '@whatsapp-ai/config';

let openaiClient: OpenAI | null = null;

export const getOpenAIClient = (): OpenAI => {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: config.openai.apiKey,
    });
  }
  return openaiClient;
};

export const llmService = {
  async chatCompletion(params: {
    model?: string;
    messages: OpenAI.Chat.ChatCompletionMessageParam[];
    temperature?: number;
    maxTokens?: number;
    tools?: OpenAI.Chat.ChatCompletionTool[];
    toolChoice?: OpenAI.Chat.ChatCompletionToolChoiceOption;
  }): Promise<OpenAI.Chat.ChatCompletion> {
    const client = getOpenAIClient();
    return client.chat.completions.create({
      model: params.model || config.openai.model,
      messages: params.messages,
      temperature: params.temperature ?? config.openai.temperature,
      max_tokens: params.maxTokens ?? config.openai.maxTokens,
      tools: params.tools,
      tool_choice: params.toolChoice,
    });
  },

  async generateText(params: {
    prompt: string;
    temperature?: number;
    maxTokens?: number;
    stop?: string[];
  }): Promise<string> {
    const completion = await this.chatCompletion({
      messages: [{ role: 'user', content: params.prompt }],
      temperature: params.temperature,
      maxTokens: params.maxTokens,
    });
    return completion.choices[0]?.message?.content || '';
  },

  async streamChat(params: {
    messages: OpenAI.Chat.ChatCompletionMessageParam[];
    temperature?: number;
    maxTokens?: number;
    onChunk?: (chunk: string) => void;
  }): Promise<string> {
    const client = getOpenAIClient();
    const stream = await client.chat.completions.create({
      model: params.model || config.openai.model,
      messages: params.messages,
      temperature: params.temperature ?? config.openai.temperature,
      max_tokens: params.maxTokens ?? config.openai.maxTokens,
      stream: true,
    });

    let fullContent = '';
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        fullContent += content;
        params.onChunk?.(content);
      }
    }
    return fullContent;
  },
};

export const embeddingService = {
  async createEmbedding(text: string): Promise<number[]> {
    const client = getOpenAIClient();
    const response = await client.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text,
    });
    return response.data[0].embedding;
  },

  async createEmbeddings(texts: string[]): Promise<number[][]> {
    const client = getOpenAIClient();
    const response = await client.embeddings.create({
      model: 'text-embedding-ada-002',
      input: texts,
    });
    return response.data.map((item) => item.embedding);
  },
};

export const whisperService = {
  async transcribe(
    audioUrl: string,
    options?: {
      language?: string;
      prompt?: string;
    }
  ): Promise<string> {
    const client = getOpenAIClient();
    
    const response = await fetch(audioUrl);
    const audioBuffer = await response.arrayBuffer();
    const audioFile = new File([audioBuffer], 'audio.ogg', { type: 'audio/ogg' });

    const transcription = await client.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: options?.language,
      prompt: options?.prompt,
    });

    return transcription.text;
  },
};

export const imageService = {
  async generateImage(params: {
    prompt: string;
    model?: string;
    n?: number;
    size?: '1024x1024' | '512x512' | '256x256';
  }): Promise<string[]> {
    const client = getOpenAIClient();
    const response = await client.images.generate({
      model: params.model || 'dall-e-3',
      prompt: params.prompt,
      n: params.n || 1,
      size: params.size || '1024x1024',
    });
    return response.data.map((img) => img.url || '');
  },
};

export const moderationService = {
  async checkContent(text: string): Promise<{
    flagged: boolean;
    categories: Record<string, boolean>;
  }> {
    const client = getOpenAIClient();
    const response = await client.moderations.create({
      input: text,
    });
    const result = response.results[0];
    return {
      flagged: result.flagged,
      categories: result.categories as Record<string, boolean>,
    };
  },
};

export default {
  getClient: getOpenAIClient,
  chat: llmService,
  embed: embeddingService,
  whisper: whisperService,
  image: imageService,
  moderation: moderationService,
};
