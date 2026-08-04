import type { RouteId } from './assistant.routes-map';

export type AssistantMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type AssistantAction =
  | {
      type: 'navigate';
      route: RouteId;
      label: string;
    }
  | {
      type: 'none';
      label?: string;
    };

export type AssistantAppContext = {
  currentRoute?: string;
  pages?: Array<{ id: string; label: string; description?: string }>;
  sales?: unknown[];
  inventory?: unknown[];
  customers?: unknown[];
};

export type AssistantChatRequest = {
  message?: string;
  history?: AssistantMessage[];
  appContext?: AssistantAppContext;
};

export type AssistantChatResponse = {
  reply: string;
  action: AssistantAction;
};
