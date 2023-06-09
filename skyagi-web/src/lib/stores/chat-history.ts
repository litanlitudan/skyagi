import { derived, get, writable } from 'svelte/store';
import { chatMessages, type ChatTranscript } from './chat-messages';
import { browser } from '$app/environment';

export const chatHistorySubscription = writable();

const setLocalHistory = <T>(history: T) =>
    localStorage.setItem('chatHistory', JSON.stringify(history));
const getLocalHistory = () => JSON.parse(localStorage.getItem('chatHistory') || '{}');

export const chatHistory = derived(chatMessages, ($chatMessages) => {
    if (!browser) return null;

    let history = localStorage.getItem('chatHistory');

    if (!history && $chatMessages.messages.length === 1) return null;

    if (history && $chatMessages.messages.length === 1) return JSON.parse(history);

    const key = $chatMessages.messages[1].content; //The second message is the query
    const value = $chatMessages.messages;
    const obj = { [key]: value };

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

export const loadMessages = (query: string) => {
    if (get(chatMessages).chatState !== 'idle') return; //Prevents switching between messages while loading
    if (!query) return;

    const newMessages = getHistory(query);
    chatMessages.replace({ messages: newMessages, chatState: 'idle' });
};
