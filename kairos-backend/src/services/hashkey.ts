import { ethers } from "ethers";

export type HashkeyChainConfig = {
    rpcUrl: string;
    chainId?: number;
    treasuryPrivateKey: string;
};

export type HashkeySpendPolicyConfig = {
    spendingPolicyAddress?: string; // optional
};

const SPENDING_POLICY_ABI = [
    "function canSpend(bytes32 agentKey,uint256 amountWei) view returns (bool)",
    "function remaining(bytes32 agentKey) view returns (uint256)",
    "function recordSpend(bytes32 agentKey,uint256 amountWei)",
];

function mustGetEnv(name: string): string {
    const v = (process.env[name] || "").trim();
    if (!v) throw new Error(`${name} is not set`);
    return v;
}

export function loadHashkeyConfigFromEnv(): HashkeyChainConfig {
    return {
        rpcUrl: mustGetEnv("HASHKEY_RPC_URL"),
        chainId: process.env.HASHKEY_CHAIN_ID ? Number(process.env.HASHKEY_CHAIN_ID) : undefined,
        treasuryPrivateKey: mustGetEnv("HASHKEY_TREASURY_PRIVATE_KEY"),
    };
}

export function hashkeyProvider(cfg: HashkeyChainConfig): ethers.JsonRpcProvider {
    return new ethers.JsonRpcProvider(cfg.rpcUrl, cfg.chainId);
}

// Treasury nonce management: we want to return tx hashes immediately (pending),
// without waiting for mining, while still preventing nonce collisions.
let treasuryNonceKey: string | null = null;
let treasuryNextNonce: number | null = null;

async function nextTreasuryNonce(provider: ethers.JsonRpcProvider, from: string, key: string): Promise<number> {
    if (treasuryNonceKey !== key) {
        treasuryNonceKey = key;
        treasuryNextNonce = null;
    }
    if (treasuryNextNonce === null) {
        treasuryNextNonce = await provider.getTransactionCount(from, "pending");
    }
    const n = treasuryNextNonce;
    treasuryNextNonce += 1;
    return n;
}

/**
 * Sends a native HSK transfer (treasury -> agent) and returns the tx hash.
 * Uses serialized callers upstream to avoid nonce races.
 */
