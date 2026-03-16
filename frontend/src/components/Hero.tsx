export function Hero() {
    return (
        <div className="relative pt-20 pb-16 md:pt-32 md:pb-24">
            <div className="text-center space-y-8">
                <h1 className="text-4xl md:text-7xl font-black tracking-tighter bg-linear-to-r from-blue-400 via-white to-slate-500 bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    Preserve Staking Yield <br />
                    <span className="text-white">While You Swap.</span>
                </h1>
                <p className="max-w-2xl mx-auto text-slate-400 text-lg md:text-xl font-medium px-4">
                    FlowStake is a Uniswap v4 Hook that ensures Liquid Staking Tokens (LSTs) 
                    retain their yield deltas during cross-chain intent settlement.
                </p>
                <div className="flex flex-wrap justify-center gap-4 pt-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 rounded-full border border-blue-500/20 text-[10px] font-black uppercase tracking-widest text-blue-400">
                        Unichain Sepolia Deployed
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-500/10 rounded-full border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Reactive Lasna Deployed
                    </div>
                </div>
            </div>
        </div>
    );
}
