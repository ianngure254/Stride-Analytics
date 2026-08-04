import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { runAssistantChat } from './assistant.service';
import type { AssistantChatRequest } from './assistant.types';

export const chat = asyncHandler(async (req: Request<{}, {}, AssistantChatRequest>, res: Response) => {
  const { message, history = [], appContext } = req.body;

  if (!message?.trim()) {
    res.status(400).json({
      error: 'Message is required',
      code: 'ASSISTANT_MESSAGE_REQUIRED',
    });
    return;
  }

  const result = await runAssistantChat(message.trim(), history, appContext);

  res.json({
    data: result,
  });
});
