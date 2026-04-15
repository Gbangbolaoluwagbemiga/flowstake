export const HASHKEY_RPC_URL = import.meta.env.VITE_HASHKEY_RPC_URL || "https://testnet.hsk.xyz";
export const HASHKEY_CHAIN_ID = Number(import.meta.env.VITE_HASHKEY_CHAIN_ID || 133);
export const HASHKEY_EXPLORER_BASE =
  import.meta.env.VITE_HASHKEY_EXPLORER_BASE || "https://testnet-explorer.hsk.xyz";

export const KAIROS_API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export const txUrl = (hash: string) => `${HASHKEY_EXPLORER_BASE.replace(/\/$/, "")}/tx/${hash}`;
export const addressUrl = (addr: string) => `${HASHKEY_EXPLORER_BASE.replace(/\/$/, "")}/address/${addr}`;

