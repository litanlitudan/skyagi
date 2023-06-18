import { writable } from 'svelte/store';

const storedPreSavedModelTokenDataStore = localStorage.getItem("preSavedModelTokenDataStore");
export const preSavedModelTokenDataStore = writable(storedPreSavedModelTokenDataStore);

export default preSavedModelTokenDataStore;