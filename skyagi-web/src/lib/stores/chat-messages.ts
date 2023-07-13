import { StoreMessageRole, type StoreMessageType } from '$lib/types';
import { SSE } from 'sse.js';
import { get, writable } from 'svelte/store';
import modelTokenDataStore from '$lib/room-store.js';

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

  let modelTokenData: { [key: string]: any } = JSON.parse(get(modelTokenDataStore));
  const recipient_agent_id = get(currentAgentId);
  const modelDataForCurrentAgent = modelTokenData[recipient_agent_id];

  const request = {
    conversation_id: get(conversationId),
    initiate_agent_id: get(userAgentId),
    recipient_agent_id: recipient_agent_id,
    recipient_agent_model_settings: {
      llm: {
        type: modelDataForCurrentAgent.data.type,
        provider: modelDataForCurrentAgent.data.provider,
        name: modelDataForCurrentAgent.data.name,
        args: {
          modelName: modelDataForCurrentAgent.data.args.modelName,
          maxTokens: modelDataForCurrentAgent.data.args.maxTokens,
          openAIApiKey: modelDataForCurrentAgent.data.args.openAIApiKey,
        }
      },
      embedding: {
        type: modelDataForCurrentAgent.embedding.type,
        provider: modelDataForCurrentAgent.embedding.provider,
        name: modelDataForCurrentAgent.embedding.name,
        args: {
          modelName: modelDataForCurrentAgent.embedding.args.modelName,
          openAIApiKey: modelDataForCurrentAgent.embedding.args.openAIApiKey,
        }
      }
    },
    message: query,
  }

  const eventSource = new SSE('/api/send-conversation-message', {
    headers: {
      'Content-Type': 'application/json'
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

  try {
    if (e.data === '[DONE]') {
      updateMessages(get(answer), StoreMessageRole.AGENT, get(currentAgentName), 'idle');
      return answer.set('');
    }

    if (get(answer) === '...') answer.set('');

    if (e.data.match(/\"\{(.*?)\}\"/g)) {  // TODO: handle metadata
      const metaData = JSON.parse(e.data);
      console.log('metaData', metaData);
      const metaDataStr = JSON.stringify(metaData);
      console.log('metaDataStr', metaDataStr);
      const metaDataObj = JSON.parse(metaDataStr);
      console.log('metaDataObj', metaDataObj);
      console.log('metaDataObj.if_continue', metaDataObj.if_continue);
      console.log('metaDataObj["if_continue"]', metaDataObj["if_continue"]);
      if (metaDataObj.if_continue) {
        console.log('metaDataObj.if_continue', metaDataObj.if_continue);
      }
    } else { // not matching JSON regex meaning it's pure conversation content not JSON
      answer.update((_a) => _a + (e.data ? e.data : " "));
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