export async function sendTreasuryPayment(args: {
    cfg: HashkeyChainConfig;
    to: string;
    amountWei: bigint;
    agentKey: string;
    label: string;
    spendingPolicy?: HashkeySpendPolicyConfig;
}): Promise<string> {
    const provider = hashkeyProvider(args.cfg);
    const wallet = new ethers.Wallet(args.cfg.treasuryPrivateKey, provider);
    const from = (await wallet.getAddress()).toLowerCase();
    const nonceKey = `${args.cfg.rpcUrl}:${from}`;

    /** When `1`, any canSpend revert or `false` blocks the payout. Default `0`: revert → pay anyway (demo / ABI mismatch). */
    const policyStrict = (process.env.KAIROS_SPENDING_POLICY_STRICT || "0").trim() === "1";

    // Optional: enforce spending policy (trusted backend records spends)
    let skipPolicy = false;
    if (args.spendingPolicy?.spendingPolicyAddress) {
        const policy = new ethers.Contract(args.spendingPolicy.spendingPolicyAddress, SPENDING_POLICY_ABI, wallet);
        const key = ethers.keccak256(ethers.toUtf8Bytes(args.agentKey));
        let ok = false;
        try {
            ok = await policy.canSpend(key, args.amountWei);
        } catch (e: any) {
            const msg = String(e?.message || e || "");
            if (policyStrict) {
                throw new Error(
                    `Spending policy canSpend() reverted for agent "${args.agentKey}" at ${args.spendingPolicy.spendingPolicyAddress}. ` +
                        `Set KAIROS_SPENDING_POLICY_STRICT=0 to allow treasury payout without this check, or fix the policy ABI / deployment. ` +
                        `Underlying: ${msg}`
                );
            }
            skipPolicy = true;
            console.warn(
                `[HashKey] canSpend reverted for ${args.agentKey} (${args.label}) — paying WITHOUT policy gate (KAIROS_SPENDING_POLICY_STRICT=0). ` +
                    `Set KAIROS_SPENDING_POLICY_STRICT=1 to hard-fail. ${msg.slice(0, 200)}`
            );
        }
        if (!skipPolicy && !ok) {
            let rem = 0n;
            try {
                rem = await policy.remaining(key);
            } catch {
                // ignore — remaining() may not exist on all policy deployments
            }
            throw new Error(
                `Spending policy blocked ${args.agentKey}: remaining=${ethers.formatEther(rem)} HSK, requested=${ethers.formatEther(args.amountWei)} HSK`
            );
        }
    }

    const waitConfirms = Math.max(0, Math.min(12, Number(process.env.KAIROS_TREASURY_TX_WAIT_CONFIRMS ?? "1") || 0));
    const waitTimeoutMs = Math.max(5000, Number(process.env.KAIROS_TX_WAIT_TIMEOUT_MS ?? "180000") || 180000);

    // Put label into tx metadata only via logs off-chain; native transfers can't carry memo.
    let tx: ethers.TransactionResponse;
    try {
        const nonce = await nextTreasuryNonce(provider, from, nonceKey);
        tx = await wallet.sendTransaction({
            to: args.to,
            value: args.amountWei,
            nonce,
        });
    } catch (e: any) {
        // If the RPC rejects due to nonce drift, reset and retry once.
        const msg = String(e?.message || "");
        if (msg.toLowerCase().includes("nonce") || msg.toLowerCase().includes("replacement")) {
            treasuryNonceKey = null;
            treasuryNextNonce = null;
            const nonce = await nextTreasuryNonce(provider, from, nonceKey);
            tx = await wallet.sendTransaction({
                to: args.to,
                value: args.amountWei,
                nonce,
            });
        } else {
            throw e;
        }
    }

    // Return the tx hash immediately (pending), and optionally await mining in background.
    if (waitConfirms > 0) {
        void tx.wait(waitConfirms, waitTimeoutMs).catch(() => {});
    }

    // Record spend after the transfer is settled (best-effort; do not fail the payment if this fails)
    if (args.spendingPolicy?.spendingPolicyAddress && !skipPolicy) {
        try {
            const policy = new ethers.Contract(args.spendingPolicy.spendingPolicyAddress, SPENDING_POLICY_ABI, wallet);
            const key = ethers.keccak256(ethers.toUtf8Bytes(args.agentKey));
            const rec = await policy.recordSpend(key, args.amountWei);
            void rec.wait(waitConfirms > 0 ? waitConfirms : 1, waitTimeoutMs).catch(() => {});
        } catch (e) {
            // non-fatal
            console.warn(`[HashKey] recordSpend failed for ${args.agentKey} (${args.label}):`, (e as Error)?.message);
        }
    }

    return tx.hash;
}

/**
 * Optional "true A2A" transfer: agent wallet pays another agent wallet.
 * If you don't provide the agent private key, caller should skip A2A.
 */
export async function sendAgentToAgentPayment(args: {
    rpcUrl: string;
    chainId?: number;
    fromPrivateKey: string;
    to: string;
    amountWei: bigint;
}): Promise<string> {
    const provider = new ethers.JsonRpcProvider(args.rpcUrl, args.chainId);
    const wallet = new ethers.Wallet(args.fromPrivateKey, provider);
    const tx = await wallet.sendTransaction({ to: args.to, value: args.amountWei });
    const waitConfirms = Math.max(0, Math.min(12, Number(process.env.KAIROS_A2A_TX_WAIT_CONFIRMS ?? "1") || 0));
    const waitTimeoutMs = Math.max(5000, Number(process.env.KAIROS_TX_WAIT_TIMEOUT_MS ?? "180000") || 180000);
    if (waitConfirms > 0) {
        await tx.wait(waitConfirms, waitTimeoutMs);
    }
    return tx.hash;
}

