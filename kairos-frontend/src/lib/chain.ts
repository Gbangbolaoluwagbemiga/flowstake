// --- Legacy HashKey defaults (kept for backwards compatibility) ---
export const HASHKEY_RPC_URL = import.meta.env.VITE_HASHKEY_RPC_URL || "https://testnet.hsk.xyz";
export const HASHKEY_CHAIN_ID = Number(import.meta.env.VITE_HASHKEY_CHAIN_ID || 133);
export const HASHKEY_EXPLORER_BASE =
  import.meta.env.VITE_HASHKEY_EXPLORER_BASE || "https://testnet-explorer.hsk.xyz";

// --- Active chain (hackathon-friendly) ---
// Hackathon default: X Layer. (Set VITE_CHAIN_TARGET=hashkey only if you intentionally want legacy mode.)
export const CHAIN_TARGET = (import.meta.env.VITE_CHAIN_TARGET || "xlayer") as "hashkey" | "xlayer";

export const ACTIVE_CHAIN_ID =
  CHAIN_TARGET === "xlayer"
    ? Number(import.meta.env.VITE_XLAYER_CHAIN_ID || 1952)
    : HASHKEY_CHAIN_ID;

export const ACTIVE_EXPLORER_BASE =
  (CHAIN_TARGET === "xlayer"
    ? (import.meta.env.VITE_XLAYER_EXPLORER_BASE as string | undefined)
    : (import.meta.env.VITE_HASHKEY_EXPLORER_BASE as string | undefined)) ||
  (CHAIN_TARGET === "xlayer"
    ? "https://www.okx.com/web3/explorer/xlayer-test"
    : HASHKEY_EXPLORER_BASE);

export const ACTIVE_NATIVE_SYMBOL =
  (CHAIN_TARGET === "xlayer"
    ? (import.meta.env.VITE_XLAYER_NATIVE_SYMBOL as string | undefined)
    : (import.meta.env.VITE_HASHKEY_NATIVE_SYMBOL as string | undefined)) ||
  (CHAIN_TARGET === "xlayer" ? "OKB" : "HSK");

export const CHAIN_LABEL =
  (CHAIN_TARGET === "xlayer"
    ? (import.meta.env.VITE_XLAYER_NETWORK_LABEL as string | undefined)
    : (import.meta.env.VITE_HASHKEY_NETWORK_LABEL as string | undefined)) ||
  (CHAIN_TARGET === "xlayer" ? "X Layer Testnet" : "HashKey Chain Testnet");

export const KAIROS_API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export const txUrl = (hash: string) => `${ACTIVE_EXPLORER_BASE.replace(/\/$/, "")}/tx/${hash}`;
export const addressUrl = (addr: string) => `${ACTIVE_EXPLORER_BASE.replace(/\/$/, "")}/address/${addr}`;

