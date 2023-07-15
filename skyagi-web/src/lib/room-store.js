import { writable } from 'svelte/store';
import { browser } from "$app/environment";

const defaultValue = JSON.stringify({})
const initialValue = browser ? sessionStorage.getItem('modelTokenDataStore') ?? defaultValue : defaultValue;


const modelTokenDataStore = writable(initialValue);
modelTokenDataStore.subscribe((val) => browser && sessionStorage.setItem("modelTokenDataStore", val))
export default modelTokenDataStore;