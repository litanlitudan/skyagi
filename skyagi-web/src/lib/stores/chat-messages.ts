import { StoreMessageRole, type StoreMessageType } from '$lib/types';
import { SSE } from 'sse.js';
import { get, writable } from 'svelte/store';
import modelTokenDataStore from '$lib/room-store.js';
import { should } from 'chai';

export interface ChatTranscript {
  messages: StoreMessageType[];
  chatState: 'idle' | 'loading' | 'error' | 'message';
}

const { subscribe, update, ...store } = writable<ChatTranscript>({
  messages: [],
  chatState: 'idle'
});

const getModelInfoForAgent = (agentId: string) => {
  let modelTokenData: { [key: string]: any } = JSON.parse(get(modelTokenDataStore));
  return modelTokenData[agentId];
};

// put a new user input message to store
const set = async (query: string) => {
  updateMessages(query, StoreMessageRole.USER_AGENT, 'Me', 'loading');

  const recipient_agent_id = get(currentAgentId);
  const modelDataForCurrentAgent = getModelInfoForAgent(recipient_agent_id);

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
  };

  const eventSource = new SSE('/api/send-conversation-message', {
    headers: {
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify(request)
  });

  ifContinue.set(true);
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

const handleSystemMessage = (message: string) => {
  updateMessages(message, StoreMessageRole.SYSTEM, 'bot', 'system');
  console.info(message);
};

const getBiDirectionCombinations = (agentIds: string[]): string[][] => {
  // eg, [a, b, c] -> [ab, ac, ba, bc, ca, cb]
  if (!agentIds) return [];
  let result = [];
  for (var i = 0; i < agentIds.length; i++) {
    // This is where you'll capture that last value
    for (var j = 0; j < agentIds.length; j++) {
      if (j !== i) result.push([agentIds[i], agentIds[j]]);
    }
  }
  return result;
};

const getOneDirectionCombinations = (agentIds: string[]): string[][] => {
  // eg, [a, b, c] -> [ab, ac, bc]
  if (!agentIds) return [];
  let result = [];
  for (var i = 0; i < agentIds.length - 1; i++) {
    // This is where you'll capture that last value
    for (var j = i + 1; j < agentIds.length; j++) {
      result.push([agentIds[i], agentIds[j]]);
    }
  }
  return result;
};

// This will return message if content is valid
// Otherwise, return empty content
const getSendSystemMessageContentResult = async (conversationId: string, initiateAgentId: string, recipientAgentId: string) => {
  const modelDataForRecipientAgent = getModelInfoForAgent(recipientAgentId);
  const request = {
    conversation_id: conversationId,
    initiate_agent_id: initiateAgentId,
    recipient_agent_id: recipientAgentId,
    recipient_agent_model_settings: {
      llm: {
        type: modelDataForRecipientAgent.data.type,
        provider: modelDataForRecipientAgent.data.provider,
        name: modelDataForRecipientAgent.data.name,
        args: {
          modelName: modelDataForRecipientAgent.data.args.modelName,
          maxTokens: modelDataForRecipientAgent.data.args.maxTokens,
          openAIApiKey: modelDataForRecipientAgent.data.args.openAIApiKey,
        }
      },
      embedding: {
        type: modelDataForRecipientAgent.embedding.type,
        provider: modelDataForRecipientAgent.embedding.provider,
        name: modelDataForRecipientAgent.embedding.name,
        args: {
          modelName: modelDataForRecipientAgent.embedding.args.modelName,
          openAIApiKey: modelDataForRecipientAgent.embedding.args.openAIApiKey,
        }
      }
    },
    start_time: "2023-06-01T01:06:23.415Z",
  };
  console.log("calling /api/send-system-message");
  const resp = await fetch('/api/send-system-message', {
    headers: {
      'Content-Type': 'application/json'
    },
    method: 'PUT',
    body: JSON.stringify(request),
  });
  const data = await resp.json();
  console.log("finished /api/send-system-message", data);
  return data;
};

// This is the non-streaming version of send conversation message
const sendConversationMessage = async (conversationId: string, initiateAgentId: string, recipientAgentId: string, query: string) => {
  const modelDataForRecipientAgent = getModelInfoForAgent(recipientAgentId);

  const request = {
    conversation_id: conversationId,
    initiate_agent_id: initiateAgentId,
    recipient_agent_id: recipientAgentId,
    recipient_agent_model_settings: {
      llm: {
        type: modelDataForRecipientAgent.data.type,
        provider: modelDataForRecipientAgent.data.provider,
        name: modelDataForRecipientAgent.data.name,
        args: {
          modelName: modelDataForRecipientAgent.data.args.modelName,
          maxTokens: modelDataForRecipientAgent.data.args.maxTokens,
          openAIApiKey: modelDataForRecipientAgent.data.args.openAIApiKey,
        }
      },
      embedding: {
        type: modelDataForRecipientAgent.embedding.type,
        provider: modelDataForRecipientAgent.embedding.provider,
        name: modelDataForRecipientAgent.embedding.name,
        args: {
          modelName: modelDataForRecipientAgent.embedding.args.modelName,
          openAIApiKey: modelDataForRecipientAgent.embedding.args.openAIApiKey,
        }
      }
    },
    message: query,
    no_streaming: true,
  };
  console.log("going to send conversation message for whisper")
  // /api/send-conversation-message-no-stream non streaming version TBA
  const resp = await fetch('/api/send-conversation-message-no-stream', {
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request),
  });
  const data = await resp.json();
  console.log("finished /api/send-conversation-message", data);
  return data;
};

