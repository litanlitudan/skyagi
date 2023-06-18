import { writable } from 'svelte/store';
import { browser } from "$app/environment";

const defaultValue = []
const initialValue = browser ? window.localStorage.getItem('preSavedModelTokenDataStore') ?? defaultValue : defaultValue;

const preSavedModelTokenDataStore = writable(initialValue);

preSavedModelTokenDataStore.subscribe((value) => {
    if (browser) {
      window.localStorage.setItem('preSavedModelTokenDataStore', value);
    }
  });

export default preSavedModelTokenDataStore;