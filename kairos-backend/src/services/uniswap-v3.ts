import { ethers } from "ethers";

const QUOTER_V1_ABI = [
    "function quoteExactInputSingle(address tokenIn,address tokenOut,uint24 fee,uint256 amountIn,uint160 sqrtPriceLimitX96) external returns (uint256 amountOut)",
];

// QuoterV2: https://docs.uniswap.org/contracts/v3/reference/periphery/lens/QuoterV2
const QUOTER_V2_ABI = [
    "function quoteExactInputSingle((address tokenIn,address tokenOut,uint256 amountIn,uint24 fee,uint160 sqrtPriceLimitX96)) external returns (uint256 amountOut,uint160 sqrtPriceX96After,uint32 initializedTicksCrossed,uint256 gasEstimate)",
];

function getEnv(name: string): string | undefined {
    const v = (process.env[name] || "").trim();
    return v || undefined;
}

function mustAddr(v: string | undefined, label: string): string {
    if (!v) throw new Error(`Missing ${label}`);
    if (!ethers.isAddress(v)) throw new Error(`Invalid address for ${label}: ${v}`);
    return ethers.getAddress(v);
}

export type UniswapV3QuoteArgs = {
    tokenIn: string;
    tokenOut: string;
    fee: number; // 500 | 3000 | 10000 typically
    amountIn: string; // decimal string, in raw token units (wei-like)
    sqrtPriceLimitX96?: string; // default: 0
};

export async function getUniswapV3Quote(args: UniswapV3QuoteArgs): Promise<{
    quoter: string;
    chainId: number;
    amountOut: string;
    gasEstimate?: string;
}> {
    const rpcUrl = getEnv("UNISWAP_RPC_URL") || "https://eth.llamarpc.com";
    const chainId = Number(getEnv("UNISWAP_CHAIN_ID") || 1);

    const quoter = mustAddr(
        getEnv("UNISWAP_V3_QUOTER_ADDRESS") || "0x61fFE014bA17989E743c5F6cB21bF9697530B21e", // mainnet QuoterV2
        "UNISWAP_V3_QUOTER_ADDRESS"
    );

    const tokenIn = mustAddr(args.tokenIn, "tokenIn");
    const tokenOut = mustAddr(args.tokenOut, "tokenOut");
    const fee = Number(args.fee);
    const amountIn = BigInt(args.amountIn);
    const sqrtPriceLimitX96 = args.sqrtPriceLimitX96 ? BigInt(args.sqrtPriceLimitX96) : 0n;

    const provider = new ethers.JsonRpcProvider(rpcUrl, chainId);
    const version = String(getEnv("UNISWAP_QUOTER_VERSION") || "v2").toLowerCase();

    if (version === "v1") {
        const q = new ethers.Contract(quoter, QUOTER_V1_ABI, provider);
        const amountOut: bigint = await q.quoteExactInputSingle(tokenIn, tokenOut, fee, amountIn, sqrtPriceLimitX96);
        return { quoter, chainId, amountOut: amountOut.toString() };
    }

    const q = new ethers.Contract(quoter, QUOTER_V2_ABI, provider);
    const res: readonly [bigint, bigint, number, bigint] = await q.quoteExactInputSingle({
        tokenIn,
        tokenOut,
        amountIn,
        fee,
        sqrtPriceLimitX96,
    });
    const [amountOut, , , gasEstimate] = res;
    return { quoter, chainId, amountOut: amountOut.toString(), gasEstimate: gasEstimate.toString() };
}

