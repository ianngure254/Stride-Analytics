import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { MAX_TOKENS, MODEL, openAI } from '../../intergration/ai/open.client';
import type {
  AssistantAction,
  AssistantAppContext,
  AssistantChatResponse,
  AssistantMessage,
} from './assistant.types';
import { isRouteId, routeKeywords, type RouteId } from './assistant.routes-map';

const APP_CONTEXT_PROMPT = `
You are Stride Assistant, an in-app assistant for Stride Analytics.
The app helps retail teams manage dashboard insights, sales, inventory, customers, deni/credit, Firebase auth, and admin access.

Use the supplied app context. Help the user do work faster, but do not claim that you changed backend data unless a supported action exists.
Supported automation action for now: navigating the user to the correct app page.

Reply as strict JSON only:
{
  "reply": "short helpful answer",
  "action": { "type": "navigate", "route": "dashboard|sales|inventory|customers|auth|home", "label": "Open page" }
}

If no navigation is needed, use:
{ "reply": "...", "action": { "type": "none" } }
`.trim();

const fallbackReply =
  'I can help you move around Stride Analytics and interpret sales, stock, customer credit, and dashboard context. Ask me what you want to review or open.';

const cleanHistory = (history: AssistantMessage[] = []) =>
  history
    .filter((message) => message.role === 'user' || message.role === 'assistant')
    .slice(-8)
    .map((message) => ({
      role: message.role,
      content: message.content.slice(0, 1200),
    }));

const summarizeContext = (appContext?: AssistantAppContext) => ({
  currentRoute: appContext?.currentRoute ?? 'unknown',
  pages: appContext?.pages ?? [],
  counts: {
    sales: appContext?.sales?.length ?? 0,
    inventory: appContext?.inventory?.length ?? 0,
    customers: appContext?.customers?.length ?? 0,
  },
  sampleData: {
    sales: appContext?.sales?.slice(0, 4) ?? [],
    inventory: appContext?.inventory?.slice(0, 6) ?? [],
    customers: appContext?.customers?.slice(0, 5) ?? [],
  },
});

const getDeterministicAction = (message: string): AssistantAction => {
  const lowerMessage = message.toLowerCase();
  const wantsNavigation = /\b(open|go to|show|take me|navigate|view)\b/.test(lowerMessage);

  if (!wantsNavigation) {
    return { type: 'none' };
  }

  const route = Object.entries(routeKeywords).find(([, keywords]) =>
    keywords.some((keyword) => lowerMessage.includes(keyword))
  )?.[0] as RouteId | undefined;

  if (!route) {
    return { type: 'none' };
  }

  return {
    type: 'navigate',
    route,
    label: `Open ${route}`,
  };
};

const parseAssistantJson = (content: string): AssistantChatResponse => {
  try {
    const parsed = JSON.parse(content) as Partial<AssistantChatResponse>;
    const action = parsed.action;

    if (action?.type === 'navigate' && isRouteId(action.route)) {
      return {
        reply: parsed.reply || fallbackReply,
        action: {
          type: 'navigate',
          route: action.route,
          label: action.label || `Open ${action.route}`,
        },
      };
    }

    return {
      reply: parsed.reply || fallbackReply,
      action: { type: 'none' },
    };
  } catch {
    return {
      reply: content.trim() || fallbackReply,
      action: { type: 'none' },
    };
  }
};

export const runAssistantChat = async (
  message: string,
  history: AssistantMessage[] = [],
  appContext?: AssistantAppContext
): Promise<AssistantChatResponse> => {
  const deterministicAction = getDeterministicAction(message);

  const isAiConfigured = env.AI_PROVIDER === 'openai' ? Boolean(env.OPENAI_API_KEY) : Boolean(env.GEMINI_API_KEY);
  if (!isAiConfigured) {
    return {
      reply: `The assistant endpoint is connected, but ${env.AI_PROVIDER === 'openai' ? 'OPENAI_API_KEY' : 'GEMINI_API_KEY'} is not configured on the backend yet.`,
      action: deterministicAction,
    };
  }

  try {
    const response = await openAI.chat.completions.create({
      model: MODEL,
      max_tokens: Math.min(MAX_TOKENS, 700),
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: APP_CONTEXT_PROMPT,
        },
        {
          role: 'user',
          content: `App context:\n${JSON.stringify(summarizeContext(appContext))}`,
        },
        ...cleanHistory(history),
        {
          role: 'user',
          content: message,
        },
      ],
    });

    const content = response.choices[0]?.message?.content ?? '';
    const parsed = parseAssistantJson(content);

    if (deterministicAction.type === 'navigate' && parsed.action.type === 'none') {
      return { ...parsed, action: deterministicAction };
    }

    return parsed;
  } catch (error) {
    logger.warn('Assistant chat failed', {
      message: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      reply: 'I could not reach the AI service right now. You can still use the navigation action if one was detected.',
      action: deterministicAction,
    };
  }
};
