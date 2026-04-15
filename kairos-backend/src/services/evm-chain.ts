import { ethers } from "ethers";

export type EvmChainTarget = "hashkey" | "xlayer";

export type ActiveEvmChainConfig = {
    target: EvmChainTarget;
    rpcUrl: string;
    chainId?: number;
    treasuryPrivateKey: string;
    nativeSymbol: string;
    networkLabel: string;
    explorerBase?: string;
};

function mustGetEnv(name: string): string {
    const v = (process.env[name] || "").trim();
    if (!v) throw new Error(`${name} is not set`);
    return v;
}

function getEnv(name: string): string | undefined {
    const v = (process.env[name] || "").trim();
    return v || undefined;
}

function normalizePk(pk: string): string {
    return pk.startsWith("0x") ? pk : `0x${pk}`;
}

function readTreasuryPrivateKeyForTarget(target: EvmChainTarget): string {
    // Preferred: chain-agnostic key
    const generic = getEnv("KAIROS_TREASURY_PRIVATE_KEY");
    if (generic) return normalizePk(generic);

    // Fallbacks: chain-specific or legacy
    if (target === "xlayer") {
        const v = getEnv("XLAYER_TREASURY_PRIVATE_KEY") || getEnv("HASHKEY_TREASURY_PRIVATE_KEY");
        if (v) return normalizePk(v);
    }
    const legacy = getEnv("HASHKEY_TREASURY_PRIVATE_KEY");
    if (legacy) return normalizePk(legacy);

    // Preserve old error shape so existing deployments are obvious
    return normalizePk(mustGetEnv("HASHKEY_TREASURY_PRIVATE_KEY"));
}

export function loadActiveEvmChainFromEnv(): ActiveEvmChainConfig {
    const rawTarget = String(process.env.KAIROS_CHAIN_TARGET || "hashkey").trim().toLowerCase();
    const target: EvmChainTarget = rawTarget === "xlayer" ? "xlayer" : "hashkey";

    if (target === "xlayer") {
        return {
            target,
            rpcUrl: mustGetEnv("XLAYER_RPC_URL"),
            // X Layer testnet chainId (per docs) is 1952; allow override via env.
            chainId: process.env.XLAYER_CHAIN_ID ? Number(process.env.XLAYER_CHAIN_ID) : 1952,
            treasuryPrivateKey: readTreasuryPrivateKeyForTarget(target),
            nativeSymbol: String(process.env.XLAYER_NATIVE_SYMBOL || "OKB").trim() || "OKB",
            networkLabel: String(process.env.XLAYER_NETWORK_LABEL || "X Layer Testnet").trim() || "X Layer Testnet",
            explorerBase: getEnv("XLAYER_EXPLORER_BASE"),
        };
    }

    return {
        target,
        rpcUrl: mustGetEnv("HASHKEY_RPC_URL"),
        chainId: process.env.HASHKEY_CHAIN_ID ? Number(process.env.HASHKEY_CHAIN_ID) : 133,
        treasuryPrivateKey: readTreasuryPrivateKeyForTarget(target),
        nativeSymbol: String(process.env.HASHKEY_NATIVE_SYMBOL || "HSK").trim() || "HSK",
        networkLabel: String(process.env.HASHKEY_NETWORK_LABEL || "HashKey Chain Testnet").trim() || "HashKey Chain Testnet",
        explorerBase: getEnv("HASHKEY_EXPLORER_BASE"),
    };
}

export function activeJsonRpcProvider(cfg: ActiveEvmChainConfig): ethers.JsonRpcProvider {
    return new ethers.JsonRpcProvider(cfg.rpcUrl, cfg.chainId);
}

export function activeTreasuryAddress(cfg: ActiveEvmChainConfig): string {
    return new ethers.Wallet(cfg.treasuryPrivateKey).address;
}

