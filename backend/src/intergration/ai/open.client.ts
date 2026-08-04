import OpenAI from 'openai';
import { env } from '../../config/env';

export const MODEL = env.AI_PROVIDER === 'gemini' ? env.GEMINI_MODEL : env.OPENAI_MODEL;
export const MAX_TOKENS = env.AI_PROVIDER === 'gemini' ? env.GEMINI_MAX_TOKENS : env.OPENAI_MAX_TOKENS;

// Provide an interface compatible with existing usage: openAI.chat.completions.create(opts)
export const openAI = {
  chat: {
    completions: {
      create: async (opts: any) => {
        if (env.AI_PROVIDER === 'openai') {
          const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
          return await client.chat.completions.create(opts);
        }

        const messages = opts.messages || [];
        const prompt = messages
          .map((m: any) => {
            const content = typeof m.content === 'string' ? m.content : JSON.stringify(m.content ?? {});
            if (m.role === 'system') {
              return `System: ${content}`;
            }

            return `${m.role === 'assistant' ? 'Model' : 'User'}: ${content}`;
          })
          .join('\n');
        const maxOutputTokens = Math.min(opts.max_tokens || MAX_TOKENS, 700);

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent`;
        const body: any = {
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            maxOutputTokens,
            temperature: typeof opts.temperature === 'number' ? opts.temperature : 0.2,
          },
        };

        try {
          const res = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': env.GEMINI_API_KEY,
            },
            body: JSON.stringify(body),
          });

          const raw = await res.text();

          if (!raw || raw.trim().length === 0) {
            return { choices: [{ message: { content: '' } }] };
          }

          let data: any = null;
          try {
            data = JSON.parse(raw);
          } catch {
            data = null;
          }

          const text =
            data?.candidates?.[0]?.content?.parts?.[0]?.text ??
            data?.candidates?.[0]?.content ??
            data?.outputText ??
            data?.text ??
            raw;

          return { choices: [{ message: { content: text } }] };
        } catch (err) {
          throw new Error(`AI provider request failed: ${err instanceof Error ? err.message : String(err)}`);
        }
      },
    },
  },
};
