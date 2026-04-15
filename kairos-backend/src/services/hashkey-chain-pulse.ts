import { ethers } from "ethers";
import type { HashkeyChainConfig } from "./hashkey.js";
import { hashkeyProvider } from "./hashkey.js";

export type HashKeyPulseBlock = {
    number: number;
    timestamp: string;
    txCount: number;
    gasUsedRatio: string | null;
    nativeMovedHsk: string;
};

export async function fetchHashKeyChainPulse(args: {
    cfg: HashkeyChainConfig;
    depth?: number;
}): Promise<{
    label: string;
    chainId: number;
    latestBlock: number;
    latestBaseFeeGwei: string | null;
    windowBlocks: number;
    blocks: HashKeyPulseBlock[];
    windowNativeMovedHsk: string;
    totalTxs: number;
    rpcHost: string;
    note: string;
}> {
    const depth = Math.min(20, Math.max(1, args.depth ?? 5));
    const provider = hashkeyProvider(args.cfg);
    const net = await provider.getNetwork();
    const chainId = Number(net.chainId);
    const latest = await provider.getBlockNumber();

    let rpcHost = "rpc";
    try {
        rpcHost = new URL(args.cfg.rpcUrl).hostname;
    } catch {
        /* ignore */
    }

    const blocks: HashKeyPulseBlock[] = [];
    let totalWei = 0n;
    let totalTxs = 0;
    let latestBaseFeeGwei: string | null = null;

    for (let i = 0; i < depth; i++) {
        const n = latest - i;
        const block = await provider.getBlock(n, true);
        if (!block) continue;

        if (i === 0 && block.baseFeePerGas != null) {
            latestBaseFeeGwei = ethers.formatUnits(block.baseFeePerGas, "gwei");
        }

        const txs = block.transactions as readonly (string | ethers.TransactionResponse)[];
        let moved = 0n;
        for (const tx of txs) {
            if (typeof tx === "string") continue;
            moved += tx.value ?? 0n;
        }
        totalWei += moved;
        totalTxs += txs.length;

        let gasUsedRatio: string | null = null;
        if (block.gasLimit > 0n) {
            const pct = (block.gasUsed * 10000n) / block.gasLimit;
            gasUsedRatio = (Number(pct) / 100).toFixed(1) + "%";
        }

        blocks.push({
            number: n,
            timestamp: new Date(Number(block.timestamp) * 1000).toISOString(),
            txCount: txs.length,
            gasUsedRatio,
            nativeMovedHsk: ethers.formatEther(moved),
        });
    }

    return {
        label: "EVM chain (configured RPC)",
        chainId,
        latestBlock: latest,
        latestBaseFeeGwei,
        windowBlocks: blocks.length,
        blocks,
        windowNativeMovedHsk: ethers.formatEther(totalWei),
        totalTxs,
        rpcHost,
        note:
            "Native ‘moved’ sums tx.value per block (rough activity dial; excludes internal transfers and contract-internal accounting).",
    };
}
