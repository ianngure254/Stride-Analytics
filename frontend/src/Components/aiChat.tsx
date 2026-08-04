import { useEffect, useRef, useState, type FormEvent } from 'react'
import apiRequest, { type ApiError } from '../api/axios'
import {
  appRoutes,
  customers,
  inventoryItems,
  salesRecords,
  type RouteId,
} from '../pages/pageData'

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

type AssistantAction =
  | {
      type: 'navigate'
      route: RouteId
      label: string
    }
  | {
      type: 'none'
      label?: string
    }

type AssistantResponse = {
  data: {
    reply: string
    action: AssistantAction
  }
}

type AiChatProps = {
  activeRoute: RouteId
  onNavigate: (route: RouteId) => void
}

const starters = [
  'Show me low stock items',
  'Open sales',
  'What should I check today?',
]

const getApiError = (error: unknown) => {
  const apiError = error as Partial<ApiError>
  return apiError.message || 'The assistant could not respond. Please try again.'
}

const AiChat = ({ activeRoute, onNavigate }: AiChatProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Hi, I can help you navigate and understand sales, inventory, customers, deni, and dashboard insights.',
    },
  ])
  const [pendingAction, setPendingAction] = useState<AssistantAction>({ type: 'none' })
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState('')
  const messagesRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    messagesRef.current?.scrollTo({
      top: messagesRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages, isOpen])

  const sendMessage = async (messageText: string) => {
    const cleanMessage = messageText.trim()

    if (!cleanMessage) {
      setError('Enter a message for the assistant.')
      return
    }

    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: cleanMessage }]
    setMessages(nextMessages)
    setInput('')
    setError('')
    setPendingAction({ type: 'none' })
    setIsSending(true)

    try {
      const response = await apiRequest<AssistantResponse>('/assistant/chat', {
        method: 'POST',
        body: {
          message: cleanMessage,
          history: nextMessages.slice(-8),
          appContext: {
            currentRoute: activeRoute,
            pages: appRoutes,
            sales: salesRecords,
            inventory: inventoryItems,
            customers,
          },
        },
      })

      setMessages((currentMessages) => [
        ...currentMessages,
        {
          role: 'assistant',
          content: response.data.reply,
        },
      ])
      setPendingAction(response.data.action)
    } catch (chatError) {
      setError(getApiError(chatError))
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          role: 'assistant',
          content: 'I could not connect to the assistant service. Please confirm the backend server is running.',
        },
      ])
    } finally {
      setIsSending(false)
    }
  }

  const submitChat = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void sendMessage(input)
  }

  const applyAction = () => {
    if (pendingAction.type !== 'navigate') {
      return
    }

    onNavigate(pendingAction.route)
    setPendingAction({ type: 'none' })
    setIsOpen(false)
  }

  return (
    <div className="fixed bottom-24 right-4 z-40 sm:right-6 lg:bottom-6">
      {isOpen ? (
        <section className="flex h-[min(620px,calc(100vh-8rem))] w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-2xl sm:w-[420px]">
          <header className="border-b border-zinc-200 bg-emerald-700 px-4 py-3 text-white">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-black">Stride Assistant</h2>
                <p className="mt-1 text-xs text-emerald-50">Context-aware help for this workspace</p>
              </div>
              <button
                aria-label="Close assistant"
                className="grid h-9 w-9 place-items-center rounded-lg text-xl font-bold hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-white"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                x
              </button>
            </div>
          </header>

          <div ref={messagesRef} className="flex-1 space-y-3 overflow-y-auto bg-zinc-50 p-4">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}
              >
                <div
                  className={
                    message.role === 'user'
                      ? 'max-w-[85%] rounded-lg bg-emerald-700 px-3 py-2 text-sm leading-6 text-white'
                      : 'max-w-[85%] rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm leading-6 text-zinc-700'
                  }
                >
                  {message.content}
                </div>
              </div>
            ))}
            {isSending ? (
              <div className="max-w-[85%] rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-500">
                Thinking...
              </div>
            ) : null}
          </div>

          <div className="border-t border-zinc-200 bg-white p-3">
            {error ? (
              <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-900" role="alert">
                {error}
              </div>
            ) : null}

            {pendingAction.type === 'navigate' ? (
              <button
                className="mb-3 inline-flex min-h-10 w-full items-center justify-center rounded-lg bg-amber-500 px-3 py-2 text-sm font-black text-amber-950 transition hover:bg-amber-400"
                onClick={applyAction}
                type="button"
              >
                {pendingAction.label}
              </button>
            ) : null}

            <div className="mb-3 flex gap-2 overflow-x-auto">
              {starters.map((starter) => (
                <button
                  key={starter}
                  className="shrink-0 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-100"
                  onClick={() => void sendMessage(starter)}
                  type="button"
                >
                  {starter}
                </button>
              ))}
            </div>

            <form className="flex gap-2" onSubmit={submitChat}>
              <input
                className="min-h-11 min-w-0 flex-1 rounded-lg border border-zinc-300 px-3 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask the assistant..."
              />
              <button
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-emerald-700 px-4 text-sm font-black text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
                disabled={isSending}
                type="submit"
              >
                Send
              </button>
            </form>
          </div>
        </section>
      ) : (
        <button
          className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-emerald-700 px-4 py-3 text-sm font-black text-white shadow-xl transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2"
          onClick={() => setIsOpen(true)}
          type="button"
        >
          <span className="grid h-6 w-6 place-items-center rounded-md bg-white text-emerald-700">AI</span>
          Assistant
        </button>
      )}
    </div>
  )
}

export default AiChat
