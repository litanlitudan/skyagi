import { derived, get, writable } from 'svelte/store';
import { chatMessages, type ChatTranscript, currentChatQueryKey, currentAgentName, currentAgentId } from './chat-messages';
import { browser } from '$app/environment';

export const chatHistorySubscription = writable();

const setLocalHistory = <T>(history: T) =>
    localStorage.setItem('chatHistory', JSON.stringify(history));
const getLocalHistory = () => JSON.parse(localStorage.getItem('chatHistory') || '{}');

export const getLocalHistoryKey = (conversationId: string, agentId: string): string => `${conversationId}+${agentId}`;

export const loadHistoryToLocalStorage = <T>(history: T) =>
    setLocalHistory(history);

export const chatHistory = derived(chatMessages, ($chatMessages) => {
    if (!browser) return null;

    let history = localStorage.getItem('chatHistory');

    console.log('history', history);
    console.log('$chatMessages.messages', $chatMessages.messages);

    if (!history && !$chatMessages.messages) return null;

    if (!history && $chatMessages.messages.length === 1) return null;

    if (history && $chatMessages.messages && $chatMessages.messages.length === 1) return JSON.parse(history);

    const key = get(currentChatQueryKey); //conversation id + agent id is the query key
    const value = $chatMessages.messages;
    const obj = { [key]: value };

    console.log('value = $chatMessages.messages', $chatMessages.messages);

    if (!history) setLocalHistory(obj);

    const chatHistory = getLocalHistory();

    if (chatHistory) {
        chatHistory[key] = value;
        setLocalHistory(chatHistory);
        chatHistorySubscription.set(chatHistory);
        return chatHistory;
    }

    return null;
});

export const filterHistory = (key: string) => {
    const history = getLocalHistory();
    delete history[key];
    setLocalHistory(history);
    chatHistorySubscription.set(history);
};

const getHistory = (key: string) => getLocalHistory()[key]; //Returns the history for a given key

export const loadMessages = (query: string, agentName: string, agentId: string) => {
    console.log('query', query);
    console.log('agentName', agentName);
    console.log('agentId', agentId);
    if (get(chatMessages).chatState !== 'idle') return; //Prevents switching between messages while loading
    if (!query) return;

    const newMessages = getHistory(query) || [];
    currentChatQueryKey.set(query);
    currentAgentName.set(agentName);
    currentAgentId.set(agentId);
    chatMessages.replace({ messages: newMessages, chatState: 'idle' });
};
