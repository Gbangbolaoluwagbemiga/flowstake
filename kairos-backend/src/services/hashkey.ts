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
    const tx = await wallet.sendTransaction({
        to: args.to,
        value: args.amountWei,
    });

    // Wait until the payout is mined before releasing the treasury queue; otherwise the next
    // payout can reuse a nonce that is still pending → "replacement fee too low" on HashKey RPC.
    if (waitConfirms > 0) {
        await tx.wait(waitConfirms, waitTimeoutMs);
    }

    // Record spend after the transfer is settled (best-effort; do not fail the payment if this fails)
    if (args.spendingPolicy?.spendingPolicyAddress && !skipPolicy) {
        try {
            const policy = new ethers.Contract(args.spendingPolicy.spendingPolicyAddress, SPENDING_POLICY_ABI, wallet);
            const key = ethers.keccak256(ethers.toUtf8Bytes(args.agentKey));
            const rec = await policy.recordSpend(key, args.amountWei);
            if (waitConfirms > 0) {
                await rec.wait(waitConfirms, waitTimeoutMs);
            } else {
                void rec.wait().catch(() => {});
            }
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