const agentsSystemMessagingProcess = async (biDirection = false) => {
  // For each pair, start with calling system message. 
  // eg, agent A asks agent B for system message, the result is the content that A want to talk to B
  // After that we can use conversation message to let A talk to B with the content returned by system message endpoint
  // the conversation keeps going until if_continue is false
  // .... repeat above for other pairs.
  console.log("inside of agentsSystemMessagingProcess");
  console.log('get(agentIds)', get(agentIds));
  const agentPairs: string[][] = biDirection ? getBiDirectionCombinations(get(agentIds)) : getOneDirectionCombinations(get(agentIds));
  console.log('agentPairs', agentPairs);
  if (agentPairs) handleSystemMessage(`Something is happening around the world...`)
  agentPairs.forEach(async pair => {
    // Send system message to know the content to start conversation
    console.log(`${pair[0]} to ${pair[1]} going to send system message`);
    const systemMessageResult = await getSendSystemMessageContentResult(get(conversationId), pair[0], pair[1]);
    if (!systemMessageResult.success) {
      handleError(`${pair[0]} ${pair[1]} failed to whisper`);
    } else if (systemMessageResult.is_valid && systemMessageResult.message) {
      console.log("has systemMessageResult");
      console.log(`${pair[0]} is whispering to ${pair[1]}`);
      handleSystemMessage(`${pair[0]} is whispering to ${pair[1]}`);
      const initialConversationMessage = systemMessageResult.message;
      console.log('initialConversationMessage', initialConversationMessage);
      // Send conversation messages between pair[0] and pair[1], until one of them doesn't want to continue
      let shouldContinue = true; // TODO: change to True
      let conversationContent = initialConversationMessage;
      while (shouldContinue) {
        const resp = await sendConversationMessage(get(conversationId), pair[0], pair[1], conversationContent);
        // Parse result
        console.log('!!!sendConversationMessage', resp);
        shouldContinue = false;
      }
    } else { //  System tells us that there's nothing to conversate between the two agents.
      console.log(`${pair[0]} has nothing to whisper to ${pair[1]}`);
      handleSystemMessage(`${pair[0]} has nothing to whisper to ${pair[1]}`);
    }
  });
};



// put a new AI generated answer to store
const streamMessage = async (e: MessageEvent) => {
  console.log('e.data', e.data);
  try {
    if (e.data === '[DONE]') {
      console.log("I finished a conversation message!!!!")
      updateMessages(get(answer), StoreMessageRole.AGENT, get(currentAgentName), 'idle');
      answer.set('');
      console.log('ifContinue', get(ifContinue));
      if (!get(ifContinue)) {
        console.log("going to call agentsSystemMessagingProcess");
        await agentsSystemMessagingProcess(true);
        console.log("finished calling agentsSystemMessagingProcess");
      }
      console.log("going to return");
      ifContinue.set(true);
      return;
    }

    if (get(answer) === '...') answer.set('');

    if (e.data.match(/\"\{(.*?)\}\"/g)) {
      const metaDataStr = JSON.parse(e.data); // Note: need parse twice the first time JSON parse is still a string, maybe the string was over stringified.
      const metaData = JSON.parse(metaDataStr);
      if (metaData.if_continue !== undefined && metaData.if_continue === false) {
        // Time to call send-system-message to whisper
        console.log('Time to call system message');
        ifContinue.set(false);
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

// This is sentence level variable, will reset for each conversation response.
export const ifContinue = writable<boolean>(true);
