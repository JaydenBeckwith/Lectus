import { getKV, setKV, delKV } from "./db";

const KEY = "secret:anthropic";

export const getApiKey = () => getKV(KEY);
export const setApiKey = (k) => setKV(KEY, k);
export const clearApiKey = () => delKV(KEY);
