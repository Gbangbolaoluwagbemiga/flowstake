import { ethers } from "ethers";
import type { ActiveEvmChainConfig } from "./evm-chain.js";

export type EvmChainPulseBlock = {
    number: number;
    timestamp: string;
    txCount: number;
    gasUsedRatio: string | null;
    /** Native token moved as Σ tx.value for the block. */
    nativeMoved: string;
    /** @deprecated compatibility alias */
    nativeMovedHsk?: string;
};

export async function fetchHashKeyChainPulse(args: {
    cfg: Pick<ActiveEvmChainConfig, "rpcUrl" | "chainId" | "nativeSymbol" | "networkLabel">;
    depth?: number;
}): Promise<{
    label: string;
    chainId: number;
    nativeSymbol: string;
    latestBlock: number;
    latestBaseFeeGwei: string | null;
    windowBlocks: number;
    blocks: EvmChainPulseBlock[];
    windowNativeMoved: string;
    /** @deprecated compatibility alias */
    windowNativeMovedHsk?: string;
    totalTxs: number;
    rpcHost: string;
    note: string;
}> {
    const depth = Math.min(20, Math.max(1, args.depth ?? 5));
    const provider = new ethers.JsonRpcProvider(args.cfg.rpcUrl, args.cfg.chainId);
    const net = await provider.getNetwork();
    const chainId = Number(net.chainId);
    const latest = await provider.getBlockNumber();
    const nativeSymbol = String(args.cfg.nativeSymbol || "NATIVE");

    let rpcHost = "rpc";
    try {
        rpcHost = new URL(args.cfg.rpcUrl).hostname;
    } catch {
        /* ignore */
    }

    const blocks: EvmChainPulseBlock[] = [];
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
            nativeMoved: ethers.formatEther(moved),
            nativeMovedHsk: ethers.formatEther(moved),
        });
    }

    return {
        label: String(args.cfg.networkLabel || "EVM chain (configured RPC)"),
        chainId,
        nativeSymbol,
        latestBlock: latest,
        latestBaseFeeGwei,
        windowBlocks: blocks.length,
        blocks,
        windowNativeMoved: ethers.formatEther(totalWei),
        windowNativeMovedHsk: ethers.formatEther(totalWei),
        totalTxs,
        rpcHost,
        note:
            "Native ‘moved’ sums tx.value per block (rough activity dial; excludes internal transfers and contract-internal accounting).",
    };
}
