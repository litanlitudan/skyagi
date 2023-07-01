import { StoreMessageRole, type StoreMessageType } from '$lib/types';
import { SSE } from 'sse.js';
import { get, writable } from 'svelte/store';

export interface ChatTranscript {
  messages: StoreMessageType[];
  chatState: 'idle' | 'loading' | 'error' | 'message';
}

const { subscribe, update, ...store } = writable<ChatTranscript>({
  messages: [],
  chatState: 'idle'
});

// put a new user input message to store
const set = async (query: string) => {
  updateMessages(query, StoreMessageRole.USER_AGENT, 'Me', 'loading');
  console.log('query', query);
  console.log('chatM', chatMessages);

  const request = {
    conversation_id: get(conversationId),
    initiate_agent_id: get(userAgentId),
    recipient_agent_id: get(currentAgentId),
    recipient_agent_model_settings: {
      llm: {
        type: "ChatOpenAI",
        provider: "OpenAI",
        name: "openai-gpt-3.5-turbo",
        args: {
          modelName: "gpt-3.5-turbo",
          maxTokens: 1500,
        }
      },
      embedding: {
        type: "OpenAIEmbeddings",
        provider: "OpenAI",
        name: "openai-text-embedding-ada-002",
        args: {
          modelName: "text-embedding-ada-002",
        }
      }
    },
    message: query,
  }

  console.log('request', request);

  const eventSource = new SSE('/api/send-conversation-message', {
    method: 'PUT',
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
    payload: JSON.stringify(request)
  });

  eventSource.addEventListener('error', handleError);
  eventSource.addEventListener('message', streamMessage);
  eventSource.stream();
};

const replace = (messages: ChatTranscript) => {
  store.set(messages);
};

const updateMessages = (content: any, role: StoreMessageRole, name: string, state: any) => {
  chatMessages.update((messages: ChatTranscript) => {
    return { messages: [...messages.messages, { role: role, content: content, name: name }], chatState: state };
  });
};

const handleError = <T>(err: T) => {
  updateMessages(err, StoreMessageRole.SYSTEM, 'bot', 'error');
  console.error(err);
};

// put a new AI generated answer to store
const streamMessage = (e: MessageEvent) => {
  console.log('e', e);
  console.log('streamMessage', e.data);

  try {
    if (e.data === '[DONE]') {
      updateMessages(get(answer), StoreMessageRole.AGENT, get(currentAgentName), 'idle');
      return answer.set('');
    }

    if (get(answer) === '...') answer.set('');

    const completionResponse = JSON.parse(e.data);
    const [{ delta }] = completionResponse.choices;

    if (delta.content) {
      answer.update((_a) => _a + delta.content);
    }
  } catch (err) {
    handleError(err);
  }
};

// These variables are the memory store for current chat thread. 
// aka, a specific combination of conversation id + agent id
export const chatMessages = { subscribe, set, update, replace };
export const answer = writable<string>('');
export const currentChatQueryKey = writable<string>('');
export const currentAgentName = writable<string>('');
export const currentAgentId = writable<string>('');

// These variables are the memory store for current chat room. 
// aka, a specific conversation id (might have multiple agents in this conversation room)
export const conversationId = writable<string>('');
export const userAgentId = writable<string>('');
export const agentIds = writable<string[]>([]);
